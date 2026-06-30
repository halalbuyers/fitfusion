import type { NextApiRequest, NextApiResponse } from 'next'
import { getAuth } from '@clerk/nextjs/server'
import formidable from 'formidable'
import fs from 'fs'
import cloudinary from '../../../lib/cloudinary'
import { connectToDatabase } from '../../../lib/mongodb'
import TryOnAvatar from '../../../models/TryOnAvatar'
import { createSyntheticAvatar, createUploadedAvatar } from '../../../lib/tryon/avatarEngine'

export const config = {
  api: { bodyParser: false }
}

function setPrivateNoStore(res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store, max-age=0, must-revalidate')
  res.setHeader('Vary', 'Cookie')
}

function fieldValue(fields: any, key: string) {
  const value = fields[key]
  return Array.isArray(value) ? value[0] : value
}

function uploadToCloudinary(filePath: string, userId: string) {
  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      folder: `fitfusion/tryon/${userId}`,
      resource_type: 'image',
      type: 'upload',
      overwrite: false
    }, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
  })
}

async function parseMultipart(req: NextApiRequest) {
  const form = formidable({ multiples: false })
  return new Promise<{ fields: any; files: any }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err)
      else resolve({ fields, files })
    })
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  setPrivateNoStore(res)
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(req.method || '')) {
    res.setHeader('Allow', ['GET', 'POST', 'PATCH', 'DELETE'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  const { userId } = getAuth(req)
  if (!userId) return res.status(401).json({ error: 'Unauthorized' })

  try {
    await connectToDatabase()
  } catch {
    if (req.method === 'GET') return res.status(200).json([])
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' })
  }

  try {
    if (req.method === 'GET') {
      const avatars = await TryOnAvatar.find({ userId }).sort({ active: -1, updatedAt: -1 }).lean()
      return res.status(200).json(avatars)
    }

    if (req.method === 'POST') {
      const contentType = String(req.headers['content-type'] || '')
      let payload: any

      if (contentType.includes('multipart/form-data')) {
        const { fields, files } = await parseMultipart(req)
        const file = Array.isArray(files.file) ? files.file[0] : files.file
        if (!file) return res.status(400).json({ error: 'Avatar photo is required' })
        const result = await uploadToCloudinary(file.filepath, userId)
        try { fs.unlinkSync(file.filepath) } catch {}
        payload = createUploadedAvatar({
          name: fieldValue(fields, 'name'),
          sourceType: fieldValue(fields, 'sourceType'),
          imageUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height
        })
      } else {
        const buffers: Buffer[] = []
        for await (const chunk of req) buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        const body = buffers.length ? JSON.parse(Buffer.concat(buffers).toString('utf8')) : {}
        payload = createSyntheticAvatar({ name: body.name, style: body.style })
      }

      await TryOnAvatar.updateMany({ userId }, { $set: { active: false } })
      const avatar = await TryOnAvatar.create({ userId, ...payload, active: true })
      return res.status(201).json(avatar)
    }

    if (req.method === 'PATCH') {
      const buffers: Buffer[] = []
      for await (const chunk of req) buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      const body = buffers.length ? JSON.parse(Buffer.concat(buffers).toString('utf8')) : {}
      const avatar = await TryOnAvatar.findOne({ _id: String(body.id || ''), userId })
      if (!avatar) return res.status(404).json({ error: 'Avatar not found' })
      if (typeof body.name === 'string') avatar.name = body.name.slice(0, 80)
      if (body.active) {
        await TryOnAvatar.updateMany({ userId }, { $set: { active: false } })
        avatar.active = true
      }
      await avatar.save()
      return res.status(200).json(avatar)
    }

    const id = String(req.query.id || '')
    const deleted = await TryOnAvatar.findOneAndDelete({ _id: id, userId })
    if (!deleted) return res.status(404).json({ error: 'Avatar not found' })
    return res.status(200).json({ ok: true })
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Could not process avatar' })
  }
}
