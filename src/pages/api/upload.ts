import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import cloudinary from '../../lib/cloudinary'
import { analyzeImage } from '../../ai/openai'
import { connectToDatabase } from '../../lib/mongodb'
import Clothing from '../../models/Clothing'
import FashionProfile from '../../models/FashionProfile'
import UserPreference from '../../models/UserPreference'
import { getAuth } from '@clerk/nextjs/server'
import { analyzeClothingText, mergeFashionAnalysis } from '../../lib/fashion-analysis'
import { parseTags } from '../../lib/api'
import { extractImageColors, type ExtractedImageColors } from '../../lib/image-color-extraction'
import { classifyClothingCategory } from '../../lib/local-category-classifier'
import { EMBEDDING_VERSION, generateClothingEmbedding } from '../../lib/embedding-engine'
import { buildConfirmedClothingPayload } from '../../lib/wardrobe-confirmation'
import { normalizeReviewCategory, normalizeReviewColor } from '../../lib/review-options'
import { sanitizeCategoryForFashionType } from '../../lib/outfit-engine-profile'

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

type CorrectionRow = { count?: number; [key: string]: unknown }

function matchingCorrection(
  corrections: CorrectionRow[] | undefined,
  predictedKey: string,
  _correctedKey: string,
  predictedValue?: string
) {
  const predicted = String(predictedValue || '').trim().toLowerCase()
  if (!predicted || predicted === 'unknown') return null
  return (corrections || [])
    .filter((item) => String(item[predictedKey] || '').trim().toLowerCase() === predicted)
    .sort((a, b) => Number(b.count || 0) - Number(a.count || 0))[0] || null
}

function applyCorrectionMemory(input: {
  predictedCategory: string
  categoryConfidence: number
  predictedColor: string
  colorConfidence: number
  preference: any
}) {
  const categoryCorrection = matchingCorrection(
    input.preference?.correctedCategories,
    'predictedCategory',
    'correctedCategory',
    input.predictedCategory
  )
  const colorCorrection = matchingCorrection(
    input.preference?.correctedColors,
    'predictedColor',
    'correctedColor',
    input.predictedColor
  )
  const categoryCorrectionCount = Number(categoryCorrection?.count || 0)
  const colorCorrectionCount = Number(colorCorrection?.count || 0)

  const category = categoryCorrection && categoryCorrectionCount >= 2
    ? String(categoryCorrection.correctedCategory)
    : input.predictedCategory
  const primaryColor = colorCorrection && colorCorrectionCount >= 2
    ? String(colorCorrection.correctedColor)
    : input.predictedColor

  return {
    category,
    primaryColor,
    categoryConfidence: Math.max(0, Math.min(100, input.categoryConfidence + (categoryCorrectionCount ? Math.min(18, categoryCorrectionCount * 6) : 0))),
    colorConfidence: Math.max(0, Math.min(100, input.colorConfidence + (colorCorrectionCount ? Math.min(18, colorCorrectionCount * 6) : 0))),
    appliedCorrections: {
      category: categoryCorrectionCount >= 2 ? categoryCorrection : null,
      color: colorCorrectionCount >= 2 ? colorCorrection : null
    }
  }
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
      let profile: any = null
      let userPreference: any = null
      try {
        await connectToDatabase()
        const [fashionProfile, preference] = await Promise.all([
          FashionProfile.findOne({ userId }),
          UserPreference.findOne({ userId }).lean().catch(() => null)
        ])
        profile = fashionProfile
        userPreference = preference
      } catch {
        // Proceed without fashion profile if the database is unavailable during upload analysis
      }
      const classifiedCategory = sanitizeCategoryForFashionType(
        fieldValue(fields, 'category') || categoryClassification.category,
        profile?.fashionType || 'prefer-not-to-specify'
      )
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
      const correctionMemory = applyCorrectionMemory({
        predictedCategory: classifiedCategory,
        categoryConfidence,
        predictedColor: primaryColor,
        colorConfidence,
        preference: userPreference
      })
      const finalCategory = sanitizeCategoryForFashionType(
        fieldValue(fields, 'category') || correctionMemory.category,
        profile?.fashionType || 'prefer-not-to-specify'
      )
      const finalPrimaryColor = knownColor(fieldValue(fields, 'primaryColor'))
        || knownColor(fieldValue(fields, 'color'))
        || knownColor(correctionMemory.primaryColor)
        || primaryColor
      console.log('CATEGORY RESOLUTION:', {
        userId,
        fashionType: profile?.fashionType,
        manualCategory: fieldValue(fields, 'category'),
        aiCategory: analysis.category,
        classifiedCategory: categoryClassification.category,
        finalCategory,
        appliedCorrections: correctionMemory.appliedCorrections
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
        category: finalCategory,
        primaryColor: finalPrimaryColor,
        secondaryColors: resolvedSecondaryColors,
        colors: colors.length ? colors : (detectedColors.length ? detectedColors : (finalPrimaryColor === 'unknown' ? [] : [finalPrimaryColor, ...resolvedSecondaryColors])),
        style: fieldValue(fields, 'style') || analysis.style || 'casual',
        season: fieldValue(fields, 'season') || analysis.season || 'all-season',
        occasion: occasions.length ? occasions : analysis.occasion || [],
        tags: tags.length ? tags : analysis.tags || [],
        brand: fieldValue(fields, 'brand'),
        fit: fieldValue(fields, 'fit') || fieldValue(fields, 'fitType') || analysis.fit,
        fitType: fieldValue(fields, 'fitType') || fieldValue(fields, 'fit') || analysis.fitType,
        material: fieldValue(fields, 'material') || analysis.material,
        aiCategory: classifiedCategory,
        aiColor: analysis.primaryColor,
        categoryConfidence: correctionMemory.categoryConfidence,
        colorConfidence: correctionMemory.colorConfidence
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
