# Segurança

## Autenticação e autorização

A autenticação usa Supabase Auth com email confirmado. O navegador usa somente a chave `anon`. Rotas protegidas exigem sessão e as APIs administrativas consultam o papel persistido em `profiles`; nunca aceitam `role` ou `user_id` do cliente como autoridade. A alteração de senha em `/conta/seguranca` chama `auth.updateUser` somente após confirmar a sessão ativa, não recebe identificador de usuário e limpa os campos após sucesso. Senhas não são persistidas nem registradas.

Todas as tabelas expostas possuem RLS forçado. Alunos leem somente seus perfis, pedidos, matrículas, progresso e certificados. O trigger `protect_profile_role` impede elevação de privilégio. Escritas financeiras, matrículas e certificados ficam restritas ao administrador ou a operações server-side deliberadas.

## Storage e vídeos

Somente `course-covers` é público. Materiais, vídeos, certificados e avatares são privados e protegidos por matrícula ativa ou propriedade. Caminhos devem começar pelo UUID do curso/usuário. Futuras APIs de conteúdo devem validar sessão e matrícula antes de gerar URL assinada curta. Nenhum vídeo pago deve possuir URL permanente no HTML.

## Secrets e integrações

Service role e chaves Asaas usam apenas variáveis privadas. Nunca usar prefixo `NUXT_PUBLIC_` para elas. O Asaas inicia no Sandbox. Logs não podem conter cookies, tokens, chaves, senhas ou dados de cartão.

## Headers e entradas

O middleware adiciona CSP, bloqueio de framing, `nosniff`, política de referência e de permissões. Toda futura API deve validar payload com Zod, usar whitelists de campos e limitar requisições em armazenamento compartilhado compatível com serverless.

## Pendências de hardening

Antes da produção: remover `unsafe-inline` da CSP com nonces, integrar rate limit distribuído, antivírus/inspeção de uploads, logging estruturado externo, teste RLS contra Supabase local e auditoria automatizada do bundle para secrets.
