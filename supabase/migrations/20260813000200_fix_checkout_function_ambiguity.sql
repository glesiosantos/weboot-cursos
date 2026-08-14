-- Resolve nomes de colunas que coincidem com os campos de retorno das funcoes.
-- A diretiva e gravada no corpo de cada funcao sem alterar assinatura ou dados.
do $migration$
declare
  function_oid regprocedure;
  definition text;
  body_start integer;
begin
  foreach function_oid in array array[
    'public.prepare_checkout_order(uuid,uuid,integer)'::regprocedure,
    'public.prepare_guest_checkout_order(uuid,text,text,text,text,text,text,text,boolean,integer)'::regprocedure
  ] loop
    definition := pg_get_functiondef(function_oid);
    if position('#variable_conflict use_column' in definition) = 0 then
      body_start := position('$function$' || chr(10) in definition);
      if body_start = 0 then
        raise exception 'could not locate body of checkout function %', function_oid;
      end if;
      definition := overlay(
        definition placing '#variable_conflict use_column' || chr(10)
        from body_start + length('$function$' || chr(10)) for 0
      );
      execute definition;
    end if;
  end loop;
end
$migration$;
