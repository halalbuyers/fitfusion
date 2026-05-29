import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import cloudinary from '../../lib/cloudinary'
import { analyzeImage } from '../../ai/openai'
import { connectToDatabase } from '../../lib/mongodb'
import Clothing from '../../models/Clothing'
import { getAuth } from '@clerk/nextjs/server'
import { analyzeClothingText, detectCategoryFromFilename, mergeFashionAnalysis, normalizeCategory } from '../../lib/fashion-analysis'
import { parseTags } from '../../lib/api'

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
      const filenameCategory = detectCategoryFromFilename(file.originalFilename || '')

      const tags = parseTags(fieldValue(fields, 'tags'))
      const occasions = parseTags(fieldValue(fields, 'occasion'))
      const colors = parseTags(fieldValue(fields, 'colors'))
      const secondaryColors = parseTags(fieldValue(fields, 'secondaryColors'))
      const primaryColor = fieldValue(fields, 'primaryColor') || fieldValue(fields, 'color') || colors[0] || analysis.primaryColor || 'unknown'
      const category = fieldValue(fields, 'category')
        ? normalizeCategory(fieldValue(fields, 'category'))
        : analysis.category && analysis.category !== 'accessories' && analysis.category !== 'unknown'
          ? normalizeCategory(analysis.category)
          : filenameCategory

      const payload = {
        userId,
        image: result.secure_url,
        category,
        primaryColor,
        secondaryColors: secondaryColors.length ? secondaryColors : (colors.length ? colors.slice(1) : analysis.secondaryColors || []),
        color: primaryColor,
        colors: colors.length ? colors : (primaryColor === 'unknown' ? [] : [primaryColor, ...(secondaryColors.length ? secondaryColors : analysis.secondaryColors || [])]),
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

      try {
        await connectToDatabase()
        const clothing = await Clothing.create(payload)
        return res.status(201).json({ clothing, analysis, persisted: true })
      } catch (dbError: any) {
        const message = String(dbError?.message || '')
        if (message.includes('ECONNREFUSED') || message.includes('querySrv') || message.includes('MONGODB_URI')) {
          return res.status(201).json({
            clothing: { ...payload, _id: `temp-${Date.now()}` },
            analysis,
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
