-- 022_rentals_piece_unit_integrity.sql
-- Two improvements to rentals.piece_unit_id:
--
-- 1. Index: FK columns without indexes cause sequential scans on cascades and joins.
--    rentals.piece_unit_id is queried when loading order/rental detail screens.
--
-- 2. ON DELETE RESTRICT: the original FK (migration 013) had no ON DELETE clause,
--    which defaults to NO ACTION (similar to RESTRICT but deferred). Making it
--    explicit as RESTRICT prevents accidental deletion of a piece_unit that still
--    has an active rental attached to it.

create index if not exists rentals_piece_unit_id_idx
  on public.rentals (piece_unit_id);

-- Drop and recreate the FK with explicit ON DELETE RESTRICT.
-- Postgres auto-named this constraint rentals_piece_unit_id_fkey.
alter table public.rentals
  drop constraint if exists rentals_piece_unit_id_fkey,
  add  constraint rentals_piece_unit_id_fkey
    foreign key (piece_unit_id)
    references public.piece_units (id)
    on delete restrict;
