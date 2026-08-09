-- Dados exclusivamente fictícios para desenvolvimento local/DEV.
insert into public.courses (id, title, slug, short_description, description, course_type, workload_minutes, price, status, starts_at, max_students, published_at)
values
  ('10000000-0000-0000-0000-000000000001', 'Destravando SQL', 'destravando-sql', 'Consultas e modelagem de dados aplicadas a desafios reais.', 'Curso fictício para desenvolvimento.', 'PRESENCIAL', 1440, 497.00, 'PUBLISHED', '2026-10-17 12:00:00+00', 24, now()),
  ('10000000-0000-0000-0000-000000000002', 'APIs REST com NestJS', 'apis-rest-nestjs', 'Construa APIs organizadas, seguras e prontas para evoluir.', 'Curso fictício para desenvolvimento.', 'ONLINE', 1200, 397.00, 'PUBLISHED', null, null, now()),
  ('10000000-0000-0000-0000-000000000003', 'Automação com n8n', 'automacao-n8n', 'Automatize rotinas conectando ferramentas e serviços.', 'Curso fictício para desenvolvimento.', 'ONLINE', 720, 297.00, 'PUBLISHED', null, null, now()),
  ('10000000-0000-0000-0000-000000000004', 'Curso interno em revisão', 'curso-interno-revisao', 'Registro fictício que não pode aparecer publicamente.', 'Curso DRAFT para teste de RLS.', 'ONLINE', 600, 197.00, 'DRAFT', null, null, null)
on conflict (id) do update set title = excluded.title, status = excluded.status, updated_at = now();
