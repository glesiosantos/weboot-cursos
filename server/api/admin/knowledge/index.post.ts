import { serverSupabaseServiceRole } from '#supabase/server'
import { requireRole } from '../../../utils/auth'
import { imageFileRules, knowledgeFileRules, knowledgeStatusSchema, knowledgeStoragePath, knowledgeTypeSchema, safeExternalVideoUrl } from '../../../utils/knowledge'

const field = (parts: Awaited<ReturnType<typeof readMultipartFormData>>, name: string) => parts?.find(part => part.name === name && !part.filename)?.data.toString().trim() ?? ''

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, ['ADMIN'])
  const parts = await readMultipartFormData(event)
  const title = field(parts, 'title')
  const summary = field(parts, 'summary') || null
  const content = field(parts, 'content') || null
  const contentType = knowledgeTypeSchema.safeParse(field(parts, 'contentType'))
  const status = knowledgeStatusSchema.safeParse(field(parts, 'status') || 'DRAFT')
  if (title.length < 3 || title.length > 160 || !contentType.success || !status.success) {
    throw createError({ statusCode: 422, statusMessage: 'Título, tipo ou situação inválidos' })
  }
  if (contentType.data === 'POST' && !content) { throw createError({ statusCode: 422, statusMessage: 'O conteúdo do post é obrigatório' }) }
  const media = parts?.find(part => part.name === 'media' && part.filename)
  const externalUrl = contentType.data === 'VIDEO' ? safeExternalVideoUrl(field(parts, 'externalUrl') || undefined) : null
  if (contentType.data === 'PDF' && (!media?.type || media.type !== 'application/pdf')) {
    throw createError({ statusCode: 422, statusMessage: 'Selecione um arquivo PDF válido' })
  }
  if (contentType.data === 'VIDEO' && !externalUrl && (!media?.type || !['video/mp4', 'video/webm'].includes(media.type))) {
    throw createError({ statusCode: 422, statusMessage: 'Envie um vídeo MP4/WebM ou informe uma URL HTTPS' })
  }
  const images = parts?.filter(part => part.name === 'images' && part.filename) ?? []
  const altTexts = parts?.filter(part => part.name === 'imageAlt')?.map(part => part.data.toString().trim()) ?? []
  if (images.some((image, index) => !image.type || !imageFileRules[image.type] || image.data.byteLength > imageFileRules[image.type]!.max || !altTexts[index])) {
    throw createError({ statusCode: 422, statusMessage: 'Cada imagem deve ser JPEG, PNG ou WEBP, ter até 10 MB e possuir texto alternativo' })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = serverSupabaseServiceRole(event) as any
  const itemId = crypto.randomUUID()
  const uploaded: string[] = []
  let filePath: string | null = null
  try {
    if (media?.type) {
      const rule = knowledgeFileRules[media.type]
      if (!rule || media.data.byteLength > rule.max) { throw createError({ statusCode: 422, statusMessage: 'Arquivo inválido ou acima do limite permitido' }) }
      filePath = knowledgeStoragePath(itemId, 'media', rule.extension)
      const { error } = await admin.storage.from('knowledge-library').upload(filePath, media.data, { contentType: media.type })
      if (error) { throw createError({ statusCode: 400, statusMessage: 'Não foi possível enviar o arquivo principal' }) }
      uploaded.push(filePath)
    }
    const { data: item, error: itemError } = await admin.from('knowledge_items').insert({
      id: itemId, title, summary, content_type: contentType.data, content, external_url: externalUrl,
      file_path: filePath, mime_type: media?.type ?? null, file_size: media?.data.byteLength ?? null,
      status: status.data, created_by: user.sub,
    }).select().single()
    if (itemError) { throw createError({ statusCode: 400, statusMessage: itemError.message }) }
    for (const [index, image] of images.entries()) {
      const rule = imageFileRules[image.type!]!
      const path = knowledgeStoragePath(itemId, 'images', rule.extension)
      const { error: uploadError } = await admin.storage.from('knowledge-library').upload(path, image.data, { contentType: image.type })
      if (uploadError) { throw createError({ statusCode: 400, statusMessage: `Não foi possível enviar a imagem ${index + 1}` }) }
      uploaded.push(path)
      const { error: imageError } = await admin.from('knowledge_item_images').insert({ knowledge_item_id: itemId, file_path: path, alt_text: altTexts[index], position: index })
      if (imageError) { throw createError({ statusCode: 400, statusMessage: imageError.message }) }
    }
    return item
  }
  catch (error) {
    await admin.from('knowledge_items').delete().eq('id', itemId)
    if (uploaded.length) { await admin.storage.from('knowledge-library').remove(uploaded) }
    throw error
  }
})
