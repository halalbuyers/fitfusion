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
import { extractImageColors } from '../../lib/image-color-extraction'
import { classifyClothingCategory } from '../../lib/local-category-classifier'
import { EMBEDDING_VERSION, generateClothingEmbedding } from '../../lib/embedding-engine'

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

      const extractedColors = await extractImageColors(file.filepath).catch(() => ({
        primaryColor: 'unknown',
        secondaryColors: [],
        colors: [],
        rawHex: []
      }))
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

      const tags = parseTags(fieldValue(fields, 'tags'))
      const occasions = parseTags(fieldValue(fields, 'occasion'))
      const colors = parseTags(fieldValue(fields, 'colors'))
      const secondaryColors = parseTags(fieldValue(fields, 'secondaryColors'))
      const detectedColors = extractedColors.colors.length ? extractedColors.colors : analysis.colors
      const primaryColor = fieldValue(fields, 'primaryColor') || fieldValue(fields, 'color') || colors[0] || extractedColors.primaryColor || analysis.primaryColor || 'unknown'
      const resolvedSecondaryColors = secondaryColors.length
        ? secondaryColors
        : colors.length
          ? colors.slice(1)
          : extractedColors.secondaryColors.length
            ? extractedColors.secondaryColors
            : analysis.secondaryColors || []
      const categoryClassification = await classifyClothingCategory({
        manualCategory: fieldValue(fields, 'category'),
        filename: file.originalFilename || '',
        text: manualText,
        aiCategory: analysis.category
      })

      const payload = {
        userId,
        image: result.secure_url,
        category: categoryClassification.category,
        primaryColor,
        secondaryColors: resolvedSecondaryColors,
        color: primaryColor,
        colors: colors.length ? colors : (detectedColors.length ? detectedColors : (primaryColor === 'unknown' ? [] : [primaryColor, ...resolvedSecondaryColors])),
        style: fieldValue(fields, 'style') || analysis.style || 'casual',
        season: fieldValue(fields, 'season') || analysis.season || 'all-season',
        occasion: occasions.length ? occasions : analysis.occasion || [],
        tags: tags.length ? tags : analysis.tags || [],
        brand: fieldValue(fields, 'brand'),
        fit: fieldValue(fields, 'fit') || fieldValue(fields, 'fitType') || analysis.fit,
        fitType: fieldValue(fields, 'fitType') || fieldValue(fields, 'fit') || analysis.fitType,
        formalityScore: analysis.formalityScore,
        warmthScore: analysis.warmthScore,
        material: fieldValue(fields, 'material') || analysis.material
      }
      const payloadWithEmbedding = {
        ...payload,
        embedding: generateClothingEmbedding(payload),
        embeddingVersion: EMBEDDING_VERSION
      }

      try {
        await connectToDatabase()
        const clothing = await Clothing.create(payloadWithEmbedding)
        return res.status(201).json({ clothing, analysis: { ...analysis, extractedColors, categoryClassification }, persisted: true })
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
  } catch (error: any) {
    console.error('UPLOAD ERROR:', error)

return res.status(500).json({
  error: error?.message || 'Upload failed'
})
  }
}
