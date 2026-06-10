create table public.profiles (
  id                        uuid references auth.users(id) on delete cascade primary key,
  email                     text not null,
  full_name                 text,
  phone                     text,
  shipping_address          jsonb,
  stripe_customer_id        text unique,
  stripe_payment_method_id  text,
  deposit_payment_intent_id text,
  deposit_status            text not null default 'none'
                              check (deposit_status in ('none','held','partially_captured','refunded','forfeited')),
  deposit_amount            integer not null default 0,
  active_rental_count       integer not null default 0,
  monthly_total             integer not null default 0,
  is_admin                  boolean not null default false,
  terms_accepted_at         timestamptz,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table public.wardrobes (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  slug            text unique not null,
  cover_image_url text,
  tags            text[] not null default '{}',
  is_active       boolean not null default true,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table public.pieces (
  id               uuid primary key default gen_random_uuid(),
  wardrobe_id      uuid references public.wardrobes(id) on delete set null,
  name             text not null,
  brand            text not null,
  description      text,
  category         text not null check (category in ('shirt','pants','shorts','outerwear','sweater','shoes','accessories')),
  color            text check (color in (
                     'Navy','White','Black','Grey','Olive','Khaki','Tan','Brown',
                     'Blue','Light Blue','Green','Burgundy','Red','Pink','Orange',
                     'Yellow','Purple','Cream','Charcoal','Multi','Pattern'
                   )),  -- standardized palette for consistent filtering
  sizes_available  text[] not null default '{}',
  condition        text not null default 'new' check (condition in ('new','like_new','good')),
  wear_count       integer not null default 0 check (wear_count >= 0),
  cost_price       integer not null check (cost_price > 0),
  base_rental_rate numeric not null default 0.15 check (base_rental_rate > 0),
  rental_fee       integer,
  buyout_price     integer,
  images           text[] not null default '{}',
  tags             text[] not null default '{}',
  is_available     boolean not null default true,
  is_featured      boolean not null default false,
  is_draft         boolean not null default false,
  source_url       text,
  source_retailer  text,
  retired_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.rentals (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid references public.profiles(id) on delete restrict not null,
  piece_id                    uuid references public.pieces(id) on delete restrict not null,
  size                        text not null,
  status                      text not null default 'pending'
                                check (status in ('pending','sourcing','shipped','delivered','return_requested','returned','bought_out')),
  tracking_number             text,
  carrier                     text,
  shipped_at                  timestamptz,
  delivered_at                timestamptz,
  returned_at                 timestamptz,
  rental_fee_cents            integer not null check (rental_fee_cents > 0),
  wear_count_at_rental        integer not null default 0,
  buyout_price_snapshot       integer not null,
  bought_out                  boolean not null default false,
  buyout_charged_cents        integer,
  last_billed_at              timestamptz,
  next_billing_date           date,
  billing_active              boolean not null default true,
  min_rental_days             integer not null default 30,
  notes                       text,
  -- Note: plan uses PaymentIntents for recurring billing, not Stripe Subscriptions
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create table public.orders (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references public.profiles(id) on delete restrict not null,
  rental_ids                uuid[] not null default '{}',
  stripe_payment_intent_id  text,
  deposit_intent_id         text,
  first_month_total         integer not null default 0,
  handling_fee_cents        integer not null default 0,   -- always set by RPC from env var
  deposit_amount            integer not null default 0,
  total_charged             integer not null default 0,
  shipping_address          jsonb not null default '{}',
  status                    text not null default 'pending'
                              check (status in ('pending','confirmed','sourcing','shipped','delivered','complete')),
  checkout_session_id       text,         -- web Stripe Checkout session ID (for idempotency)
  notes                     text,         -- admin notes (tracking info, shipping updates)
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create table public.billing_events (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid references public.profiles(id) on delete restrict not null,
  rental_id                 uuid references public.rentals(id) on delete set null,
  type                      text not null
                              check (type in ('first_month','recurring','buyout','deposit_hold','deposit_release','deposit_capture','refund')),
  amount_cents              integer not null,
  stripe_payment_intent_id  text,
  stripe_charge_id          text,
  status                    text not null check (status in ('succeeded','failed','refunded')),
  description               text,
  created_at                timestamptz not null default now()
);

create table public.suitcase_items (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  piece_id   uuid references public.pieces(id) on delete cascade not null,
  size       text not null,
  added_at   timestamptz not null default now(),
  unique(user_id, piece_id, size)
);
