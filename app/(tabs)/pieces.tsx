import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, Pressable, FlatList, ScrollView } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePieces } from '@/hooks/usePieces'
import { PieceCard } from '@/components/piece/PieceCard'
import { PieceCardSkeleton } from '@/components/ui/Skeleton'
import { FilterBar, categoryGroupToList } from '@/components/ui/FilterBar'
import { ErrorState } from '@/components/ui/ErrorState'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'
import type { PieceColor } from '@/types'

type SortOption = 'newest' | 'price_asc' | 'price_desc'
const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest', price_asc: 'Price ↑', price_desc: 'Price ↓',
}

export default function BrowseScreen() {
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryGroup, setCategoryGroup] = useState<string | null>(null)
  const [color, setColor] = useState<PieceColor | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current) }, [])

  const handleSearch = (text: string) => {
    setSearch(text)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebouncedSearch(text), 300)
  }

  const categoryList = categoryGroupToList(categoryGroup)

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = usePieces({
    category: categoryList ?? undefined,
    color,
    size,
    search: debouncedSearch,
    sortBy,
    availableOnly: true,
  })
  const pieces = data?.pages.flat() ?? []

  const hasActiveFilters = !!(categoryGroup || color || size || debouncedSearch)

  const clearFilters = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setCategoryGroup(null)
    setColor(null)
    setSize(null)
    setSearch('')
    setDebouncedSearch('')
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{ paddingTop: insets.top + 8, paddingHorizontal: layout.screenPadding, paddingBottom: 8, backgroundColor: colors.cream }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 26, color: colors.navy }}>
            Browse
          </Text>
          {hasActiveFilters && (
            <Pressable onPress={clearFilters} accessibilityRole="button" accessibilityLabel="Clear all filters">
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.slate }}>Clear all</Text>
            </Pressable>
          )}
        </View>

        {/* Search bar */}
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search by brand, name, or style…"
          placeholderTextColor={colors.gray400}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={{
            backgroundColor: colors.white, borderRadius: 12,
            paddingHorizontal: 16, paddingVertical: 12,
            fontFamily: 'Inter-Regular', fontSize: 15, color: colors.navy,
            borderWidth: 1, borderColor: colors.sand, marginBottom: 10,
          }}
        />

        {/* Filters: categories, sizes, colors */}
        <FilterBar
          selectedGroup={categoryGroup}
          selectedColor={color}
          selectedSize={size}
          onGroupChange={setCategoryGroup}
          onColorChange={setColor}
          onSizeChange={setSize}
        />

        {/* Sort pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ marginTop: 8 }} contentContainerStyle={{ gap: 8 }}>
          {(Object.keys(SORT_LABELS) as SortOption[]).map(opt => (
            <Pressable key={opt} onPress={() => setSortBy(opt)}
              accessibilityLabel={`Sort by ${SORT_LABELS[opt]}`}
              accessibilityRole="button"
              accessibilityState={{ selected: sortBy === opt }}
              style={{
                backgroundColor: sortBy === opt ? colors.navy : colors.white,
                borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
                borderWidth: 1, borderColor: sortBy === opt ? colors.navy : colors.sand,
              }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: sortBy === opt ? colors.cream : colors.navy }}>
                {SORT_LABELS[opt]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isError ? (
        <ErrorState message="Couldn't load pieces. Check your connection." onRetry={() => refetch()} />
      ) : isLoading ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', padding: layout.screenPadding }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <View key={i} style={{ width: '50%' }}><PieceCardSkeleton /></View>
          ))}
        </View>
      ) : pieces.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPadding, gap: 12 }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 20, color: colors.navy, textAlign: 'center' }}>
            {hasActiveFilters ? 'No pieces match your filters.' : 'No pieces available yet.'}
          </Text>
          {hasActiveFilters && (
            <Pressable onPress={clearFilters} style={{
              backgroundColor: colors.navy, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12,
            }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>Clear Filters</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={pieces}
          keyExtractor={p => p.id}
          numColumns={2}
          contentContainerStyle={{ padding: layout.screenPadding, gap: layout.cardGap }}
          columnWrapperStyle={{ gap: layout.cardGap }}
          renderItem={({ item, index }) => (
            <PieceCard piece={item} index={index % 6} />
          )}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          ListFooterComponent={isFetchingNextPage ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter-Regular', color: colors.slate }}>Loading more…</Text>
            </View>
          ) : null}
        />
      )}
    </View>
  )
}
