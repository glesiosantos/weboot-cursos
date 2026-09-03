-- Pagamentos recebidos fora do checkout podem ser confirmados por um administrador.
-- A referencia informada pelo operador continua unica e auditavel em payments.
alter table public.orders drop constraint if exists orders_payment_provider_check;
alter table public.orders add constraint orders_payment_provider_check
  check (payment_provider is null or payment_provider in ('ASAAS', 'MERCADO_PAGO', 'MANUAL'));
