# Fase 03 — operação comercial e eventos

## Arquitetura

O Nuxt cria o pedido e a reserva no banco, chama exclusivamente o Checkout hospedado do Asaas Sandbox e redireciona o aluno ao `link` retornado. Nenhum número de cartão, CVV ou dado financeiro sensível passa pela aplicação. `PaymentProvider` isola a regra comercial de `AsaasHostedCheckoutProvider`; `INTERNAL_CHECKOUT` fica explicitamente como feature futura.

### Inscrição pública sem login

`/cursos/[slug]/inscricao` cria primeiro `registration_contacts`, `orders` e, quando houver limite de vagas, `seat_reservations`. Nenhum usuário Auth é criado na abertura ou no envio do formulário. CPF é normalizado no servidor, cifrado com `NUXT_REGISTRATION_DATA_KEY` e indexado somente por hash com chave; nunca integra URLs, QR Codes, logs ou respostas públicas. A referência do visitante é aleatória e somente seu hash é persistido.

O modelo atual usa `course_batches` como oferta comercial/turma e `course_presential_details` para data e local. Não foi criada uma `course_offerings` paralela para evitar duas fontes de preço, vagas e período. A matrícula registra `course_batch_id`, permitindo evolução posterior sem perder a turma comprada.

Pagamento confirmado chama uma única rotina: associa conta existente por email ou envia convite seguro do Supabase para uma nova conta, força perfil `STUDENT`, ativa matrícula/reserva e cria a credencial. Curso gratuito passa pela mesma rotina sem chamar o Asaas. O retorno do navegador apenas consulta status.

Notificações ficam atrás de `NotificationProvider`. Configure `NUXT_NOTIFICATION_WEBHOOK_URL` e, opcionalmente, `NUXT_NOTIFICATION_WEBHOOK_TOKEN`; sem provider, o evento é registrado como `SKIPPED`, sem simular entrega. WhatsApp não fica acoplado ao checkout. O comprovante PDF é gerado sob demanda em rota autenticada e usa cache privado desabilitado.

Permanecem futuras: checkout interno, múltiplos participantes, inscrição corporativa, transferência de ingresso, lista de espera, scanner avançado por câmera, Apple/Google Wallet e link guest revogável para a credencial. Nesta entrega, a credencial fica em `/aluno/eventos` depois da criação segura da conta.

## Configuração

Configure somente no servidor `NUXT_ASAAS_API_KEY`, `NUXT_ASAAS_WEBHOOK_TOKEN` e uma chave aleatória forte em `NUXT_REGISTRATION_DATA_KEY`. Nesta fase, `NUXT_ASAAS_API_URL` deve continuar `https://api-sandbox.asaas.com/v3`. Defina `NUXT_PUBLIC_APP_URL` com a origem HTTPS pública usada nos callbacks.

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
