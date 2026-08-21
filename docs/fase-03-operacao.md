# Fase 03 — operação comercial e eventos

## Arquitetura

O Nuxt cria o pedido e a reserva no banco e abre o checkout transparente em `/pagamento/[reference]`. Pix e cartão são processados pela API do Asaas Sandbox sem redirecionamento. Número do cartão e CVV existem somente em memória durante a requisição e nunca são persistidos ou registrados em logs. Como os dados passam pelo backend, HTTPS e conformidade PCI DSS SAQ-D são requisitos operacionais antes de produção.

### Inscrição pública sem login

`/cursos/[slug]/inscricao` coleta somente nome completo, CPF, WhatsApp e e-mail, cria ou atualiza um único `registration_contacts` por CPF, cria `orders` e, quando houver limite de vagas, `seat_reservations`. O banco usa lock transacional e índice único em `cpf_hash`, evitando duplicidade inclusive em requisições simultâneas. Uma pessoa pode possuir vários pedidos; cada referência pública pertence ao pedido. Nenhum usuário Auth é criado antes da confirmação. CPF é normalizado no servidor, cifrado com `NUXT_REGISTRATION_DATA_KEY` e indexado somente por hash com chave; nunca integra URLs, QR Codes, logs ou respostas públicas.

O modelo atual usa `course_batches` como oferta comercial/turma e `course_presential_details` para data e local. Não foi criada uma `course_offerings` paralela para evitar duas fontes de preço, vagas e período. A matrícula registra `course_batch_id`, permitindo evolução posterior sem perder a turma comprada.

Pagamento confirmado chama uma única rotina: associa conta existente por email ou envia convite seguro do Supabase para uma nova conta, força perfil `STUDENT`, ativa matrícula/reserva e cria a credencial. Curso gratuito passa pela mesma rotina sem chamar o Asaas. O retorno do navegador apenas consulta status.

Notificações ficam atrás de `NotificationProvider`. Emails usam SMTP quando `NUXT_SMTP_HOST`, `NUXT_SMTP_USER` e `NUXT_SMTP_PASSWORD` estão configurados; o remetente opcional é `NUXT_SMTP_FROM`. Configure `NUXT_NOTIFICATION_WEBHOOK_URL` e, opcionalmente, `NUXT_NOTIFICATION_WEBHOOK_TOKEN` para WhatsApp. Sem provider, o evento é registrado como `SKIPPED`, sem simular entrega. O comprovante PDF é gerado sob demanda em rota autenticada e usa cache privado desabilitado.

Permanecem futuras: múltiplos participantes, inscrição corporativa, transferência de ingresso, lista de espera, scanner avançado por câmera, Apple/Google Wallet e link guest revogável para a credencial. Nesta entrega, a credencial fica em `/aluno/eventos` depois da criação segura da conta.

## Configuração

Configure somente no servidor `NUXT_ASAAS_API_KEY`, `NUXT_ASAAS_WEBHOOK_TOKEN` e uma chave aleatória forte em `NUXT_REGISTRATION_DATA_KEY`. Use `NUXT_ASAAS_API_URL=https://api-sandbox.asaas.com/v3` em testes e `NUXT_ASAAS_API_URL=https://api.asaas.com/v3` em produção, sempre com a chave correspondente ao mesmo ambiente. Pix e cartão à vista usam o valor do curso/lote. Para cartão de 2 a 6 parcelas, configure `NUXT_ASAAS_CARD_INSTALLMENT_PERCENT=2.49` e `NUXT_ASAAS_CARD_FIXED=5.49`.

No ambiente correspondente do Asaas, cadastre `https://SEU_DOMINIO/api/webhooks/asaas`, o mesmo token seguro (32–255 caracteres) e apenas os eventos necessários: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED` e `PAYMENT_OVERDUE`. Em desenvolvimento, exponha a aplicação com um túnel HTTPS como ngrok; nunca grave a URL temporária no código.

## Regras

- O frontend da inscrição envia somente o curso e dados pessoais; preço fixo/promocional e lote vigente são lidos e congelados em `orders` pelo banco.
- A transação bloqueia curso/lote, valida matrícula, capacidade geral e capacidade do lote, e cria reserva por 30 minutos.
- Um pedido `WAITING_PAYMENT` ainda válido é reutilizado. Reservas vencidas são expiradas e liberadas.
- Pix e cartão à vista cobram o preço congelado do curso/lote. Cartão de 2 a 6 parcelas soma R$ 5,49 e 2,49%; o frontend exibe somente o total, sem discriminar tarifas.
- O ID do pedido é `externalReference`. Somente webhook autenticado, com ID e valor conferidos contra o pedido, confirma pagamento e ativa matrícula.
- Webhooks são deduplicados por `(provider, external_event_id)` e hash do payload. Matrícula, reserva, credencial e attendance têm efeitos idempotentes.
- Curso presencial pago recebe token opaco aleatório. Só o hash é usado na validação; o QR não contém nome, email, IDs ou dados financeiros.
- Check-in exige ADMIN ou o INSTRUCTOR vinculado ao curso, usa lock, registra `PRESENT` e preserva data/hora do primeiro uso.

## Validação

Use `npm run lint`, `npm run typecheck`, `npm run test`, `npm run test:e2e` e `npm run build`. O E2E público usa configuração local não sensível quando secrets não existem; cenários autenticados/Sandbox permanecem ignorados até que `E2E_*`, Supabase DEV e Asaas Sandbox sejam configurados. Nunca interprete teste com fixture como prova de entrega real do provider.
