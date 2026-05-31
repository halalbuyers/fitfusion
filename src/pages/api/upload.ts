import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import cloudinary from '../../lib/cloudinary'
import { analyzeImage } from '../../ai/openai'
import { connectToDatabase } from '../../lib/mongodb'
import Clothing from '../../models/Clothing'
import { getAuth } from '@clerk/nextjs/server'
import { analyzeClothingText, mergeFashionAnalysis } from '../../lib/fashion-analysis'
import { parseTags } from '../../lib/api'
import { extractImageColors, type ExtractedImageColors } from '../../lib/image-color-extraction'
import { classifyClothingCategory } from '../../lib/local-category-classifier'
import { EMBEDDING_VERSION, generateClothingEmbedding } from '../../lib/embedding-engine'
import { buildConfirmedClothingPayload } from '../../lib/wardrobe-confirmation'
import { normalizeReviewCategory, normalizeReviewColor } from '../../lib/review-options'

export const config = {
  api: { bodyParser: false }
}

async function uploadToCloudinary(filePath: string) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, { folder: 'fitfusion/wardrobe' }, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
  })
}

function fieldValue(fields: any, key: string) {
  const value = fields[key]
  return Array.isArray(value) ? value[0] : value
}

function knownColor(value?: string) {
  const color = String(value || '').trim().toLowerCase()
  return color && color !== 'unknown' && color !== 'auto' ? color : undefined
}

function booleanField(value: unknown) {
  const text = Array.isArray(value) ? value[0] : value
  return text === true || String(text || '').toLowerCase() === 'true'
}

function estimateCategoryConfidence(input: {
  manualCategory?: string
  aiCategory?: string
  filename?: string
  classifiedCategory: string
  classifierConfidence: number
}) {
  if (input.manualCategory) return 100
  const normalizedAi = normalizeReviewCategory(input.aiCategory)
  const normalizedClassified = normalizeReviewCategory(input.classifiedCategory)
  const normalizedFilename = normalizeReviewCategory(input.filename)
  let confidence = Math.round(input.classifierConfidence * 100)
  if (normalizedAi !== 'other' && normalizedAi === normalizedClassified) confidence += 18
  if (normalizedFilename !== 'other' && normalizedFilename === normalizedClassified) confidence += 12
  return Math.max(0, Math.min(100, confidence))
}

