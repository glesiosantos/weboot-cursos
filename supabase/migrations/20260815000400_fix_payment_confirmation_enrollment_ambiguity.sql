-- A coluna event_credentials.enrollment_id coincide com a variavel de retorno da funcao.
-- Prioriza colunas SQL em expressoes ambiguas, mantendo a funcao idempotente.
do $migration$
declare
  function_oid regprocedure := 'public.confirm_commercial_payment(uuid,text,text,text,text)'::regprocedure;
  definition text;
  body_start integer;
begin
  definition := pg_get_functiondef(function_oid);
  if position('#variable_conflict use_column' in definition) = 0 then
    body_start := position('$function$' || chr(10) in definition);
    if body_start = 0 then
      raise exception 'could not locate confirm_commercial_payment body';
    end if;
    definition := overlay(
      definition placing '#variable_conflict use_column' || chr(10)
      from body_start + length('$function$' || chr(10)) for 0
    );
    execute definition;
  end if;
end
$migration$;
