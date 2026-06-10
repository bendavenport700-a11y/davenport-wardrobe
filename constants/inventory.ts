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

const TOPS    = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const BOTTOMS = ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42']
const SHORTS_SIZES = ['28', '29', '30', '31', '32', '33', '34', '36', '38']

export const SIZES_BY_CATEGORY: Record<string, string[]> = {
  // Tops
  shirt:       TOPS,
  polo:        TOPS,
  't-shirt':   TOPS,
  tshirt:      TOPS,
  sweater:     TOPS,
  hoodie:      TOPS,
  sweatshirt:  TOPS,
  cardigan:    TOPS,
  vest:        TOPS,
  henley:      TOPS,
  // Outerwear
  outerwear:   TOPS,
  jacket:      TOPS,
  blazer:      TOPS,
  coat:        TOPS,
  bomber:      TOPS,
  'chore coat': TOPS,
  'shirt jacket': TOPS,
  fleece:      TOPS,
  // Bottoms
  pants:       BOTTOMS,
  chinos:      BOTTOMS,
  chino:       BOTTOMS,
  trousers:    BOTTOMS,
  denim:       BOTTOMS,
  joggers:     BOTTOMS,
  shorts:      SHORTS_SIZES,
  // Other
  shoes:       ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12'],
  accessories: ['One Size'],
  belt:        ['One Size'],
}

export const ALL_SIZES = ['XS','S','M','L','XL','XXL','28','29','30','31','32','33','34','36','38','40','42','7','7.5','8','8.5','9','9.5','10','10.5','11','11.5','12','One Size'] as const
