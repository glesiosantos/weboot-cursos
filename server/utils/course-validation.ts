import { z } from 'zod'

export const courseStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'])
export const courseTypeSchema = z.enum(['ONLINE', 'PRESENCIAL'])
export const pricingTypeSchema = z.enum(['FIXED', 'BATCHES'])
export const courseBatchSchema = z.object({
  name: z.string().trim().min(1, 'Nome do lote obrigatório').max(120),
  position: z.coerce.number().int().positive(),
  price: z.coerce.number().min(0),
  max_sales: z.coerce.number().int().positive(),
  starts_at: z.iso.datetime().nullable().optional(), ends_at: z.iso.datetime().nullable().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'SOLD_OUT', 'EXPIRED', 'DISABLED']).default('DRAFT'),
  activation_mode: z.enum(['QUANTITY', 'DATE', 'QUANTITY_OR_DATE']),
}).superRefine((value, ctx) => {
  if (value.starts_at && value.ends_at && new Date(value.ends_at) <= new Date(value.starts_at)) { ctx.addIssue({ code: 'custom', path: ['ends_at'], message: 'O fim do lote deve ser posterior ao início' }) }
  if (value.activation_mode !== 'QUANTITY' && !value.starts_at && !value.ends_at) { ctx.addIssue({ code: 'custom', path: ['starts_at'], message: 'Informe ao menos uma data neste modo' }) }
})
export const slugSchema = z.string().min(1).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido')

export const presentialDetailsSchema = z.object({
  location_name: z.string().trim().min(1), address: z.string().trim().nullable().optional(), address_number: z.string().trim().nullable().optional(),
  complement: z.string().trim().nullable().optional(), neighborhood: z.string().trim().nullable().optional(), city: z.string().trim().min(1),
  state: z.string().trim().length(2).transform(value => value.toUpperCase()), postal_code: z.string().trim().nullable().optional(),
  starts_at: z.iso.datetime(), ends_at: z.iso.datetime(), registration_deadline: z.iso.datetime().nullable().optional(), max_students: z.coerce.number().int().positive(),
}).superRefine((value, ctx) => {
  if (new Date(value.ends_at) < new Date(value.starts_at)) { ctx.addIssue({ code: 'custom', path: ['ends_at'], message: 'O término deve ser posterior ao início' }) }
  if (value.registration_deadline && new Date(value.registration_deadline) > new Date(value.starts_at)) { ctx.addIssue({ code: 'custom', path: ['registration_deadline'], message: 'As inscrições devem encerrar antes do início' }) }
})

export const courseSchema = z.object({
  title: z.string().trim().min(1, 'Título obrigatório').max(160), slug: slugSchema,
  short_description: z.string().trim().max(280).default(''), description: z.string().trim().default(''),
  course_type: courseTypeSchema, instructor_id: z.uuid().nullable().optional(), workload_hours: z.coerce.number().positive(),
  price: z.coerce.number().min(0), promotional_price: z.coerce.number().min(0).nullable().optional(),
  pricing_type: pricingTypeSchema.default('FIXED'), show_future_batches: z.boolean().default(false), batches: z.array(courseBatchSchema).default([]),
  status: courseStatusSchema.default('DRAFT'), program: z.string().trim().nullable().optional(), requirements: z.string().trim().nullable().optional(),
  target_audience: z.string().trim().nullable().optional(), presential: presentialDetailsSchema.nullable().optional(),
}).superRefine((value, ctx) => {
  if (value.pricing_type === 'FIXED' && value.promotional_price !== null && value.promotional_price !== undefined && value.promotional_price > value.price) { ctx.addIssue({ code: 'custom', path: ['promotional_price'], message: 'O preço promocional não pode superar o preço' }) }
  if (value.pricing_type === 'BATCHES') {
    if (!value.batches.length) { ctx.addIssue({ code: 'custom', path: ['batches'], message: 'Adicione ao menos um lote' }) }
    if (new Set(value.batches.map(batch => batch.position)).size !== value.batches.length) { ctx.addIssue({ code: 'custom', path: ['batches'], message: 'As posições dos lotes não podem se repetir' }) }
    if (value.batches.filter(batch => batch.status === 'ACTIVE').length > 1) { ctx.addIssue({ code: 'custom', path: ['batches'], message: 'Apenas um lote pode estar ativo' }) }
    if (value.status === 'PUBLISHED' && !value.batches.some(batch => ['ACTIVE', 'SCHEDULED'].includes(batch.status) && (!batch.ends_at || new Date(batch.ends_at) > new Date()))) { ctx.addIssue({ code: 'custom', path: ['batches'], message: 'Adicione ao menos um lote vigente ou futuro para publicar' }) }
    if (value.course_type === 'PRESENCIAL' && value.presential && value.batches.filter(batch => batch.status !== 'DISABLED').reduce((total, batch) => total + batch.max_sales, 0) > value.presential.max_students) { ctx.addIssue({ code: 'custom', path: ['batches'], message: 'A soma das vagas dos lotes não pode superar a capacidade do curso' }) }
    const dated = value.batches.filter(batch => batch.activation_mode !== 'QUANTITY' && batch.starts_at && batch.ends_at && !['DISABLED', 'EXPIRED', 'SOLD_OUT'].includes(batch.status))
    for (let index = 0; index < dated.length; index++) {
      for (let other = index + 1; other < dated.length; other++) {
        if (new Date(dated[index]!.starts_at!).getTime() < new Date(dated[other]!.ends_at!).getTime() && new Date(dated[other]!.starts_at!).getTime() < new Date(dated[index]!.ends_at!).getTime()) { ctx.addIssue({ code: 'custom', path: ['batches'], message: 'Os períodos dos lotes não podem se sobrepor' }); return }
      }
    }
  }
  if (value.status === 'PUBLISHED') {
    if (!value.description) { ctx.addIssue({ code: 'custom', path: ['description'], message: 'Descrição obrigatória para publicar' }) }
    if (!value.instructor_id) { ctx.addIssue({ code: 'custom', path: ['instructor_id'], message: 'Instrutor obrigatório para publicar' }) }
    if (value.course_type === 'PRESENCIAL' && !value.presential) { ctx.addIssue({ code: 'custom', path: ['presential'], message: 'Detalhes presenciais obrigatórios' }) }
  }
})

export const instructorSchema = z.object({ name: z.string().trim().min(2).max(120), bio: z.string().trim().max(3000).nullable().optional(), linkedin_url: z.url().startsWith('https://').nullable().optional(), active: z.boolean().default(true) })
export const moduleSchema = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(1000).nullable().optional() })
export const lessonSchema = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(2000).nullable().optional(), lesson_type: z.enum(['VIDEO', 'TEXT', 'MATERIAL']), content: z.string().trim().max(30000).nullable().optional(), video_path: z.string().trim().max(500).nullable().optional(), duration_minutes: z.coerce.number().int().min(0).nullable().optional(), is_required: z.boolean().default(true), is_preview: z.boolean().default(false) })

export const coverUploadSchema = z.object({ type: z.enum(['image/jpeg', 'image/png', 'image/webp']), size: z.number().int().positive().max(5 * 1024 * 1024) })
export const materialUploadSchema = z.object({ type: z.enum(['application/pdf', 'application/zip', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']), size: z.number().int().positive().max(50 * 1024 * 1024) })
