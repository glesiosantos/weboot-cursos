-- Permite que o administrador confirme recebimento avulso de uma reserva
-- cancelada, desde que a API já tenha convertido o pedido para MANUAL.
do $migration$
declare
  function_oid regprocedure := 'public.confirm_commercial_payment(uuid,text,text,text,text)'::regprocedure;
  definition text;
begin
  definition := pg_get_functiondef(function_oid);
  if position($needle$target_order.status in ('REFUNDED', 'CANCELED')$needle$ in definition) > 0 then
    definition := replace(definition, $needle$target_order.status in ('REFUNDED', 'CANCELED')$needle$, $replacement$target_order.status = 'REFUNDED'$replacement$);
    execute definition;
  end if;
end
$migration$;
