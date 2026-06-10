export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  shipping_address: ShippingAddress | null
  stripe_customer_id: string | null
  stripe_payment_method_id: string | null
  deposit_payment_intent_id: string | null
  deposit_status: 'none' | 'held' | 'partially_captured' | 'refunded' | 'forfeited'
  deposit_amount: number
  active_rental_count: number
  monthly_total: number
  is_admin: boolean
  terms_accepted_at: string | null
  created_at: string
  updated_at: string
}

export interface ShippingAddress {
  line1: string
  line2?: string
  city: string
  state: string
  zip: string
}

export interface Wardrobe {
  id: string
  name: string
  description: string | null
  slug: string
  cover_image_url: string | null
  tags: string[]
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export type PieceCategory =
  | 'shirt' | 'polo' | 't-shirt' | 'henley'
  | 'sweater' | 'hoodie' | 'sweatshirt' | 'cardigan' | 'vest'
  | 'pants' | 'chinos' | 'trousers' | 'denim' | 'joggers'
  | 'shorts' | 'outerwear' | 'jacket' | 'blazer' | 'coat' | 'bomber' | 'fleece'
  | 'shoes' | 'accessories'
export type PieceColor = 'Navy' | 'White' | 'Black' | 'Grey' | 'Olive' | 'Khaki' | 'Tan' | 'Brown' |
  'Blue' | 'Light Blue' | 'Green' | 'Burgundy' | 'Red' | 'Pink' | 'Orange' |
  'Yellow' | 'Purple' | 'Cream' | 'Charcoal' | 'Multi' | 'Pattern'
export type ClothingSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '28' | '29' | '30' | '31' | '32' | '33' | '34' | '36' | '38' | '40' | '42' | '7' | '7.5' | '8' | '8.5' | '9' | '9.5' | '10' | '10.5' | '11' | '11.5' | '12' | 'One Size'
export type PieceCondition = 'new' | 'like_new' | 'good'
export type ImageSource = 'retailer' | 'own'

export interface Piece {
  id: string
  wardrobe_id: string | null
  name: string
  brand: string
  description: string | null
  category: PieceCategory
  color: PieceColor | null
  sizes_available: string[]
  condition: PieceCondition
  wear_count: number
  cost_price: number
  base_rental_rate: number
  rental_fee: number
  buyout_price: number
  images: string[]
  tags: string[]
  is_available: boolean
  is_featured: boolean
  is_draft: boolean
  source_url: string | null
  source_retailer: string | null
  retired_at: string | null
  created_at: string
  updated_at: string
}

export type RentalStatus = 'pending' | 'sourcing' | 'shipped' | 'delivered' | 'return_requested' | 'returned' | 'bought_out'

export interface Rental {
  id: string
  user_id: string
  piece_id: string
  piece?: Piece
  size: string
  status: RentalStatus
  tracking_number: string | null
  carrier: string | null
  shipped_at: string | null
  delivered_at: string | null
  returned_at: string | null
  rental_fee_cents: number
  wear_count_at_rental: number
  buyout_price_snapshot: number
  bought_out: boolean
  buyout_charged_cents: number | null
  last_billed_at: string | null
  next_billing_date: string | null
  billing_active: boolean
  min_rental_days: number
  notes: string | null
  created_at: string
  updated_at: string
}

export type OrderStatus = 'pending' | 'confirmed' | 'sourcing' | 'shipped' | 'delivered' | 'complete'

export interface Order {
  id: string
  user_id: string
  rental_ids: string[]
  stripe_payment_intent_id: string | null
  deposit_intent_id: string | null
  first_month_total: number
  handling_fee_cents: number
  deposit_amount: number
  total_charged: number
  shipping_address: ShippingAddress
  status: OrderStatus
  checkout_session_id: string | null
  notes: string | null
  rentals?: Rental[]
  created_at: string
  updated_at: string
}

export type BillingEventType = 'first_month' | 'recurring' | 'buyout' | 'deposit_hold' | 'deposit_release' | 'deposit_capture' | 'refund'

export interface BillingEvent {
  id: string
  user_id: string
  rental_id: string | null
  type: BillingEventType
  amount_cents: number
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  status: 'succeeded' | 'failed' | 'refunded'
  description: string | null
  created_at: string
}

export interface SuitcaseItem {
  piece_id: string
  piece: Piece
  size: string
  rental_fee_cents: number
}
