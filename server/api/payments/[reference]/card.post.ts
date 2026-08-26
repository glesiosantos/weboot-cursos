export default defineEventHandler(() => {
  throw createError({
    statusCode: 410,
    statusMessage: 'Pagamento com cartão de crédito indisponível. Utilize Pix.',
  })
})
