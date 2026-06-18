import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, Easing,
} from 'react-native-reanimated'
import { useEffect, useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import { CATEGORY_GROUPS, sizesForGroup } from '@/components/ui/FilterBar'
import type { WearFilter, SortOption } from '@/hooks/usePieces'

interface FilterSheetProps {
  visible: boolean
  onClose: () => void
  categoryGroup: string | null
  size: string | null
  wearFilter: WearFilter
  sortBy: SortOption
  brand: string | null
  season: string | null
  onCategoryChange: (cat: string | null) => void
  onSizeChange: (size: string | null) => void
  onWearFilterChange: (wear: WearFilter) => void
  onSortChange: (sort: SortOption) => void
  onBrandChange: (brand: string | null) => void
  onSeasonChange: (season: string | null) => void
}

const WEAR_OPTIONS: { value: WearFilter; label: string; sub?: string }[] = [
  { value: 'any',  label: 'Any condition' },
  { value: 'new',  label: 'Brand New',    sub: '0 wears' },
  { value: '1-5',  label: 'Lightly worn', sub: '1–5 wears' },
  { value: '6-10', label: 'Well worn',    sub: '6–10 wears' },
  { value: '10+',  label: 'Veteran',      sub: '10+ wears' },
]

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'price_asc',  label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
]

const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter']

const BRANDS = [
  'Lululemon', 'Tracksmith', 'Rails', 'Billy Reid',
  'Vuori', 'Faherty', 'Patagonia', "Arc'teryx",
  'Todd Snyder', 'Reigning Champ', 'Nike', 'Polo Ralph Lauren',
]

function Chip({
  label, sub, active, onPress,
}: { label: string; sub?: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20,
        backgroundColor: active ? colors.navy : colors.white,
        borderWidth: 1, borderColor: active ? colors.navy : colors.sand,
        flexDirection: 'row', alignItems: 'center', gap: 6,
      }}
    >
      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: active ? colors.cream : colors.slate }}>
        {label}
      </Text>
      {sub && (
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: active ? colors.sand : colors.gray400 }}>
          · {sub}
        </Text>
      )}
    </Pressable>
  )
}

function Section({ title, children, badge }: {
  title: string; children: React.ReactNode; badge?: string
}) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{
          fontFamily: 'Inter-Medium', fontSize: 10,
          color: colors.slate, letterSpacing: 1.5, textTransform: 'uppercase',
        }}>
          {title}
        </Text>
        {badge && (
          <View style={{
            backgroundColor: colors.navy, borderRadius: 10,
            paddingHorizontal: 7, paddingVertical: 2,
          }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.cream }}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      {children}
    </View>
  )
}

export function FilterSheet({
  visible, onClose,
  categoryGroup, size, wearFilter, sortBy, brand, season,
  onCategoryChange, onSizeChange, onWearFilterChange, onSortChange,
  onBrandChange, onSeasonChange,
}: FilterSheetProps) {
  const insets    = useSafeAreaInsets()
  const [mounted, setMounted] = useState(false)

  const translateY     = useSharedValue(700)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      translateY.value     = withSpring(0, { damping: 26, stiffness: 300 })
      backdropOpacity.value = withTiming(1, { duration: 200 })
    } else if (mounted) {
      translateY.value     = withTiming(700, { duration: 240, easing: Easing.in(Easing.quad) }, finished => {
        if (finished) runOnJS(setMounted)(false)
      })
      backdropOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [visible])

  const sheetStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }))

  const availableSizes = sizesForGroup(categoryGroup)

  const clearAll = () => {
    onCategoryChange(null); onSizeChange(null)
    onWearFilterChange('any'); onSortChange('newest')
    onBrandChange(null); onSeasonChange(null)
  }

  if (!mounted) return null

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} statusBarTranslucent animationType="none">
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink + '99' }, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close filters" />
        </Animated.View>

        <Animated.View style={[{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: colors.cream,
          borderTopLeftRadius: 26, borderTopRightRadius: 26,
          overflow: 'hidden', maxHeight: '92%',
        }, sheetStyle]}>

          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
            <View style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: colors.sand + '70' }} />
          </View>

          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 22, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: colors.sand + '45',
          }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, color: colors.navy, letterSpacing: -0.3 }}>
              Filters
            </Text>
            <Pressable onPress={clearAll} hitSlop={12}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.slate }}>Clear all</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 22, gap: 28, paddingBottom: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Category */}
            <Section title="Category">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {CATEGORY_GROUPS.map(({ label }) => {
                  const active = label === 'All' ? !categoryGroup : categoryGroup === label
                  return (
                    <Chip key={label} label={label} active={active} onPress={() => {
                      onCategoryChange(label === 'All' ? null : label)
                      onSizeChange(null)
                    }} />
                  )
                })}
              </View>
            </Section>

            {/* Size */}
            {categoryGroup && availableSizes.length > 0 && (
              <Section title="Size">
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <Chip label="All sizes" active={!size} onPress={() => onSizeChange(null)} />
                  {availableSizes.map(s => (
                    <Chip key={s} label={s} active={size === s} onPress={() => onSizeChange(size === s ? null : s)} />
                  ))}
                </View>
              </Section>
            )}

            {/* Brand */}
            <Section title="Brand">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {BRANDS.map(b => (
                  <Chip key={b} label={b} active={brand === b} onPress={() => onBrandChange(brand === b ? null : b)} />
                ))}
              </View>
            </Section>

            {/* Season */}
            <Section title="Season">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SEASONS.map(s => (
                  <Chip key={s} label={s} active={season === s} onPress={() => onSeasonChange(season === s ? null : s)} />
                ))}
              </View>
            </Section>

            {/* Condition */}
            <Section title="Condition">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {WEAR_OPTIONS.map(opt => (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    sub={opt.sub}
                    active={wearFilter === opt.value}
                    onPress={() => onWearFilterChange(opt.value)}
                  />
                ))}
              </View>
            </Section>

            {/* Sort */}
            <Section title="Sort By">
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {SORT_OPTIONS.map(opt => (
                  <Chip key={opt.value} label={opt.label} active={sortBy === opt.value} onPress={() => onSortChange(opt.value)} />
                ))}
              </View>
            </Section>
          </ScrollView>

          <View style={{
            paddingHorizontal: 22, paddingTop: 12,
            paddingBottom: insets.bottom + 16,
            borderTopWidth: 1, borderTopColor: colors.sand + '40',
          }}>
            <Pressable
              onPress={onClose}
              style={{ backgroundColor: colors.navy, borderRadius: 14, paddingVertical: 16, alignItems: 'center' }}
            >
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.cream, letterSpacing: -0.2 }}>
                Show Results
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}
