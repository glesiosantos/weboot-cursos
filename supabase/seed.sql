-- Dados exclusivamente fictícios para desenvolvimento local/DEV.
insert into public.instructors (id, name, bio, active) values
  ('20000000-0000-0000-0000-000000000001', 'Marina Campos', 'Especialista fictícia em dados e bancos relacionais.', true),
  ('20000000-0000-0000-0000-000000000002', 'Caio Nunes', 'Instrutor fictício de desenvolvimento de software.', true),
  ('20000000-0000-0000-0000-000000000003', 'Lia Martins', 'Instrutora fictícia de automação de processos.', true)
on conflict (id) do update set name = excluded.name, bio = excluded.bio, active = true;

insert into public.courses (id, instructor_id, title, slug, short_description, description, course_type, workload_hours, price, promotional_price, status, program, requirements, target_audience, published_at)
values
  ('10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Destravando SQL', 'destravando-sql', 'Consultas e modelagem de dados aplicadas a desafios reais.', 'Aprenda SQL com exercícios práticos, da consulta inicial à modelagem de dados.', 'PRESENCIAL', 24, 497.00, 397.00, 'PUBLISHED', 'Fundamentos\nConsultas\nModelagem', 'Notebook pessoal', 'Pessoas que trabalham com dados', now()),
  ('10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'APIs REST com NestJS', 'apis-rest-nestjs', 'Construa APIs organizadas, seguras e prontas para evoluir.', 'Desenvolva uma API completa com NestJS e práticas modernas.', 'ONLINE', 20, 397.00, null, 'PUBLISHED', 'Fundamentos\nArquitetura\nSegurança', 'JavaScript básico', 'Desenvolvedores web', now()),
  ('10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003', 'Automação com n8n', 'automacao-n8n', 'Automatize rotinas conectando ferramentas e serviços.', 'Crie automações confiáveis com fluxos visuais e integrações.', 'ONLINE', 12, 297.00, 247.00, 'PUBLISHED', 'Workflows\nWebhooks\nIntegrações', 'Nenhum', 'Profissionais de operações e tecnologia', now()),
  ('10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002', 'Curso interno em revisão', 'curso-interno-revisao', 'Registro fictício que não pode aparecer publicamente.', 'Curso DRAFT para teste de RLS.', 'ONLINE', 10, 197.00, null, 'DRAFT', null, null, null, null)
on conflict (id) do update set title = excluded.title, instructor_id = excluded.instructor_id, status = excluded.status, updated_at = now();

insert into public.course_presential_details (course_id, location_name, address, address_number, neighborhood, city, state, postal_code, starts_at, ends_at, registration_deadline, max_students)
values ('10000000-0000-0000-0000-000000000001', 'Espaço Horizonte', 'Rua das Oficinas', '120', 'Centro', 'São Paulo', 'SP', '01000-000', '2026-10-17 12:00:00+00', '2026-10-19 21:00:00+00', '2026-10-16 23:59:00+00', 24)
on conflict (course_id) do update set location_name = excluded.location_name, starts_at = excluded.starts_at, ends_at = excluded.ends_at;

insert into public.course_modules (id, course_id, title, description, position) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Introdução às APIs', 'Base conceitual do curso.', 0),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Construindo com NestJS', 'Aplicação prática.', 1),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Primeiro workflow', 'Fundamentos do n8n.', 0)
on conflict (id) do update set title = excluded.title, position = excluded.position;

insert into public.lessons (id, module_id, title, description, lesson_type, duration_minutes, position, is_required, is_preview) values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'O que é REST', 'Conceitos e recursos.', 'VIDEO', 25, 0, true, true),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Criando o projeto', 'Configuração inicial.', 'TEXT', 35, 0, true, false),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Conhecendo o editor', 'Primeiro contato com o n8n.', 'VIDEO', 20, 0, true, true)
on conflict (id) do update set title = excluded.title, position = excluded.position;
