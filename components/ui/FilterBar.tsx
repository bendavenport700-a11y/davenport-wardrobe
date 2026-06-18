import { ScrollView, Pressable, Text, View } from 'react-native'
import { colors } from '@/constants/colors'
import type { PieceCategory } from '@/types'

// ── Category data (used by FilterSheet) ───────────────────────────────────────

export const CATEGORY_GROUPS = [
  { label: 'All',         categories: null },
  { label: 'Tops',        categories: ['shirt', 'polo', 't-shirt', 'henley', 'sweater', 'hoodie', 'sweatshirt', 'cardigan', 'vest'] as PieceCategory[] },
  { label: 'Bottoms',     categories: ['pants', 'chinos', 'trousers', 'denim', 'joggers'] as PieceCategory[] },
  { label: 'Outerwear',   categories: ['outerwear', 'jacket', 'blazer', 'coat', 'bomber', 'fleece'] as PieceCategory[] },
  { label: 'Shorts',      categories: ['shorts'] as PieceCategory[] },
  { label: 'Shoes',       categories: ['shoes'] as PieceCategory[] },
  { label: 'Accessories', categories: ['accessories'] as PieceCategory[] },
]

export function categoryGroupToList(group: string | null): PieceCategory[] | null {
  if (!group) return null
  return CATEGORY_GROUPS.find(g => g.label === group)?.categories ?? null
}

export function sizesForGroup(group: string | null | undefined): string[] {
  switch (group) {
    case 'Tops':
    case 'Outerwear':   return ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    case 'Bottoms':     return ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42']
    case 'Shorts':      return ['28', '29', '30', '31', '32', '33', '34', '36', '38']
    case 'Shoes':       return ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12']
    case 'Accessories': return ['One Size']
    default:            return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36']
  }
}

// ── Occasion data ─────────────────────────────────────────────────────────────

export const OCCASIONS = ['Work', 'Weekend', 'Casual', 'Formal', 'Active', 'Outdoor']

// ── Occasion bar (primary browse filter) ──────────────────────────────────────

interface FilterBarProps {
  selectedOccasion: string | null
  onOccasionChange: (occasion: string | null) => void
}

export function FilterBar({ selectedOccasion, onOccasionChange }: FilterBarProps) {
  const options = [null, ...OCCASIONS]

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
    >
      {options.map(option => {
        const label  = option ?? 'All'
        const active = option === selectedOccasion
        return (
          <Pressable
            key={label}
            onPress={() => onOccasionChange(option)}
            accessibilityRole="button"
            accessibilityLabel={`${label} filter`}
            accessibilityState={{ selected: active }}
            style={{
              paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
              backgroundColor: active ? colors.navy : colors.white,
              borderWidth: 1, borderColor: active ? colors.navy : colors.sand + 'CC',
            }}
          >
            <Text style={{
              fontFamily: 'Inter-Medium', fontSize: 13,
              color: active ? colors.cream : colors.slate,
              letterSpacing: 0.1,
            }}>
              {label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
