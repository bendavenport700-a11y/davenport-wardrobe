import { ScrollView, Pressable, Text, View } from 'react-native'
import { PIECE_COLORS, COLOR_HEX } from '@/constants/inventory'
import { colors } from '@/constants/colors'
import type { PieceCategory, PieceColor } from '@/types'

// Category groups for browsing — coarse-grained so the filter bar stays scannable
// as inventory grows. Each group maps to the raw DB categories it covers.
export const CATEGORY_GROUPS = [
  { label: 'All',        categories: null },
  { label: 'Tops',       categories: ['shirt', 'polo', 't-shirt', 'henley', 'sweater', 'hoodie', 'sweatshirt', 'cardigan', 'vest'] as PieceCategory[] },
  { label: 'Bottoms',    categories: ['pants', 'chinos', 'trousers', 'denim', 'joggers'] as PieceCategory[] },
  { label: 'Outerwear',  categories: ['outerwear', 'jacket', 'blazer', 'coat', 'bomber', 'fleece'] as PieceCategory[] },
  { label: 'Shorts',     categories: ['shorts'] as PieceCategory[] },
  { label: 'Shoes',      categories: ['shoes'] as PieceCategory[] },
  { label: 'Accessories',categories: ['accessories'] as PieceCategory[] },
]

// Map a group label back to category list for query filtering
export function categoryGroupToList(group: string | null): PieceCategory[] | null {
  if (!group) return null
  const found = CATEGORY_GROUPS.find(g => g.label === group)
  return found?.categories ?? null
}

// Context-aware sizes based on selected category group
function sizesForGroup(group: string | null | undefined): string[] {
  switch (group) {
    case 'Tops':
    case 'Outerwear':     return ['XS', 'S', 'M', 'L', 'XL', 'XXL']
    case 'Bottoms':       return ['28', '29', '30', '31', '32', '33', '34', '36', '38', '40', '42']
    case 'Shorts':        return ['28', '29', '30', '31', '32', '33', '34', '36', '38']
    case 'Shoes':         return ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '11.5', '12']
    case 'Accessories':   return ['One Size']
    default:              return ['XS', 'S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36']
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
  selectedGroup,
  selectedColor,
  selectedSize,
  onGroupChange,
  onColorChange,
  onSizeChange,
}: FilterBarProps) {
  const availableSizes = sizesForGroup(selectedGroup)
  return (
    <View style={{ gap: 6 }}>
      {/* Category group pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {CATEGORY_GROUPS.map(({ label }) => {
          const isSelected = label === 'All' ? !selectedGroup : selectedGroup === label
          return (
            <Pressable
              key={label}
              onPress={() => {
                const newGroup = label === 'All' ? null : label
                onGroupChange(newGroup)
                // Reset size when category changes — old size may not exist in new category
                if (onSizeChange) onSizeChange(null)
              }}
              accessibilityState={{ selected: isSelected }}
              style={{
                paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
                backgroundColor: isSelected ? colors.navy : colors.white,
                borderWidth: 1, borderColor: isSelected ? colors.navy : colors.sand,
              }}>
              <Text style={{
                fontFamily: 'Inter-Medium', fontSize: 13,
                color: isSelected ? colors.cream : colors.slate,
              }}>{label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Size pills — only shown when a handler is provided and sizes exist */}
      {onSizeChange && availableSizes && availableSizes.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          <Pressable
            onPress={() => onSizeChange(null)}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
              backgroundColor: !selectedSize ? colors.navy : colors.white,
              borderWidth: 1, borderColor: !selectedSize ? colors.navy : colors.sand,
            }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: !selectedSize ? colors.cream : colors.slate }}>
              All Sizes
            </Text>
          </Pressable>
          {availableSizes.map(size => (
            <Pressable
              key={size}
              onPress={() => onSizeChange(selectedSize === size ? null : size)}
              accessibilityState={{ selected: selectedSize === size }}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
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

      {/* Color dots */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        <Pressable
          onPress={() => onColorChange(null)}
          style={{
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
            backgroundColor: !selectedColor ? colors.navy : colors.white,
            borderWidth: 1, borderColor: !selectedColor ? colors.navy : colors.sand,
          }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: !selectedColor ? colors.cream : colors.slate }}>
            All Colors
          </Text>
        </Pressable>
        {PIECE_COLORS.map(color => (
          <Pressable
            key={color}
            onPress={() => onColorChange(selectedColor === color ? null : color)}
            accessibilityLabel={color}
            accessibilityState={{ selected: selectedColor === color }}
            style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
              borderWidth: 1.5,
              borderColor: selectedColor === color ? colors.navy : colors.sand,
              backgroundColor: selectedColor === color ? colors.navy + '15' : colors.white,
            }}>
            <View style={{
              width: 12, height: 12, borderRadius: 6,
              backgroundColor: COLOR_HEX[color] ?? '#888',
              borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.2)',
            }} />
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.navy }}>{color}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  )
}
