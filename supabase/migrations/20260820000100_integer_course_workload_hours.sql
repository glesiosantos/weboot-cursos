alter table public.courses
  drop constraint if exists courses_workload_hours_check;

alter table public.courses
  alter column workload_hours type integer
  using round(workload_hours)::integer;

alter table public.courses
  add constraint courses_workload_hours_check check (workload_hours > 0);
