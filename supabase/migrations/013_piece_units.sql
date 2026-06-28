-- 013_piece_units.sql
-- Each physical garment is a piece_unit row.
-- Rentals are now tied to a specific unit, enabling per-unit wear tracking
-- and per-size inventory counts.

-- ── piece_units table ─────────────────────────────────────────────────────

create table public.piece_units (
  id          uuid        primary key default gen_random_uuid(),
  piece_id    uuid        not null references public.pieces(id) on delete cascade,
  size        text        not null,
  wear_count  int         not null default 0,
  condition   text        not null default 'new'
              check (condition in ('new', 'like_new', 'good')),
  is_available boolean    not null default true,
  notes       text,
  created_at  timestamptz not null default now()
);

create index piece_units_piece_idx     on public.piece_units(piece_id);
create index piece_units_available_idx on public.piece_units(piece_id, size) where is_available = true;

alter table public.piece_units enable row level security;

create policy "Anyone can read piece_units"
  on public.piece_units for select
  using (true);

-- ── Add piece_unit_id to rentals ──────────────────────────────────────────

alter table public.rentals
  add column if not exists piece_unit_id uuid references public.piece_units(id);

-- ── Seed: one unit per size per piece ─────────────────────────────────────

insert into public.piece_units (piece_id, size, wear_count, condition, is_available)
select
  p.id,
  s.size,
  p.wear_count,
  p.condition,
  true
from public.pieces p,
  lateral unnest(p.sizes_available) as s(size)
where array_length(p.sizes_available, 1) > 0;

-- ── Link existing active rentals to units ─────────────────────────────────

with matched as (
  select distinct on (r.id)
    r.id   as rental_id,
    pu.id  as unit_id
  from public.rentals r
  join public.piece_units pu
    on  pu.piece_id = r.piece_id
    and pu.size     = r.size
  where r.status not in ('returned', 'bought_out')
    and r.piece_unit_id is null
  order by r.id, pu.created_at
)
update public.rentals r
set piece_unit_id = m.unit_id
from matched m
where r.id = m.rental_id;

-- Mark active-rental units as unavailable
update public.piece_units pu
set is_available = false
from public.rentals r
where r.piece_unit_id = pu.id
  and r.status not in ('returned', 'bought_out');

-- ── Sync pieces.sizes_available to available-units-only ───────────────────

update public.pieces p
set
  sizes_available = coalesce(avail.sizes, '{}'),
  is_available    = (avail.sizes is not null and array_length(avail.sizes, 1) > 0)
from (
  select
    piece_id,
    array_agg(distinct size order by size) filter (where is_available = true) as sizes
  from public.piece_units
  group by piece_id
) avail
where avail.piece_id = p.id;

-- ── Updated create_order_atomic ───────────────────────────────────────────

create or replace function public.create_order_atomic(
  p_user_id               uuid,
  p_order_id              uuid,
  p_items                 jsonb,
  p_payment_intent_id     text,
  p_deposit_intent_id     text,
  p_has_deposit_on_file   boolean,
  p_shipping_address      jsonb,
  p_checkout_session_id   text    default null,
  p_handling_fee_cents    integer default 0,
  p_deposit_amount_cents  integer default 0,
  p_charged_today_cents   integer default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rental_ids       uuid[]  := '{}';
  v_rental_id        uuid;
  v_unit_id          uuid;
  v_monthly_total    integer := 0;
  v_deposit_amount   integer;
  v_item             jsonb;
  v_piece_id         uuid;
  v_size             text;
  v_avail_sizes      text[];
  v_next_billing     date := (date_trunc('month', now()) + interval '1 month')::date;
begin
  select coalesce(sum((item->>'rental_fee_cents')::integer), 0)
  into v_monthly_total
  from jsonb_array_elements(p_items) as item;

  v_deposit_amount := case when p_has_deposit_on_file then 0 else p_deposit_amount_cents end;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_piece_id := (v_item->>'piece_id')::uuid;
    v_size     := v_item->>'size';

    -- Claim least-worn available unit; SKIP LOCKED prevents deadlocks
    select id into v_unit_id
    from public.piece_units
    where piece_id     = v_piece_id
      and size         = v_size
      and is_available = true
    order by wear_count asc, created_at asc
    limit 1
    for update skip locked;

    if v_unit_id is null then
      raise exception 'SIZE_UNAVAILABLE:%:%', v_piece_id, v_size
        using errcode = 'P0001';
    end if;

    update public.piece_units set is_available = false where id = v_unit_id;

    insert into public.rentals (
      user_id, piece_id, piece_unit_id, size, status,
      rental_fee_cents, wear_count_at_rental, buyout_price_snapshot,
      billing_active, last_billed_at, next_billing_date, min_rental_days
    ) values (
      p_user_id, v_piece_id, v_unit_id, v_size, 'pending',
      (v_item->>'rental_fee_cents')::integer,
      (v_item->>'wear_count_at_rental')::integer,
      (v_item->>'buyout_price_snapshot')::integer,
      true, now(), v_next_billing, 30
    )
    returning id into v_rental_id;

    v_rental_ids := v_rental_ids || v_rental_id;

    select array_agg(distinct size order by size)
    into v_avail_sizes
    from public.piece_units
    where piece_id = v_piece_id and is_available = true;

    update public.pieces
    set
      sizes_available = coalesce(v_avail_sizes, '{}'),
      is_available    = (v_avail_sizes is not null)
    where id = v_piece_id;

  end loop;

  insert into public.orders (
    id, user_id, rental_ids,
    stripe_payment_intent_id, deposit_intent_id,
    first_month_total, handling_fee_cents, deposit_amount, total_charged,
    shipping_address, status, checkout_session_id
  ) values (
    p_order_id, p_user_id, v_rental_ids,
    p_payment_intent_id, p_deposit_intent_id,
    v_monthly_total, p_handling_fee_cents, v_deposit_amount,
    coalesce(p_charged_today_cents, v_monthly_total + p_handling_fee_cents + v_deposit_amount),
    p_shipping_address, 'confirmed', p_checkout_session_id
  );

  update public.profiles
  set
    active_rental_count = active_rental_count + jsonb_array_length(p_items),
    monthly_total       = monthly_total + v_monthly_total
  where id = p_user_id;

  insert into public.billing_events (
    user_id, type, amount_cents, stripe_payment_intent_id, status, description
  ) values (
    p_user_id, 'first_month',
    coalesce(p_charged_today_cents, v_monthly_total + p_handling_fee_cents),
    p_payment_intent_id, 'succeeded',
    'First month + delivery — ' || jsonb_array_length(p_items)::text || ' piece(s)'
  );

  delete from public.suitcase_items where user_id = p_user_id;

  return p_order_id;
end;
$$;

revoke execute on function public.create_order_atomic from public;
revoke execute on function public.create_order_atomic from authenticated;
grant  execute on function public.create_order_atomic to service_role;
