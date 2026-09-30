export default defineEventHandler((event) => {
  const headers = {
    'Content-Security-Policy': 'default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://sdk.mercadopago.com; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob: https://*.supabase.co; connect-src \'self\' https://*.supabase.co wss://*.supabase.co https://api.mercadopago.com https://*.mercadopago.com; frame-src https://*.mercadopago.com https://*.mercadolibre.com; media-src \'self\' blob: https://*.supabase.co; frame-ancestors \'none\'; base-uri \'self\'; form-action \'self\' https://*.mercadopago.com',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
  }
  for (const [name, value] of Object.entries(headers)) {
    setResponseHeader(event, name, value)
  }
})
