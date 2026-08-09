-- Corrige o bootstrap do primeiro administrador sem remover
-- a proteção contra alteração arbitrária de roles.

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Role não mudou: segue normalmente.
  if new.role is not distinct from old.role then
    return new;
  end if;

  -- Administradores existentes podem realizar alterações autorizadas.
  if public.is_admin() then
    return new;
  end if;

  -- Permite exclusivamente o bootstrap pelo SQL Editor/administrador do banco.
  -- session_user não é alterado por SECURITY DEFINER e não pode ser forjado
  -- por uma sessão anon/authenticated do PostgREST.
  if session_user in ('postgres', 'supabase_admin')
     and new.role = 'ADMIN'
     and not exists (
       select 1
       from public.profiles
       where role = 'ADMIN'
     )
  then
    return new;
  end if;

  raise exception 'role changes require administrator privileges';
end;
$$;


create or replace function public.bootstrap_admin(target_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_id uuid;
begin
  -- Bootstrap só pode acontecer uma vez.
  if exists (
    select 1
    from public.profiles
    where role = 'ADMIN'
  ) then
    raise exception 'an administrator already exists';
  end if;

  select id
    into target_id
  from auth.users
  where lower(email) = lower(target_email);

  if target_id is null then
    raise exception 'user not found';
  end if;

  -- Garante que o profile realmente existe.
  if not exists (
    select 1
    from public.profiles
    where id = target_id
  ) then
    raise exception 'profile not found';
  end if;

  update public.profiles
  set role = 'ADMIN'
  where id = target_id;

  return target_id;
end;
$$;


-- bootstrap_admin nunca deve ficar disponível pela API para usuários.
revoke all
on function public.bootstrap_admin(text)
from public, anon, authenticated;
