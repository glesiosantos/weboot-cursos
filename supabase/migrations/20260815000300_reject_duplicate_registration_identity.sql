-- Consolida emails legados e passa a rejeitar CPF ou email ja cadastrados.
do $$
declare duplicate record; duplicate_id uuid;
begin
  for duplicate in
    select lower(email) normalized_email, (array_agg(id order by created_at, id))[1] canonical_id,
      (array_agg(id order by created_at, id))[2:] duplicate_ids
    from public.registration_contacts group by lower(email) having count(*) > 1
  loop
    foreach duplicate_id in array duplicate.duplicate_ids loop
      update public.orders target set status = 'EXPIRED'
      where target.registration_id = duplicate_id and target.status in ('PENDING', 'WAITING_PAYMENT')
        and exists (
          select 1 from public.orders existing where existing.registration_id = duplicate.canonical_id
            and existing.course_id = target.course_id and existing.status in ('PENDING', 'WAITING_PAYMENT')
        );
      update public.seat_reservations reservation set status = 'EXPIRED'
      where reservation.order_id in (
        select id from public.orders where registration_id = duplicate_id and status = 'EXPIRED'
      ) and reservation.status = 'RESERVED';
      update public.orders set registration_id = duplicate.canonical_id where registration_id = duplicate_id;
      update public.notification_logs set registration_id = duplicate.canonical_id where registration_id = duplicate_id;
      update public.registration_contacts canonical set user_id = coalesce(canonical.user_id, source.user_id)
        from public.registration_contacts source
        where canonical.id = duplicate.canonical_id and source.id = duplicate_id;
      delete from public.registration_contacts where id = duplicate_id;
    end loop;
  end loop;
end $$;

drop index if exists public.registration_contacts_email_idx;
create unique index registration_contacts_email_key on public.registration_contacts(lower(email));

do $migration$
declare
  function_oid regprocedure := 'public.prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer)'::regprocedure;
  definition text;
  old_identity_block text := $old$
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
$old$;
  new_identity_block text := $new$
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
$new$;
begin
  definition := pg_get_functiondef(function_oid);
  if position(old_identity_block in definition) = 0 then
    raise exception 'identity block not found in prepare_guest_checkout_order';
  end if;
  execute replace(definition, old_identity_block, new_identity_block);
end
$migration$;
