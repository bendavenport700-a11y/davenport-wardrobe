-- 1. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Increment wear_count on a piece (called by admin when marking rental 'delivered')
-- The refresh_piece_pricing trigger fires automatically after the update.
create or replace function public.increment_wear_count(p_piece_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.pieces
  set wear_count = wear_count + 1
  where id = p_piece_id;
end;
$$;

revoke execute on function public.increment_wear_count from public;
grant execute on function public.increment_wear_count to service_role;

-- 2. Recompute piece pricing on insert or relevant column change
create or replace function public.refresh_piece_pricing()
returns trigger language plpgsql as $$
declare
  v_buyout integer;
  v_rental integer;
begin
  v_buyout := round(new.cost_price::numeric * greatest(0.30, 0.90 - new.wear_count * 0.08));
  v_rental := round(v_buyout::numeric * greatest(0.05, new.base_rental_rate - new.wear_count * 0.010));
  new.buyout_price := v_buyout;
  new.rental_fee   := v_rental;
  if v_rental < 400 then
    new.is_available := false;
    new.retired_at   := coalesce(new.retired_at, now());
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists piece_pricing_refresh on public.pieces;
create trigger piece_pricing_refresh
  before insert or update of wear_count, cost_price, base_rental_rate
  on public.pieces
  for each row execute procedure public.refresh_piece_pricing();

-- 3. updated_at stamps
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

drop trigger if exists profiles_updated_at  on public.profiles;
drop trigger if exists wardrobes_updated_at on public.wardrobes;
drop trigger if exists rentals_updated_at   on public.rentals;
drop trigger if exists orders_updated_at    on public.orders;
create trigger profiles_updated_at  before update on public.profiles  for each row execute procedure public.set_updated_at();
create trigger wardrobes_updated_at before update on public.wardrobes for each row execute procedure public.set_updated_at();
create trigger rentals_updated_at   before update on public.rentals   for each row execute procedure public.set_updated_at();
create trigger orders_updated_at    before update on public.orders    for each row execute procedure public.set_updated_at();
-- pieces updated_at handled inside refresh_piece_pricing to avoid double-fire
