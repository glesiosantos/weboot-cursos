-- Reutiliza o contato identificado pelo CPF ao comprar outros cursos.
-- A rotina já valida pedidos e matrículas usando o curso, então a identidade
-- global da pessoa não deve impedir uma nova inscrição em outro curso.
drop index if exists public.registration_contacts_email_key;
create index if not exists registration_contacts_email_idx
  on public.registration_contacts(lower(email));

do $migration$
declare
  function_oid regprocedure := 'public.prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer)'::regprocedure;
  definition text;
  rejected_identity_block text := $old$
  select * into contact from public.registration_contacts where cpf_hash = participant_cpf_hash for update;
  if found then raise exception 'cpf already registered'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lower(participant_email), 1));
  if exists(select 1 from public.registration_contacts where lower(email) = lower(participant_email)) then
    raise exception 'email already registered';
  end if;
  insert into public.registration_contacts(public_reference_hash, full_name, cpf_encrypted, cpf_hash,
    email, whatsapp, terms_accepted_at, terms_version, marketing_accepted)
  values(reference_hash, trim(participant_name), participant_cpf_encrypted, participant_cpf_hash,
    lower(participant_email), participant_whatsapp, now(), accepted_terms_version, accepted_marketing)
  returning * into contact;
$old$;
  reusable_identity_block text := $new$
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(participant_cpf_hash, 0));
  select * into contact from public.registration_contacts where cpf_hash = participant_cpf_hash for update;
  if found then
    update public.registration_contacts set full_name = trim(participant_name), email = lower(participant_email),
      whatsapp = participant_whatsapp, cpf_encrypted = participant_cpf_encrypted,
      public_reference_hash = reference_hash, terms_accepted_at = now(), terms_version = accepted_terms_version,
      marketing_accepted = accepted_marketing
      where id = contact.id returning * into contact;
  else
    insert into public.registration_contacts(public_reference_hash, full_name, cpf_encrypted, cpf_hash,
      email, whatsapp, terms_accepted_at, terms_version, marketing_accepted)
    values(reference_hash, trim(participant_name), participant_cpf_encrypted, participant_cpf_hash,
      lower(participant_email), participant_whatsapp, now(), accepted_terms_version, accepted_marketing)
    returning * into contact;
  end if;
$new$;
begin
  definition := pg_get_functiondef(function_oid);
  if position(rejected_identity_block in definition) = 0 then
    raise exception 'identity block not found in prepare_guest_checkout_order';
  end if;
  execute replace(definition, rejected_identity_block, reusable_identity_block);
end
$migration$;
