# Levantamento de pendencias

Atualizado em 3 de setembro de 2026.

## Objetivo

Este documento consolida o que ainda precisa ser criado, concluido ou comprovado na plataforma. Um item so deve ser marcado como concluido quando estiver implementado e validado; configuracao local, build ou deploy isolados nao comprovam uma jornada real.

O checkout vigente e exclusivamente Pix pelo Mercado Pago. Cartao nao faz parte deste levantamento sem uma nova decisao de produto.

## Ordem recomendada

1. Estabilizar os testes automatizados.
2. Concluir o consumo de aulas e o progresso do aluno.
3. Criar a emissao e a validacao de certificados.
4. Criar os modulos administrativos ainda genericos.
5. Concluir a homologacao responsiva e os E2E criticos.
6. Executar o hardening de seguranca para producao.

## 1. Qualidade da base

- [ ] Investigar os timeouts do setup Nuxt nos testes unitarios.
- [ ] Fazer `npm run check` passar integralmente.
- [ ] Executar e registrar `npm run test:e2e` com as dependencias publicas disponiveis.
- [ ] Executar o E2E autenticado contra um projeto Supabase DEV autorizado.
- [ ] Manter lint, typecheck, unitarios, build e E2E como evidencias separadas.

Levantamento de 3 de setembro de 2026: lint e typecheck passaram; a suite unitaria terminou com 22 arquivos aprovados, 5 arquivos com timeout, 115 testes aprovados e 27 ignorados. O build nao foi alcancado porque `npm run check` interrompeu nos testes.

## 2. Consumo de aulas e progresso

Feature iniciada: `feature/course-progress`.

- [x] Definir o contrato de leitura de modulos e aulas para uma matricula ativa.
- [x] Validar no servidor a sessao, a matricula ativa e o acesso ao curso.
- [x] Entregar URLs assinadas curtas para videos e arquivos privados.
- [x] Criar navegacao do aluno por modulos e aulas.
- [x] Permitir marcar e desmarcar uma aula como concluida.
- [x] Persistir o progresso em `lesson_progress` sem confiar em `user_id` enviado pelo cliente.
- [x] Exibir percentual concluido e ultima aula acessada.
- [x] Permitir retomar o curso pela ultima aula.
- [x] Tratar curso sem aulas, aula sem video e material indisponivel.
- [ ] Criar testes unitarios, de autorizacao/RLS e E2E autenticado.
- [ ] Definir o criterio de conclusao que liberara a futura emissao do certificado.

Implementacao local de 3 de setembro de 2026: contrato, autorizacao server-side, navegacao, URLs assinadas por 15 minutos, progresso e retomada implementados. Testes unitarios e verificacoes estaticas de autorizacao/RLS foram adicionados; a migration DEV e o E2E autenticado ainda precisam ser executados antes de considerar o fluxo homologado.

## 3. Certificados

O banco, o bucket privado e as politicas iniciais existem, mas nao ha fluxo funcional completo.

- [ ] Definir regras de elegibilidade para cursos online e presenciais.
- [ ] Criar emissao idempotente do certificado.
- [ ] Gerar e armazenar o PDF em Storage privado.
- [ ] Criar numero e codigo de verificacao nao previsiveis.
- [ ] Criar `/aluno/certificados` com listagem e download autorizado.
- [ ] Criar `/admin/certificados` com consulta, emissao e eventual revogacao.
- [ ] Implementar a consulta publica real em `/certificados`.
- [ ] Incluir QR Code apontando para a validacao publica.
- [ ] Criar testes de emissao, autorizacao, revogacao e consulta publica.

## 4. Modulos administrativos pendentes

As rotas abaixo ainda usam `app/pages/admin/[section].vue`, sem logica de negocio propria.

### Alunos

- [ ] Definir quais dados podem ser pesquisados e exibidos.
- [ ] Criar listagem e detalhe do aluno.
- [ ] Exibir matriculas, pedidos, progresso, presencas e certificados.
- [ ] Definir operacoes administrativas permitidas e sua auditoria.

### Inscricoes

- [ ] Decidir se havera uma visao global alem da tela de inscritos por curso.
- [ ] Criar filtros por curso, pagamento, matricula e periodo.
- [ ] Preservar pedidos sem matricula e o estado `Nao matriculado`.
- [ ] Disponibilizar exportacao coerente com os filtros.

### Certificados

- [ ] Implementar somente junto ao dominio de certificados descrito acima.

### Configuracoes

- [ ] Definir quais configuracoes sao realmente editaveis pelo administrador.
- [ ] Manter secrets e credenciais de integracao exclusivamente no ambiente servidor.
- [ ] Evitar apresentar configuracoes locais como configuracao efetiva de producao.

## 5. Responsividade e acessibilidade

O inventario detalhado permanece em `docs/fase-04-levantamento.md`.

- [ ] Atualizar a matriz da Fase 04 para remover o fluxo de cartao.
- [ ] Validar as jornadas criticas em 320, 390, 768, 1024 e 1280 px.
- [ ] Validar checkout Pix, curso/material, credencial e check-in em celular.
- [ ] Garantir equivalencia de informacoes e acoes entre tabelas e cards moveis.
- [ ] Validar zoom de 200%, textos longos, foco e alvos de toque.
- [ ] Criar cobertura Playwright movel e desktop para as jornadas criticas.
- [ ] Registrar a matriz manual com rota, viewport, resultado e evidencia.

## 6. Integracoes e comprovacoes externas

- [ ] Confirmar que a URL e a chave server-side usadas pela Vercel pertencem ao mesmo projeto Supabase.
- [ ] Revalidar o caso em que o SQL encontra o usuario, mas o Auth administrativo retorna `user_not_found`.
- [ ] Executar pagamento Pix real de homologacao e confirmar o ciclo completo pelo webhook.
- [ ] Comprovar separadamente migracoes remotas, CI, deploy Production e E2E autenticado.
- [ ] Comprovar entrega real dos canais configurados pelo `NotificationProvider`.

## 7. Hardening de seguranca

Os detalhes e premissas permanecem em `docs/security.md`.

- [ ] Remover `unsafe-inline` da CSP por meio de nonces ou estrategia equivalente.
- [ ] Integrar rate limit distribuido compativel com serverless.
- [ ] Integrar inspecao ou antivírus para uploads.
- [ ] Adicionar logging estruturado externo sem secrets ou dados pessoais sensiveis.
- [ ] Testar as politicas RLS contra Supabase local.
- [ ] Auditar automaticamente o bundle para detectar secrets.

## 8. Funcionalidades futuras fora do escopo atual

Estes itens exigem priorizacao de produto antes da implementacao:

- [ ] Multiplos participantes em uma unica compra.
- [ ] Inscricao corporativa.
- [ ] Transferencia de ingresso.
- [ ] Lista de espera.
- [ ] Apple Wallet e Google Wallet.
- [ ] Link publico revogavel para credencial.

## Definicao de concluido

Uma feature so pode ser encerrada quando o codigo e as migrations necessarias estiverem revisados, os gates locais aplicaveis passarem, a jornada autenticada tiver sido comprovada quando aplicavel e as dependencias externas forem relatadas separadamente. Publicacao, migracao remota e comportamento real de provedores nao devem ser inferidos a partir do build local.
