-- Expand the pieces_category_check constraint to match all categories
-- defined in types/index.ts and admin/lib/types.ts.
-- The original migration only allowed 7 broad categories; the product
-- needs 24 specific ones for accurate filtering and display.

alter table public.pieces
  drop constraint if exists pieces_category_check;

alter table public.pieces
  add constraint pieces_category_check check (category in (
    'shirt', 'polo', 't-shirt', 'henley',
    'sweater', 'hoodie', 'sweatshirt', 'cardigan', 'vest',
    'pants', 'chinos', 'trousers', 'denim', 'joggers',
    'shorts',
    'outerwear', 'jacket', 'blazer', 'coat', 'bomber', 'fleece',
    'shoes',
    'accessories'
  ));
