-- 008_inventory_enhancements.sql
-- NOTE: The color CHECK constraint and sizes_available column are already in
-- 001_initial_schema.sql. This migration adds browse performance indexes only.
-- Running the color CHECK here again would cause a duplicate constraint error.
-- 008_inventory_enhancements.sql
-- Adds color constraint and indexes for filtering by color/size/category

-- Enforce standardized color palette
alter table public.pieces
  drop constraint if exists pieces_color_check;

alter table public.pieces
  add constraint pieces_color_check
  check (color is null or color in (
    'Navy','White','Black','Grey','Olive','Khaki','Tan','Brown',
    'Blue','Light Blue','Green','Burgundy','Red','Pink','Orange',
    'Yellow','Purple','Cream','Charcoal','Multi','Pattern'
  ));

-- Upgrade browse indexes to include is_available = true filter (more selective for customer queries)
-- 005_indexes.sql created these without the is_available condition; drop and recreate with it.
drop index if exists pieces_color_idx;
create index if not exists pieces_color_idx
  on public.pieces (color) where is_draft = false and is_available = true;

drop index if exists pieces_category_idx;
create index if not exists pieces_category_idx
  on public.pieces (category) where is_draft = false and is_available = true;

-- Replace the 005 wardrobe index (identical definition, cleaner name)
drop index if exists pieces_wardrobe_id_idx;
create index if not exists pieces_wardrobe_idx
  on public.pieces (wardrobe_id) where is_draft = false;

create index if not exists pieces_featured_idx
  on public.pieces (is_featured) where is_featured = true and is_draft = false;

-- GIN index for tags array filtering (supports @> operator, not covered by btree)
create index if not exists pieces_tags_gin_idx
  on public.pieces using gin (tags);
