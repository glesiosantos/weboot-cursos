do $$ declare table_name text; begin foreach table_name in array array['profiles','instructors','courses','course_modules','lessons','course_materials','orders','payments','enrollments','lesson_progress','attendance','certificates','coupons','coupon_usages','webhook_events','audit_logs'] loop execute format('alter table public.%I enable row level security', table_name); execute format('alter table public.%I force row level security', table_name); end loop; end $$;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id or public.is_admin());
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id or public.is_admin()) with check ((select auth.uid()) = id or public.is_admin());
create policy public_instructors_read on public.instructors for select using (active or public.is_admin());
create policy public_courses_read on public.courses for select using ((status = 'PUBLISHED' and archived_at is null) or public.is_admin());
create policy public_modules_read on public.course_modules for select using (exists(select 1 from public.courses c where c.id = course_id and c.status = 'PUBLISHED') or public.is_admin());
create policy lessons_read_if_free_or_enrolled on public.lessons for select using (is_free or exists(select 1 from public.course_modules m join public.enrollments e on e.course_id = m.course_id where m.id = module_id and e.user_id = (select auth.uid()) and e.status = 'ACTIVE') or public.is_admin());
create policy materials_read_if_enrolled on public.course_materials for select to authenticated using (exists(select 1 from public.enrollments e where e.course_id = course_id and e.user_id = (select auth.uid()) and e.status = 'ACTIVE') or public.is_admin());
create policy orders_select_own on public.orders for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy payments_select_own on public.payments for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())) or public.is_admin());
create policy enrollments_select_own on public.enrollments for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy progress_select_own on public.lesson_progress for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy progress_insert_own on public.lesson_progress for insert to authenticated with check (user_id = (select auth.uid()) and exists(select 1 from public.enrollments e where e.user_id = (select auth.uid()) and e.course_id = course_id and e.status = 'ACTIVE'));
create policy progress_update_own on public.lesson_progress for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy attendance_select_own on public.attendance for select to authenticated using (exists(select 1 from public.enrollments e where e.id = enrollment_id and e.user_id = (select auth.uid())) or public.is_admin());
create policy certificates_select_own on public.certificates for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
create policy coupon_usages_select_own on public.coupon_usages for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

do $$ declare table_name text; begin foreach table_name in array array['instructors','courses','course_modules','lessons','course_materials','orders','payments','enrollments','attendance','certificates','coupons','webhook_events','audit_logs'] loop execute format('create policy admin_all_%I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', table_name, table_name); end loop; end $$;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values
  ('course-covers', 'course-covers', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('course-materials', 'course-materials', false, 52428800, array['application/pdf','application/zip','application/vnd.openxmlformats-officedocument.wordprocessingml.document','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','image/jpeg','image/png']),
  ('course-videos', 'course-videos', false, 1073741824, array['video/mp4','video/webm']),
  ('certificates', 'certificates', false, 10485760, array['application/pdf']),
  ('avatars', 'avatars', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy covers_public_read on storage.objects for select using (bucket_id = 'course-covers');
create policy private_files_admin_manage on storage.objects for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy avatars_own_read on storage.objects for select to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_own_insert on storage.objects for insert to authenticated with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_own_update on storage.objects for update to authenticated using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy enrolled_materials_read on storage.objects for select to authenticated using (bucket_id in ('course-materials','course-videos') and exists(select 1 from public.enrollments e where e.user_id = (select auth.uid()) and e.course_id::text = (storage.foldername(name))[1] and e.status = 'ACTIVE'));
create policy certificates_own_read on storage.objects for select to authenticated using (bucket_id = 'certificates' and (storage.foldername(name))[1] = (select auth.uid())::text);
