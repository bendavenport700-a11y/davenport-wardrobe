export type PieceCategory =
  | 'shirt' | 'polo' | 't-shirt' | 'henley'
  | 'sweater' | 'hoodie' | 'sweatshirt' | 'cardigan' | 'vest'
  | 'pants' | 'chinos' | 'trousers' | 'denim' | 'joggers'
  | 'shorts' | 'outerwear' | 'jacket' | 'blazer' | 'coat' | 'bomber' | 'fleece'
  | 'shoes' | 'accessories'
  | 'dress' | 'midi-dress' | 'maxi-dress' | 'mini-dress'
  | 'skirt' | 'blouse' | 'women-shirt' | 'women-pants' | 'women-shorts'
  | 'romper' | 'jumpsuit' | 'women-outerwear' | 'women-jacket'
  | 'women-shoes' | 'women-accessories'

export type PieceGender = 'men' | 'women' | 'unisex'
export type PieceColor = 'Navy' | 'White' | 'Black' | 'Grey' | 'Olive' | 'Khaki' | 'Tan' | 'Brown' |
  'Blue' | 'Light Blue' | 'Green' | 'Burgundy' | 'Red' | 'Pink' | 'Orange' |
  'Yellow' | 'Purple' | 'Cream' | 'Charcoal' | 'Multi' | 'Pattern'

export const MEN_CATEGORIES: PieceCategory[] = [
  'shirt', 'polo', 't-shirt', 'henley',
  'sweater', 'hoodie', 'sweatshirt', 'cardigan', 'vest',
  'pants', 'chinos', 'trousers', 'denim', 'joggers',
  'shorts', 'outerwear', 'jacket', 'blazer', 'coat', 'bomber', 'fleece',
  'shoes', 'accessories',
]
export const WOMEN_CATEGORIES: PieceCategory[] = [
  'dress', 'midi-dress', 'maxi-dress', 'mini-dress',
  'skirt', 'blouse', 'women-shirt', 'women-pants', 'women-shorts',
  'romper', 'jumpsuit', 'women-outerwear', 'women-jacket',
  'women-shoes', 'women-accessories',
]
export const CATEGORIES: PieceCategory[] = [...MEN_CATEGORIES, ...WOMEN_CATEGORIES]
export const COLORS: PieceColor[] = ['Navy', 'White', 'Black', 'Grey', 'Olive', 'Khaki', 'Tan', 'Brown',
  'Blue', 'Light Blue', 'Green', 'Burgundy', 'Red', 'Pink', 'Orange',
  'Yellow', 'Purple', 'Cream', 'Charcoal', 'Multi', 'Pattern']

export interface Piece {
  id: string
  wardrobe_id: string | null
  name: string
  brand: string
  description: string | null
  category: PieceCategory
  color: PieceColor | null
  sizes_available: string[]
  condition: 'new' | 'like_new' | 'good'
  wear_count: number
  cost_price: number
  base_rental_rate: number
  rental_fee: number | null
  buyout_price: number | null
  images: string[]
  tags: string[]
  gender: PieceGender
  discount_pct: number
  is_available: boolean
  is_featured: boolean
  is_draft: boolean
  source_url: string | null
  source_retailer: string | null
  retired_at: string | null
  created_at: string
  updated_at: string
}

export interface Rental {
  id: string
  user_id: string
  piece_id: string
  piece?: { id?: string; name: string; brand: string; images: string[]; source_url?: string | null }
  size: string
  status: 'pending' | 'sourcing' | 'packaged' | 'shipped' | 'delivered' | 'return_requested' | 'returned' | 'bought_out'
  tracking_number: string | null
  carrier: string | null
  rental_fee_cents: number
  buyout_price_snapshot: number
  bought_out: boolean
  billing_active: boolean
  next_billing_date: string | null
  created_at: string
}

export interface Order {
  id: string
  user_id: string
  rental_ids: string[]
  rentals?: Rental[]
  profile?: { email: string; full_name: string | null }
  first_month_total: number
  handling_fee_cents: number
  deposit_amount: number
  total_charged: number
  shipping_address: { line1: string; line2?: string; city: string; state: string; zip: string }
  status: 'pending' | 'confirmed' | 'sourcing' | 'packaged' | 'shipped' | 'delivered' | 'complete' | 'refunded' | 'refund_requested'
  notes: string | null
  stripe_payment_intent_id: string | null
  deposit_intent_id: string | null
  created_at: string
  updated_at: string
}

export interface PieceUnit {
  id: string
  piece_id: string
  size: string
  wear_count: number
  condition: 'new' | 'like_new' | 'good'
  is_available: boolean
  notes: string | null
  created_at: string
}

export interface Wardrobe {
  id: string
  name: string
  description: string | null
  slug: string
  cover_image_url: string | null
  tags: string[]
  gender: PieceGender
  is_active: boolean
  sort_order: number
  created_at: string
}
