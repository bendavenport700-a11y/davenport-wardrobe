import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, Pressable, FlatList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { usePieces } from '@/hooks/usePieces'
import { PieceCard } from '@/components/piece/PieceCard'
import { PieceCardSkeleton } from '@/components/ui/Skeleton'
import { FilterBar, categoryGroupToList } from '@/components/ui/FilterBar'
import { ErrorState } from '@/components/ui/ErrorState'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'
import type { PieceColor } from '@/types'

type SortOption = 'newest' | 'price_asc' | 'price_desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest',    label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low' },
  { value: 'price_desc',label: 'Price: High' },
]

export default function BrowseScreen() {
  const insets = useSafeAreaInsets()
  const [search, setSearch]               = useState('')
  const [debouncedSearch, setDebounced]   = useState('')
  const [categoryGroup, setCategoryGroup] = useState<string | null>(null)
  const [color, setColor]                 = useState<PieceColor | null>(null)
  const [size, setSize]                   = useState<string | null>(null)
  const [sortBy, setSortBy]               = useState<SortOption>('newest')
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current) }, [])

  const handleSearch = (text: string) => {
    setSearch(text)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebounced(text), 300)
  }

  const clearFilters = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setCategoryGroup(null); setColor(null); setSize(null)
    setSearch(''); setDebounced('')
  }

  const categoryList = categoryGroupToList(categoryGroup)
  const hasActiveFilters = !!(categoryGroup || color || size || debouncedSearch)
  const currentSort = SORT_OPTIONS.find(o => o.value === sortBy)!

  const cycleSortBy = () => {
    const idx = SORT_OPTIONS.findIndex(o => o.value === sortBy)
    setSortBy(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].value)
  }

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = usePieces({
    category: categoryList ?? undefined,
    color, size, search: debouncedSearch, sortBy, availableOnly: true,
  })
  const pieces = data?.pages.flat() ?? []

  // The filter section scrolls with the list — disappears when browsing, reappears at top
  const ListHeader = (
    <View style={{ paddingHorizontal: layout.screenPadding, paddingBottom: 10, gap: 10 }}>
      {/* Search bar */}
      <TextInput
        value={search}
        onChangeText={handleSearch}
        placeholder="Search brand, name, or style…"
        placeholderTextColor={colors.gray400}
        returnKeyType="search"
        clearButtonMode="while-editing"
        style={{
          backgroundColor: colors.white, borderRadius: 12,
          paddingHorizontal: 16, paddingVertical: 12,
          fontFamily: 'Inter-Regular', fontSize: 15, color: colors.navy,
          borderWidth: 1, borderColor: colors.sand,
        }}
      />

      {/* Filter bar: categories + sizes + color dots */}
      <FilterBar
        selectedGroup={categoryGroup}
        selectedColor={color}
        selectedSize={size}
        onGroupChange={setCategoryGroup}
        onColorChange={setColor}
        onSizeChange={setSize}
      />

      {/* Sort row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' }}>
        <Pressable
          onPress={cycleSortBy}
          accessibilityLabel={`Sort by ${currentSort.label}`}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 12, paddingVertical: 6,
            backgroundColor: colors.white, borderRadius: 20,
            borderWidth: 1, borderColor: colors.sand,
          }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy }}>
            {currentSort.label}
          </Text>
          <Ionicons name="swap-vertical-outline" size={13} color={colors.slate} />
        </Pressable>
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      {/* Sticky top bar — just the title and clear button */}
      <View style={{
        paddingTop: insets.top + 10, paddingHorizontal: layout.screenPadding,
        paddingBottom: 8, backgroundColor: colors.cream,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 26, color: colors.navy }}>
            Browse
          </Text>
          {hasActiveFilters && (
            <Pressable onPress={clearFilters} accessibilityRole="button" accessibilityLabel="Clear all filters"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="close-circle" size={14} color={colors.slate} />
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.slate }}>Clear</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Main content */}
      {isError ? (
        <ErrorState message="Couldn't load pieces. Check your connection." onRetry={() => refetch()} />
      ) : isLoading ? (
        <>
          {ListHeader}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: layout.screenPadding }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View key={i} style={{ width: '50%' }}><PieceCardSkeleton /></View>
            ))}
          </View>
        </>
      ) : pieces.length === 0 ? (
        <>
          {ListHeader}
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
        </>
      ) : (
        <FlatList
          data={pieces}
          keyExtractor={p => p.id}
          numColumns={2}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={{ paddingHorizontal: layout.screenPadding, gap: layout.cardGap, paddingBottom: 40 }}
          columnWrapperStyle={{ gap: layout.cardGap }}
          renderItem={({ item, index }) => <PieceCard piece={item} index={index % 6} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
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
