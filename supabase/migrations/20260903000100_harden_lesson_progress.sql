create or replace function public.validate_lesson_progress_course()
returns trigger language plpgsql set search_path = '' as $$
begin
  if not exists (
    select 1 from public.lessons lesson
    join public.course_modules module on module.id = lesson.module_id
    where lesson.id = new.lesson_id and module.course_id = new.course_id
  ) then raise exception 'lesson does not belong to course'; end if;
  return new;
end;
$$;

drop trigger if exists validate_lesson_progress_course on public.lesson_progress;
create trigger validate_lesson_progress_course before insert or update of course_id, lesson_id on public.lesson_progress
for each row execute function public.validate_lesson_progress_course();

drop policy if exists progress_update_own on public.lesson_progress;
create policy progress_update_own on public.lesson_progress for update to authenticated
using (user_id = (select auth.uid()))
with check (
  user_id = (select auth.uid()) and exists (
    select 1 from public.enrollments enrollment
    where enrollment.user_id = (select auth.uid()) and enrollment.course_id = lesson_progress.course_id and enrollment.status = 'ACTIVE'
  )
);
