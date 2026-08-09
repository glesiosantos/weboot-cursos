# Weboot Cursos

Plataforma mobile-first para venda e gestão de cursos online e presenciais. Esta entrega contém a Fase 1: fundação Nuxt, Supabase, autenticação, autorização, banco, RLS, testes e CI.

## Arquitetura

- `app/`: páginas, layouts, middleware, composables e tipos Vue/Nuxt
- `server/api/`: endpoints Nitro; integrações sensíveis permanecem no servidor
- `server/utils/`: autorização server-side reutilizável
- `server/middleware/`: headers globais de segurança
- `supabase/migrations/`: schema PostgreSQL, constraints, triggers, RLS e Storage
- `tests/unit/`: testes Vitest, incluindo invariantes de autorização
- `tests/e2e/`: testes Playwright
- `docs/`: decisões e controles de segurança

Stack: Nuxt 4, Vue 3, TypeScript estrito, Tailwind CSS 4, Supabase Auth/PostgreSQL/Storage, Zod, Vitest, Nuxt Test Utils, Playwright e ESLint 9.

## Requisitos

- Node.js 22 LTS
- npm 10+
- Supabase CLI e Docker, para o ambiente local completo

## Instalação

```bash
npm ci
cp .env.example .env
npx supabase start
npx supabase db reset
npm run dev
```

Copie a URL e as chaves locais exibidas pelo Supabase para `.env`. Nunca versione `.env` ou credenciais reais.

## Variáveis

- `NUXT_PUBLIC_SUPABASE_URL` e `NUXT_PUBLIC_SUPABASE_KEY`: endpoint e chave anon usados pelo módulo Supabase
- `NUXT_SUPABASE_SERVICE_KEY`: service role esperada internamente pelo módulo, somente servidor
- `NUXT_PUBLIC_APP_URL`: origem pública da aplicação
- `NUXT_ASAAS_API_KEY`, `NUXT_ASAAS_API_URL`, `NUXT_ASAAS_WEBHOOK_TOKEN`: integração futura, Sandbox por padrão

Em desenvolvimento, staging e produção use projetos Supabase separados. Testes nunca devem apontar para produção.

## Banco e RLS

As migrations criam o domínio inicial completo, índices, constraints, perfil automático e os buckets. RLS é habilitado e forçado em todas as tabelas públicas. Para aplicar do zero:

```bash
npx supabase db reset
```

Os tipos de banco estão inicialmente em `app/types/database.types.ts`; após vincular um projeto, regenere-os com a Supabase CLI e revise o diff.

## Qualidade

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run check
```

O E2E instala o navegador separadamente com `npx playwright install chromium`. A CI executa lint, typecheck, unitários, build e E2E em jobs encadeados.

## Deploy

Importe o repositório na Vercel, defina as variáveis por ambiente e use `npm run build`. Configure URLs de redirect do Supabase para cada domínio. Chaves privadas devem existir somente nos ambientes server-side da Vercel.

## Asaas e webhooks

A integração será implementada na Fase 3. O endpoint futuro `/api/webhooks/asaas` confirmará pagamentos de forma idempotente; retorno do navegador nunca liberará curso. Desenvolvimento e testes usarão exclusivamente o Sandbox.

Veja [docs/security.md](docs/security.md) para o modelo de ameaças e as pendências de hardening.
