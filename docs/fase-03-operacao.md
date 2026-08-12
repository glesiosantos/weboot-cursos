# Fase 03 — operação comercial e eventos

## Arquitetura

O Nuxt cria o pedido e a reserva no banco, chama exclusivamente o Checkout hospedado do Asaas Sandbox e redireciona o aluno ao `link` retornado. Nenhum número de cartão, CVV ou dado financeiro sensível passa pela aplicação. `PaymentProvider` isola a regra comercial de `AsaasHostedCheckoutProvider`; `INTERNAL_CHECKOUT` fica explicitamente como feature futura.

## Configuração

Configure somente no servidor `NUXT_ASAAS_API_KEY` e `NUXT_ASAAS_WEBHOOK_TOKEN`. Nesta fase, `NUXT_ASAAS_API_URL` deve continuar `https://api-sandbox.asaas.com/v3`. Defina `NUXT_PUBLIC_APP_URL` com a origem HTTPS pública usada nos callbacks.

No Sandbox, cadastre `https://SEU_DOMINIO/api/webhooks/asaas`, o mesmo token seguro (32–255 caracteres) e apenas os eventos necessários: `CHECKOUT_PAID`, `CHECKOUT_CANCELED`, `CHECKOUT_EXPIRED`, `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED` e `PAYMENT_OVERDUE`. Em desenvolvimento, exponha a aplicação com um túnel HTTPS como ngrok; nunca grave a URL temporária no código.

## Regras

- O frontend envia somente `course_id`; preço fixo/promocional e lote vigente são lidos e congelados em `orders` pelo banco.
- A transação bloqueia curso/lote, valida matrícula, capacidade geral e capacidade do lote, e cria reserva por 30 minutos.
- Um checkout `WAITING_PAYMENT` ainda válido é reutilizado. Reservas vencidas são expiradas e liberadas.
- Callback apenas consulta o pedido. Somente webhook autenticado confirma pagamento e ativa matrícula.
- O ID do pedido é `externalReference`. Eventos de Checkout sem essa propriedade são conciliados por `checkout.id`.
- Webhooks são deduplicados por `(provider, external_event_id)` e hash do payload. Matrícula, reserva, credencial e attendance têm efeitos idempotentes.
- Curso presencial pago recebe token opaco aleatório. Só o hash é usado na validação; o QR não contém nome, email, IDs ou dados financeiros.
- Check-in exige ADMIN ou o INSTRUCTOR vinculado ao curso, usa lock, registra `PRESENT` e preserva data/hora do primeiro uso.

## Validação

Use `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e` e `npm run build`. O E2E público usa configuração local não sensível quando secrets não existem; cenários autenticados/Sandbox permanecem ignorados até que `E2E_*`, Supabase DEV e Asaas Sandbox sejam configurados. Nunca interprete teste com fixture como prova de entrega real do provider.
