export const PIECE_COLORS = [
  'Navy', 'White', 'Black', 'Grey', 'Olive', 'Khaki', 'Tan', 'Brown',
  'Blue', 'Light Blue', 'Green', 'Burgundy', 'Red', 'Pink', 'Orange',
  'Yellow', 'Purple', 'Cream', 'Charcoal', 'Multi', 'Pattern',
] as const

export const COLOR_HEX: Record<string, string> = {
  Navy: '#1B2A4A', White: '#FFFFFF', Black: '#111111', Grey: '#9CA3AF',
  Olive: '#708238', Khaki: '#C3B091', Tan: '#D2B48C', Brown: '#8B4513',
  Blue: '#2563EB', 'Light Blue': '#93C5FD', Green: '#16A34A', Burgundy: '#800020',
  Red: '#DC2626', Pink: '#F472B6', Orange: '#F97316', Yellow: '#EAB308',
  Purple: '#7C3AED', Cream: '#FFFDD0', Charcoal: '#374151',
  Multi: '#888888', Pattern: '#888888',
}

const TOPS         = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const BOTTOMS      = ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42']
const SHORTS_SIZES = ['28', '29', '30', '31', '32', '33', '34', '36', '38']
const WOMENS_TOPS  = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const WOMENS_NUMERIC = ['00', '0', '2', '4', '6', '8', '10', '12', '14', '16', '18']
const WOMENS_SHOES = ['5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10']

export const SIZES_BY_CATEGORY: Record<string, string[]> = {
  // Men's tops
  shirt:            TOPS,
  polo:             TOPS,
  't-shirt':        TOPS,
  tshirt:           TOPS,
  sweater:          TOPS,
  hoodie:           TOPS,
  sweatshirt:       TOPS,
  cardigan:         TOPS,
  vest:             TOPS,
  henley:           TOPS,
  // Men's outerwear
  outerwear:        TOPS,
  jacket:           TOPS,
  blazer:           TOPS,
  coat:             TOPS,
  bomber:           TOPS,
  'chore coat':     TOPS,
  'shirt jacket':   TOPS,
  fleece:           TOPS,
  // Men's bottoms
  pants:            BOTTOMS,
  chinos:           BOTTOMS,
  chino:            BOTTOMS,
  trousers:         BOTTOMS,
  denim:            BOTTOMS,
  joggers:          BOTTOMS,
  shorts:           SHORTS_SIZES,
  // Men's other
  shoes:            ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
  accessories:      ['One Size'],
  belt:             ['One Size'],
  // Women's dresses
  dress:            WOMENS_NUMERIC,
  'midi-dress':     WOMENS_NUMERIC,
  'maxi-dress':     WOMENS_NUMERIC,
  'mini-dress':     WOMENS_NUMERIC,
  romper:           WOMENS_NUMERIC,
  jumpsuit:         WOMENS_NUMERIC,
  // Women's separates
  skirt:            WOMENS_NUMERIC,
  blouse:           WOMENS_TOPS,
  'women-shirt':    WOMENS_TOPS,
  'women-pants':    WOMENS_NUMERIC,
  'women-shorts':   WOMENS_NUMERIC,
  // Women's outerwear
  'women-outerwear': WOMENS_TOPS,
  'women-jacket':   WOMENS_TOPS,
  // Women's other
  'women-shoes':    WOMENS_SHOES,
  'women-accessories': ['One Size'],
}

export const ALL_SIZES = [
  'XS','S','M','L','XL','XXL',
  '28','29','30','31','32','33','34','36','38','40','42',
  '7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12',
  '00','0','2','4','6','8','10','12','14','16','18',
  '5','5.5','6','6.5',
  'One Size',
] as const

export const MEN_CATEGORIES = [
  'shirt', 'polo', 't-shirt', 'henley',
  'sweater', 'hoodie', 'sweatshirt', 'cardigan', 'vest',
  'pants', 'chinos', 'trousers', 'denim', 'joggers',
  'shorts', 'outerwear', 'jacket', 'blazer', 'coat', 'bomber', 'fleece',
  'shoes', 'accessories',
] as const

export const WOMEN_CATEGORIES = [
  'dress', 'midi-dress', 'maxi-dress', 'mini-dress',
  'skirt', 'blouse', 'women-shirt', 'women-pants', 'women-shorts',
  'romper', 'jumpsuit', 'women-outerwear', 'women-jacket',
  'women-shoes', 'women-accessories',
] as const

export const CATEGORY_LABELS: Record<string, string> = {
  'shirt': 'Shirt', 'polo': 'Polo', 't-shirt': 'T-Shirt', 'henley': 'Henley',
  'sweater': 'Sweater', 'hoodie': 'Hoodie', 'sweatshirt': 'Sweatshirt',
  'cardigan': 'Cardigan', 'vest': 'Vest',
  'pants': 'Pants', 'chinos': 'Chinos', 'trousers': 'Trousers',
  'denim': 'Denim', 'joggers': 'Joggers', 'shorts': 'Shorts',
  'outerwear': 'Outerwear', 'jacket': 'Jacket', 'blazer': 'Blazer',
  'coat': 'Coat', 'bomber': 'Bomber', 'fleece': 'Fleece',
  'shoes': 'Shoes', 'accessories': 'Accessories',
  'dress': 'Dress', 'midi-dress': 'Midi Dress', 'maxi-dress': 'Maxi Dress', 'mini-dress': 'Mini Dress',
  'skirt': 'Skirt', 'blouse': 'Blouse', 'women-shirt': 'Shirt', 'women-pants': 'Pants',
  'women-shorts': 'Shorts', 'romper': 'Romper', 'jumpsuit': 'Jumpsuit',
  'women-outerwear': 'Outerwear', 'women-jacket': 'Jacket',
  'women-shoes': 'Shoes', 'women-accessories': 'Accessories',
}
