alter table public.orders
  add column if not exists provider_preference_id text;

create unique index if not exists orders_provider_preference_id_key
  on public.orders(provider_preference_id)
  where provider_preference_id is not null;
