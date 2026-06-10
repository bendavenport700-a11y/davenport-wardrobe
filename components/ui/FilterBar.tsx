import { ScrollView, Pressable, Text, View } from 'react-native'
import { PIECE_COLORS, COLOR_HEX } from '@/constants/inventory'
import { colors } from '@/constants/colors'
import type { PieceCategory, PieceColor } from '@/types'

export const CATEGORY_GROUPS = [
  { label: 'All',        categories: null },
  { label: 'Tops',       categories: ['shirt', 'polo', 't-shirt', 'henley', 'sweater', 'hoodie', 'sweatshirt', 'cardigan', 'vest'] as PieceCategory[] },
  { label: 'Bottoms',    categories: ['pants', 'chinos', 'trousers', 'denim', 'joggers'] as PieceCategory[] },
  { label: 'Outerwear',  categories: ['outerwear', 'jacket', 'blazer', 'coat', 'bomber', 'fleece'] as PieceCategory[] },
  { label: 'Shorts',     categories: ['shorts'] as PieceCategory[] },
  { label: 'Shoes',      categories: ['shoes'] as PieceCategory[] },
  { label: 'Accessories',categories: ['accessories'] as PieceCategory[] },
]

export function categoryGroupToList(group: string | null): PieceCategory[] | null {
  if (!group) return null
  return CATEGORY_GROUPS.find(g => g.label === group)?.categories ?? null
}

function sizesForGroup(group: string | null | undefined): string[] {
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

interface FilterBarProps {
  selectedGroup?: string | null
  selectedColor?: PieceColor | null
  selectedSize?: string | null
  onGroupChange: (group: string | null) => void
  onColorChange: (c: PieceColor | null) => void
  onSizeChange?: (size: string | null) => void
}

export function FilterBar({
  selectedGroup, selectedColor, selectedSize,
  onGroupChange, onColorChange, onSizeChange,
}: FilterBarProps) {
  const availableSizes = sizesForGroup(selectedGroup)

  return (
    <View style={{ gap: 8 }}>

      {/* Category pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
        {CATEGORY_GROUPS.map(({ label }) => {
          const active = label === 'All' ? !selectedGroup : selectedGroup === label
          return (
            <Pressable
              key={label}
              onPress={() => {
                onGroupChange(label === 'All' ? null : label)
                if (onSizeChange) onSizeChange(null)
              }}
              accessibilityState={{ selected: active }}
              style={{
                paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
                backgroundColor: active ? colors.navy : colors.white,
                borderWidth: 1, borderColor: active ? colors.navy : colors.sand,
              }}>
              <Text style={{
                fontFamily: 'Inter-Medium', fontSize: 13,
                color: active ? colors.cream : colors.slate,
              }}>{label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Size pills — only when a category is selected and handler provided */}
      {onSizeChange && selectedGroup && availableSizes.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
          <Pressable
            onPress={() => onSizeChange(null)}
            style={{
              paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
              backgroundColor: !selectedSize ? colors.navy : colors.white,
              borderWidth: 1, borderColor: !selectedSize ? colors.navy : colors.sand,
            }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: !selectedSize ? colors.cream : colors.slate }}>
              All
            </Text>
          </Pressable>
          {availableSizes.map(size => (
            <Pressable
              key={size}
              onPress={() => onSizeChange(selectedSize === size ? null : size)}
              accessibilityState={{ selected: selectedSize === size }}
              style={{
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
                borderWidth: 1.5,
                borderColor: selectedSize === size ? colors.navy : colors.sand,
                backgroundColor: selectedSize === size ? colors.navy : colors.white,
              }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: selectedSize === size ? colors.cream : colors.navy }}>
                {size}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Color dots — no text labels, just circles */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 4, alignItems: 'center' }}>
        {/* "All colors" clear button */}
        <Pressable
          onPress={() => onColorChange(null)}
          style={{
            width: 28, height: 28, borderRadius: 14,
            backgroundColor: !selectedColor ? colors.navy : colors.gray200,
            alignItems: 'center', justifyContent: 'center',
          }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: !selectedColor ? colors.cream : colors.slate }}>
            All
          </Text>
        </Pressable>

        {PIECE_COLORS.map(color => {
          const active = selectedColor === color
          return (
            <Pressable
              key={color}
              onPress={() => onColorChange(active ? null : color)}
              accessibilityLabel={color}
              accessibilityState={{ selected: active }}
              style={{
                width: active ? 32 : 28, height: active ? 32 : 28,
                borderRadius: active ? 16 : 14,
                backgroundColor: COLOR_HEX[color] ?? '#888',
                borderWidth: active ? 2.5 : 1,
                borderColor: active ? colors.navy : 'rgba(0,0,0,0.12)',
              }}
            />
          )
        })}
      </ScrollView>

    </View>
  )
}
