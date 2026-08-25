import { z } from 'zod'

export const knowledgeTypeSchema = z.enum(['POST', 'PDF', 'VIDEO'])
export const knowledgeStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])

export const knowledgeFileRules: Record<string, { extension: string, max: number }> = {
  'application/pdf': { extension: 'pdf', max: 50 * 1024 * 1024 },
  'video/mp4': { extension: 'mp4', max: 1024 * 1024 * 1024 },
  'video/webm': { extension: 'webm', max: 1024 * 1024 * 1024 },
}

export const imageFileRules: Record<string, { extension: string, max: number }> = {
  'image/jpeg': { extension: 'jpg', max: 10 * 1024 * 1024 },
  'image/png': { extension: 'png', max: 10 * 1024 * 1024 },
  'image/webp': { extension: 'webp', max: 10 * 1024 * 1024 },
}

export const safeExternalVideoUrl = (value?: string) => {
  if (!value) { return null }
  const parsed = z.url().safeParse(value)
  if (!parsed.success || !value.startsWith('https://')) {
    throw createError({ statusCode: 422, statusMessage: 'Informe uma URL HTTPS válida para o vídeo' })
  }
  return value
}

export const knowledgeStoragePath = (itemId: string, area: 'media' | 'images', extension: string) =>
  `items/${itemId}/${area}/${crypto.randomUUID()}.${extension}`
