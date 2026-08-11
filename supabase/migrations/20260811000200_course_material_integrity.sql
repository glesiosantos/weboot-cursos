create or replace function public.validate_course_material_owner() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.module_id is not null and not exists(
    select 1 from public.course_modules m where m.id = new.module_id and m.course_id = new.course_id
  ) then raise exception 'module does not belong to course'; end if;
  if new.lesson_id is not null and not exists(
    select 1 from public.lessons l join public.course_modules m on m.id = l.module_id
    where l.id = new.lesson_id and m.course_id = new.course_id
  ) then raise exception 'lesson does not belong to course'; end if;
  return new;
end; $$;

create trigger validate_course_material_owner before insert or update on public.course_materials
for each row execute function public.validate_course_material_owner();
