create extension if not exists pgcrypto;

create type public.user_role as enum ('ADMIN', 'INSTRUCTOR', 'STUDENT');
create type public.course_type as enum ('ONLINE', 'PRESENCIAL');
create type public.course_status as enum ('DRAFT', 'PUBLISHED', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');
create type public.order_status as enum ('PENDING', 'WAITING_PAYMENT', 'PAID', 'CANCELED', 'REFUNDED', 'EXPIRED');
create type public.enrollment_status as enum ('PENDING', 'ACTIVE', 'COMPLETED', 'CANCELED', 'EXPIRED');
create type public.attendance_status as enum ('PRESENT', 'ABSENT', 'JUSTIFIED');
create type public.coupon_type as enum ('PERCENTAGE', 'FIXED');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  avatar_path text,
  phone text,
  role public.user_role not null default 'STUDENT',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.instructors (
  id uuid primary key default gen_random_uuid(), profile_id uuid unique references public.profiles(id),
  name text not null, bio text, avatar_path text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.courses (
  id uuid primary key default gen_random_uuid(), instructor_id uuid references public.instructors(id),
  title text not null, slug text not null unique, short_description text not null, description text not null,
  cover_path text, course_type public.course_type not null, workload_minutes integer not null check (workload_minutes > 0),
  price numeric(12,2) not null check (price >= 0), promotional_price numeric(12,2) check (promotional_price >= 0 and promotional_price <= price),
  status public.course_status not null default 'DRAFT', program text, requirements text, target_audience text,
  address text, city text, state char(2), venue text, starts_at timestamptz, ends_at timestamptz,
  schedule text, max_students integer check (max_students > 0), cancellation_policy text, additional_info text,
  published_at timestamptz, archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint presencial_fields check (course_type = 'ONLINE' or (starts_at is not null and max_students is not null))
);
create table public.course_modules (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  title text not null, description text, position integer not null check (position >= 0),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(course_id, position)
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(), module_id uuid not null references public.course_modules(id) on delete cascade,
  title text not null, description text, video_path text, duration_seconds integer check (duration_seconds >= 0),
  position integer not null check (position >= 0), is_required boolean not null default true, is_free boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(module_id, position)
);
create table public.course_materials (
  id uuid primary key default gen_random_uuid(), course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid references public.course_modules(id) on delete cascade, lesson_id uuid references public.lessons(id) on delete cascade,
  name text not null, file_path text not null, mime_type text not null, size_bytes bigint not null check (size_bytes > 0),
  created_at timestamptz not null default now()
);
create table public.coupons (
  id uuid primary key default gen_random_uuid(), code text not null unique, type public.coupon_type not null,
  value numeric(12,2) not null check (value > 0), max_uses integer check (max_uses > 0), used_count integer not null default 0 check (used_count >= 0),
  starts_at timestamptz, expires_at timestamptz, active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint percentage_limit check (type <> 'PERCENTAGE' or value <= 100)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), course_id uuid not null references public.courses(id),
  coupon_id uuid references public.coupons(id), status public.order_status not null default 'PENDING',
  subtotal numeric(12,2) not null check (subtotal >= 0), discount numeric(12,2) not null default 0 check (discount >= 0), total numeric(12,2) not null check (total >= 0),
  currency char(3) not null default 'BRL', asaas_checkout_id text unique, asaas_payment_id text unique, paid_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), provider text not null default 'ASAAS',
  external_id text not null unique, status text not null, amount numeric(12,2) not null check (amount >= 0), paid_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.enrollments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), course_id uuid not null references public.courses(id),
  order_id uuid unique references public.orders(id), status public.enrollment_status not null default 'PENDING', enrolled_at timestamptz not null default now(),
  completed_at timestamptz, expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, course_id)
);
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), course_id uuid not null references public.courses(id),
  lesson_id uuid not null references public.lessons(id), started_at timestamptz, completed_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, lesson_id)
);
create table public.attendance (
  id uuid primary key default gen_random_uuid(), enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  attendance_date date not null, status public.attendance_status not null, notes text, recorded_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(enrollment_id, attendance_date)
);
create table public.certificates (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), course_id uuid not null references public.courses(id),
  certificate_number text not null unique, verification_code text not null unique, issued_at timestamptz not null default now(), file_path text,
  created_at timestamptz not null default now(), unique(user_id, course_id)
);
create table public.coupon_usages (
  id uuid primary key default gen_random_uuid(), coupon_id uuid not null references public.coupons(id), user_id uuid not null references public.profiles(id),
  order_id uuid not null unique references public.orders(id), used_at timestamptz not null default now()
);
create table public.webhook_events (
  id uuid primary key default gen_random_uuid(), provider text not null, external_event_id text not null, event_type text not null,
  payload_hash text not null, status text not null default 'RECEIVED', received_at timestamptz not null default now(), processed_at timestamptz,
  unique(provider, external_event_id)
);
create table public.audit_logs (
  id bigint generated always as identity primary key, user_id uuid references public.profiles(id), action text not null,
  entity text not null, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);

create index orders_user_idx on public.orders(user_id);
create index enrollments_user_idx on public.enrollments(user_id);
create index lesson_progress_user_course_idx on public.lesson_progress(user_id, course_id);
create index courses_public_idx on public.courses(status, course_type) where archived_at is null;

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
do $$ declare table_name text; begin foreach table_name in array array['profiles','instructors','courses','course_modules','lessons','coupons','orders','payments','enrollments','lesson_progress','attendance'] loop execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name); end loop; end $$;

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin insert into public.profiles(id, name) values(new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'name'), ''), 'Aluno')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function public.is_admin() returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'ADMIN');
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create function public.protect_profile_role() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then raise exception 'role changes require administrator privileges'; end if;
  return new;
end; $$;
create trigger protect_profile_role before update on public.profiles for each row execute function public.protect_profile_role();