function estimateColorConfidence(input: {
  manualColor?: string
  extractedPrimaryColor?: string
  aiPrimaryColor?: string
  extractionFailed?: boolean
  clothingCoverage?: number
  warnings?: string[]
}) {
  if (input.manualColor) return 100
  const extracted = normalizeReviewColor(input.extractedPrimaryColor)
  const ai = normalizeReviewColor(input.aiPrimaryColor)
  if (extracted === 'unknown' && ai === 'unknown') return 0
  if (input.extractionFailed) return ai !== 'unknown' ? 58 : 0

  let confidence = extracted !== 'unknown' ? 86 : 60
  if ((input.clothingCoverage || 0) >= 0.25) confidence += 8
  if (input.warnings?.length) confidence -= 14
  if (extracted !== 'unknown' && ai !== 'unknown' && extracted === ai) confidence += 6
  return Math.max(0, Math.min(100, confidence))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const auth = getAuth(req)
  const userId = auth.userId
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  const form = formidable({ multiples: false })
  
  try {
    const { fields, files } = await new Promise<{ fields: any, files: any }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        else resolve({ fields, files })
      })
    })

    const file = Array.isArray(files.file) ? files.file[0] : files.file
    if (!file) return res.status(400).json({ error: 'No file provided' })

      const extractedColors: ExtractedImageColors = await extractImageColors(file.filepath, {
        category: fieldValue(fields, 'category'),
        filename: file.originalFilename || ''
      }).catch((error) => {
        console.log('RAW VIBRANT COLORS:', { error: error?.message || error })
        return {
          primaryColor: 'unknown',
          secondaryColors: [],
          colors: [],
          rawHex: [],
          extractionFailed: true,
          region: undefined
        }
      })
      const result: any = await uploadToCloudinary(file.filepath)
      try { fs.unlinkSync(file.filepath) } catch {}

      const manualText = [
        fieldValue(fields, 'category'),
        fieldValue(fields, 'primaryColor') || fieldValue(fields, 'color'),
        fieldValue(fields, 'style'),
        fieldValue(fields, 'season'),
        fieldValue(fields, 'brand'),
        fieldValue(fields, 'fit') || fieldValue(fields, 'fitType'),
        fieldValue(fields, 'material'),
        fieldValue(fields, 'tags')
      ].filter(Boolean).join(' ')

      const fallbackAnalysis = analyzeClothingText(manualText)
      const aiAnalysis = await analyzeImage(result.secure_url).catch(() => fallbackAnalysis)
      const analysis = mergeFashionAnalysis(fallbackAnalysis, aiAnalysis)
      console.log('AI COLORS:', {
        fallback: {
          primaryColor: fallbackAnalysis.primaryColor,
          secondaryColors: fallbackAnalysis.secondaryColors,
          colors: fallbackAnalysis.colors
        },
        ai: {
          primaryColor: aiAnalysis.primaryColor,
          secondaryColors: aiAnalysis.secondaryColors,
          colors: aiAnalysis.colors
        },
        merged: {
          primaryColor: analysis.primaryColor,
          secondaryColors: analysis.secondaryColors,
          colors: analysis.colors
        }
      })

      const tags = parseTags(fieldValue(fields, 'tags'))
      const occasions = parseTags(fieldValue(fields, 'occasion'))
      const colors = parseTags(fieldValue(fields, 'colors'))
      const secondaryColors = parseTags(fieldValue(fields, 'secondaryColors'))
      const detectedColors = extractedColors.colors.length ? extractedColors.colors : analysis.colors
      const primaryColor = knownColor(fieldValue(fields, 'primaryColor'))
        || knownColor(fieldValue(fields, 'color'))
        || knownColor(colors[0])
        || knownColor(extractedColors.primaryColor)
        || knownColor(analysis.primaryColor)
        || 'unknown'
      const categoryClassification = await classifyClothingCategory({
        manualCategory: fieldValue(fields, 'category'),
        filename: file.originalFilename || '',
        text: manualText,
        aiCategory: analysis.category
      })
      const categoryConfidence = estimateCategoryConfidence({
        manualCategory: fieldValue(fields, 'category'),
        aiCategory: analysis.category,
        filename: file.originalFilename || '',
        classifiedCategory: categoryClassification.category,
        classifierConfidence: categoryClassification.confidence
      })
      const colorConfidence = estimateColorConfidence({
        manualColor: fieldValue(fields, 'primaryColor') || fieldValue(fields, 'color'),
        extractedPrimaryColor: extractedColors.primaryColor,
        aiPrimaryColor: analysis.primaryColor,
        extractionFailed: extractedColors.extractionFailed,
        clothingCoverage: extractedColors.region?.clothingCoverage,
        warnings: extractedColors.region?.warnings
      })
      const resolvedSecondaryColors = secondaryColors.length
        ? secondaryColors
        : colors.length
          ? colors.slice(1)
          : extractedColors.secondaryColors.length
            ? extractedColors.secondaryColors
            : analysis.secondaryColors || []

      const reviewedInput = {
        userId,
        image: result.secure_url,
        category: fieldValue(fields, 'category') || categoryClassification.category,
        primaryColor,
        secondaryColors: resolvedSecondaryColors,
        colors: colors.length ? colors : (detectedColors.length ? detectedColors : (primaryColor === 'unknown' ? [] : [primaryColor, ...resolvedSecondaryColors])),
        style: fieldValue(fields, 'style') || analysis.style || 'casual',
        season: fieldValue(fields, 'season') || analysis.season || 'all-season',
        occasion: occasions.length ? occasions : analysis.occasion || [],
        tags: tags.length ? tags : analysis.tags || [],
        brand: fieldValue(fields, 'brand'),
        fit: fieldValue(fields, 'fit') || fieldValue(fields, 'fitType') || analysis.fit,
        fitType: fieldValue(fields, 'fitType') || fieldValue(fields, 'fit') || analysis.fitType,
        material: fieldValue(fields, 'material') || analysis.material,
        aiCategory: analysis.category,
        aiColor: analysis.primaryColor,
        categoryConfidence,
        colorConfidence
      }
      const payload = buildConfirmedClothingPayload(reviewedInput)
      console.log('FINAL PAYLOAD COLOR:', {
        primaryColor: payload.primaryColor,
        secondaryColors: payload.secondaryColors,
        colors: payload.colors,
        rawHex: extractedColors.rawHex
      })
      console.log('FINAL PAYLOAD COLOR:', payload.primaryColor)
      const payloadWithEmbedding = {
        ...payload,
        embedding: generateClothingEmbedding(payload),
        embeddingVersion: EMBEDDING_VERSION
      }
      const shouldAutoSave = booleanField(fieldValue(fields, 'autoSaveHighConfidence')) && categoryConfidence >= 90 && colorConfidence >= 90

      if (shouldAutoSave) try {
        await connectToDatabase()
        console.log('MONGODB SAVE COLORS:', {
          primaryColor: payloadWithEmbedding.primaryColor,
          colors: payloadWithEmbedding.colors
        })
        const clothing = await Clothing.create(payloadWithEmbedding)
        return res.status(201).json({
          clothing,
          prediction: payload,
          analysis: { ...analysis, extractedColors, categoryClassification },
          autoSaved: true,
          persisted: true
        })
      } catch (dbError: any) {
        const message = String(dbError?.message || '')
        if (message.includes('ECONNREFUSED') || message.includes('querySrv') || message.includes('MONGODB_URI')) {
          return res.status(201).json({
            clothing: { ...payloadWithEmbedding, _id: `temp-${Date.now()}` },
            analysis: { ...analysis, extractedColors, categoryClassification },
            persisted: false,
            warning: 'Saved to cloud image storage, but database is currently unavailable.'
          })
        }
        throw dbError
      }

      return res.status(200).json({
        draft: {
          image: result.secure_url,
          category: payload.category,
          primaryColor: payload.primaryColor,
          secondaryColors: payload.secondaryColors,
          colors: payload.colors,
          style: payload.style,
          season: payload.season,
          occasion: payload.occasion,
          tags: payload.tags,
          brand: payload.brand || '',
          fit: payload.fit,
          fitType: payload.fitType,
          material: payload.material || '',
          aiCategory: payload.aiCategory,
          aiColor: payload.aiColor,
          categoryConfidence,
          colorConfidence
        },
        analysis: { ...analysis, extractedColors, categoryClassification },
        autoSaved: false,
        persisted: false,
        requiresReview: true
      })
  } catch (error: any) {
    console.error('UPLOAD ERROR:', error)

return res.status(500).json({
  error: error?.message || 'Upload failed'
})
  }
}
