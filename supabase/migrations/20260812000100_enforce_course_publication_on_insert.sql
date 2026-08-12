-- Garante que as regras de publicação não possam ser contornadas em INSERT.
-- Cursos são criados como DRAFT; a publicação ocorre somente após conteúdo,
-- detalhes presenciais e/ou lotes já existirem e serem validados no UPDATE.
drop trigger if exists validate_course_publication on public.courses;
create trigger validate_course_publication
before insert or update on public.courses
for each row execute function public.validate_course_publication();
