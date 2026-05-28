import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import cloudinary from '../../lib/cloudinary'
import { analyzeImage } from '../../ai/openai'
import { connectToDatabase } from '../../lib/mongodb'
import Clothing from '../../models/Clothing'
import { getAuth } from '@clerk/nextjs/server'
import { analyzeClothing } from '../../lib/fashion'
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
        fieldValue(fields, 'color'),
        fieldValue(fields, 'style'),
        fieldValue(fields, 'season'),
        fieldValue(fields, 'brand'),
        fieldValue(fields, 'fitType'),
        fieldValue(fields, 'material'),
        fieldValue(fields, 'tags')
      ].filter(Boolean).join(' ')

      const fallbackAnalysis = analyzeClothing(manualText)
      const aiAnalysis = await analyzeImage(result.secure_url).catch(() => fallbackAnalysis)
      const analysis = {
        ...fallbackAnalysis,
        ...aiAnalysis,
        colors: aiAnalysis.colors?.length ? aiAnalysis.colors : fallbackAnalysis.colors,
        tags: aiAnalysis.tags?.length ? aiAnalysis.tags : fallbackAnalysis.tags
      }

      const tags = parseTags(fieldValue(fields, 'tags'))
      const occasions = parseTags(fieldValue(fields, 'occasion'))
      const colors = parseTags(fieldValue(fields, 'colors'))

      const payload = {
        userId,
        image: result.secure_url,
        category: fieldValue(fields, 'category') || analysis.category || 'accessories',
        color: fieldValue(fields, 'color') || colors[0] || analysis.colors?.[0] || 'black',
        colors: colors.length ? colors : analysis.colors || ['black'],
        style: fieldValue(fields, 'style') || analysis.style || 'minimal',
        season: fieldValue(fields, 'season') || analysis.season || 'all-season',
        occasion: occasions.length ? occasions : analysis.occasion || [],
        tags: tags.length ? tags : analysis.tags || [],
        brand: fieldValue(fields, 'brand'),
        fitType: fieldValue(fields, 'fitType') || analysis.fitType,
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
