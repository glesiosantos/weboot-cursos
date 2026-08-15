-- Pedidos do checkout hospedado antigo podem ter ficado em PENDING antes de receber a URL.
-- Eles tambem ocupam o indice de pedido ativo e devem ser expirados ou reutilizados.
do $migration$
declare
  function_oid regprocedure := 'public.prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer)'::regprocedure;
  definition text;
begin
  definition := pg_get_functiondef(function_oid);
  definition := replace(
    definition,
    'where status = ''WAITING_PAYMENT'' and expires_at <= now()',
    'where status in (''PENDING'', ''WAITING_PAYMENT'') and expires_at <= now()'
  );
  definition := replace(
    definition,
    'and course_id = target_course_id and status = ''WAITING_PAYMENT'' and expires_at > now()',
    'and course_id = target_course_id and status in (''PENDING'', ''WAITING_PAYMENT'') and expires_at > now()'
  );
  execute definition;
end
$migration$;
