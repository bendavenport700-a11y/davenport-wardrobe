import { useState, useRef, useEffect } from 'react'
import { View, Text, TextInput, Pressable, FlatList, ScrollView, Linking } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { usePieces } from '@/hooks/usePieces'
import type { WearFilter, SortOption } from '@/hooks/usePieces'
import { useTabBarStore } from '@/store/tabBarStore'
import { useWardrobes } from '@/hooks/useWardrobes'
import { PieceCard } from '@/components/piece/PieceCard'
import { PieceCardSkeleton } from '@/components/ui/Skeleton'
import { FilterBar, categoryGroupToList } from '@/components/ui/FilterBar'
import { FilterSheet } from '@/components/ui/FilterSheet'
import { GenderToggle } from '@/components/ui/GenderToggle'
import { ErrorState } from '@/components/ui/ErrorState'
import { useWomensEnabled } from '@/hooks/useAppSettings'
import { colors } from '@/constants/colors'
import { layout, DEFAULT_BLURHASH } from '@/constants/layout'
import type { Wardrobe } from '@/types'

// ── Wardrobe card ──────────────────────────────────────────────────────────────

function BrowseWardrobeCard({ wardrobe }: { wardrobe: Wardrobe }) {
  const { data: images = [] } = useQuery<string[]>({
    queryKey: ['wardrobe-previews', wardrobe.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('pieces')
        .select('images')
        .eq('wardrobe_id', wardrobe.id)
        .eq('is_available', true)
        .eq('is_draft', false)
        .limit(4)
      const imgs: string[] = []
      for (const p of data ?? []) {
        if (p.images?.[0]) imgs.push(p.images[0])
      }
      return imgs
    },
    staleTime: 5 * 60 * 1000,
  })

  const hero = images[0] ?? wardrobe.cover_image_url ?? null

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/wardrobe/[id]', params: { id: wardrobe.id } } as any)}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${wardrobe.name} wardrobe`}
      style={{
        backgroundColor: colors.white, borderRadius: 18,
        overflow: 'hidden', borderWidth: 1, borderColor: colors.sand + 'AA',
        marginBottom: 16,
        shadowColor: colors.navy,
        shadowOpacity: 0.07, shadowRadius: 12,
        shadowOffset: { width: 0, height: 3 }, elevation: 2,
      }}>
      <View style={{ height: 200, backgroundColor: colors.navy }}>
        {hero ? (
          <Image
            source={hero} style={{ width: '100%', height: '100%' }}
            contentFit="cover" placeholder={DEFAULT_BLURHASH} transition={500}
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 64, color: colors.cream + '30' }}>D</Text>
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(10,16,30,0.40)' }} />
        {images.length > 0 && (
          <View style={{
            position: 'absolute', top: 12, right: 12,
            backgroundColor: 'rgba(8,14,26,0.60)', borderRadius: 20,
            paddingHorizontal: 10, paddingVertical: 4,
          }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.cream, letterSpacing: 0.2 }}>
              {images.length < 4 ? images.length : '4+'} piece{images.length !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
      <View style={{ padding: 16, gap: 10 }}>
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 17, color: colors.navy, letterSpacing: -0.3 }}>
          {wardrobe.name}
        </Text>
        {(wardrobe.tags ?? []).length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {wardrobe.tags.map(tag => (
              <View key={tag} style={{
                backgroundColor: colors.cream, borderRadius: 20,
                paddingHorizontal: 10, paddingVertical: 4,
                borderWidth: 1, borderColor: colors.sand,
              }}>
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate, letterSpacing: 0.2 }}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
        {wardrobe.description && (
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }} numberOfLines={2}>
            {wardrobe.description}
          </Text>
        )}
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.navy, letterSpacing: 0.3, marginTop: 2 }}>
          Browse wardrobe →
        </Text>
      </View>
    </Pressable>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────────

type ViewMode = 'pieces' | 'wardrobes'

// ── Main screen ───────────────────────────────────────────────────────────────

export default function BrowseScreen() {
  const insets         = useSafeAreaInsets()
  const setScrolledDown = useTabBarStore(s => s.setScrolledDown)
  const lastScrollY    = useRef(0)

  const [viewMode,       setViewMode]       = useState<ViewMode>('pieces')
  const [search,         setSearch]         = useState('')
  const [debouncedSearch, setDebounced]     = useState('')
  const [occasionFilter, setOccasionFilter] = useState<string | null>(null)
  const [categoryGroup,  setCategoryGroup]  = useState<string | null>(null)
  const [size,           setSize]           = useState<string | null>(null)
  const [brand,          setBrand]          = useState<string | null>(null)
  const [season,         setSeason]         = useState<string | null>(null)
  const [sortBy,         setSortBy]         = useState<SortOption>('newest')
  const [wearFilter,     setWearFilter]     = useState<WearFilter>('any')
  const [showFilters,    setShowFilters]    = useState(false)
  const [gender,         setGender]         = useState<'men' | 'women' | 'all'>('men')
  const womensEnabled = useWomensEnabled()

  const { data: wardrobes = [], isLoading: wardrobesLoading } = useWardrobes()
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => { if (searchTimer.current) clearTimeout(searchTimer.current) }, [])

  const handleSearch = (text: string) => {
    setSearch(text)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => setDebounced(text), 300)
  }

  const clearFilters = () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    setOccasionFilter(null)
    setCategoryGroup(null); setSize(null)
    setBrand(null); setSeason(null)
    setSearch(''); setDebounced('')
    setWearFilter('any'); setSortBy('newest')
  }

  const categoryList    = categoryGroupToList(categoryGroup)
  const filterTags      = [occasionFilter, season].filter(Boolean) as string[]

  const hasActiveFilters = !!(occasionFilter || categoryGroup || size || debouncedSearch || wearFilter !== 'any' || sortBy !== 'newest' || brand || season)

  const advancedFilterCount = [
    categoryGroup !== null,
    size !== null,
    wearFilter !== 'any',
    sortBy !== 'newest',
    brand !== null,
    season !== null,
  ].filter(Boolean).length

  type FilterTag = { key: string; label: string; clear: () => void }
  const activeFilterTags: FilterTag[] = [
    ...(wearFilter !== 'any'  ? [{ key: 'wear',     label: wearFilter === 'new' ? 'Pristine' : wearFilter === '1-5' ? 'Excellent' : wearFilter === '6-10' ? 'Well-Worn' : 'Veteran', clear: () => setWearFilter('any') }] : []),
    ...(brand                 ? [{ key: 'brand',    label: brand,                      clear: () => setBrand(null) }] : []),
    ...(season                ? [{ key: 'season',   label: season,                     clear: () => setSeason(null) }] : []),
    ...(categoryGroup         ? [{ key: 'category', label: categoryGroup,               clear: () => { setCategoryGroup(null); setSize(null) } }] : []),
    ...(size                  ? [{ key: 'size',     label: `Size ${size}`,             clear: () => setSize(null) }] : []),
    ...(sortBy !== 'newest'   ? [{ key: 'sort',     label: sortBy === 'price_asc' ? 'Price ↑' : 'Price ↓', clear: () => setSortBy('newest') }] : []),
  ]

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = usePieces({
    category: categoryList ?? undefined,
    size, search: debouncedSearch, sortBy, availableOnly: true, wearFilter,
    brand: brand ?? undefined,
    tags: filterTags.length > 0 ? filterTags : undefined,
    gender: womensEnabled ? gender : undefined,
  })
  const pieces = data?.pages.flat() ?? []

  // ── List header (scrolls with content) ──────────────────────────────────────

  const ListHeader = (
    <View style={{ paddingBottom: 12, gap: 10 }}>

      {/* Search bar */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: colors.white, borderRadius: 14,
        paddingHorizontal: 14, borderWidth: 1, borderColor: colors.sand + 'CC',
        gap: 8,
      }}>
        <Ionicons name="search-outline" size={16} color={colors.gray400} />
        <TextInput
          value={search}
          onChangeText={handleSearch}
          placeholder="Search brand, name, or style…"
          placeholderTextColor={colors.gray400}
          returnKeyType="search"
          clearButtonMode="while-editing"
          style={{
            flex: 1, paddingVertical: 13,
            fontFamily: 'Inter-Regular', fontSize: 15, color: colors.navy,
          }}
        />
      </View>

      {/* Filters button + active tags */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Pressable
          onPress={() => setShowFilters(true)}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
            backgroundColor: advancedFilterCount > 0 ? colors.navy : colors.white,
            borderWidth: 1, borderColor: advancedFilterCount > 0 ? colors.navy : colors.sand + 'CC',
            flexShrink: 0,
          }}
        >
          <Ionicons name="options-outline" size={13} color={advancedFilterCount > 0 ? colors.cream : colors.slate} />
          <Text style={{
            fontFamily: 'Inter-Medium', fontSize: 12,
            color: advancedFilterCount > 0 ? colors.cream : colors.slate,
          }}>
            {advancedFilterCount > 0 ? `Filters · ${advancedFilterCount}` : 'Filters'}
          </Text>
        </Pressable>

        {activeFilterTags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {activeFilterTags.map(tag => (
              <Pressable
                key={tag.key}
                onPress={tag.clear}
                style={{
                  flexDirection: 'row', alignItems: 'center', gap: 5,
                  paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
                  backgroundColor: colors.navy + 'EE',
                }}
              >
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.cream }}>
                  {tag.label}
                </Text>
                <Ionicons name="close" size={11} color={colors.cream + 'BB'} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>

      {/* Sticky header */}
      <View style={{
        paddingTop: insets.top + 10, paddingHorizontal: layout.screenPadding,
        paddingBottom: 12, backgroundColor: colors.cream,
        borderBottomWidth: 1, borderBottomColor: colors.sand + '55',
      }}>

        {/* Title row + segmented control */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 28, color: colors.navy, letterSpacing: -0.8 }}>
            Browse
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {hasActiveFilters && (
              <Pressable onPress={clearFilters} accessibilityRole="button" accessibilityLabel="Clear all filters">
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.slate }}>Clear all</Text>
              </Pressable>
            )}
            <View style={{
              flexDirection: 'row',
              backgroundColor: colors.sand + '55',
              borderRadius: 22, padding: 3,
              borderWidth: 1, borderColor: colors.sand + '90',
            }}>
              {(['pieces', 'wardrobes'] as ViewMode[]).map(mode => (
                <Pressable
                  key={mode}
                  onPress={() => setViewMode(mode)}
                  style={{
                    paddingHorizontal: 16, paddingVertical: 6, borderRadius: 19,
                    backgroundColor: viewMode === mode ? colors.navy : 'transparent',
                  }}>
                  <Text style={{
                    fontFamily: 'Inter-Medium', fontSize: 12,
                    color: viewMode === mode ? colors.cream : colors.slate,
                    textTransform: 'capitalize',
                  }}>{mode}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {viewMode === 'pieces' && womensEnabled && (
          <View style={{ marginBottom: 10 }}>
            <GenderToggle value={gender} onChange={setGender} />
          </View>
        )}

        {/* Occasion pills — pieces mode only */}
        {viewMode === 'pieces' && (
          <FilterBar
            selectedOccasion={occasionFilter}
            onOccasionChange={setOccasionFilter}
          />
        )}
      </View>

      {/* Main content */}
      {viewMode === 'wardrobes' ? (
        wardrobesLoading ? (
          <ScrollView contentContainerStyle={{ padding: layout.screenPadding, paddingBottom: insets.bottom + 100 }}>
            {[0, 1, 2].map(i => (
              <View key={i} style={{ height: 260, backgroundColor: colors.sand + '60', borderRadius: 16, marginBottom: 14 }} />
            ))}
          </ScrollView>
        ) : wardrobes.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPadding }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: colors.navy, textAlign: 'center', letterSpacing: -0.3 }}>
              No wardrobes yet.
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ padding: layout.screenPadding, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>
            {wardrobes.map(w => <BrowseWardrobeCard key={w.id} wardrobe={w} />)}
          </ScrollView>
        )
      ) : isError ? (
        <ErrorState message="Couldn't load pieces. Check your connection." onRetry={() => refetch()} />
      ) : isLoading ? (
        <>
          <View style={{ paddingHorizontal: layout.screenPadding }}>{ListHeader}</View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: layout.screenPadding }}>
            {[0, 1, 2, 3, 4, 5].map(i => (
              <View key={i} style={{ width: '50%' }}><PieceCardSkeleton /></View>
            ))}
          </View>
        </>
      ) : pieces.length === 0 ? (
        <>
          <View style={{ paddingHorizontal: layout.screenPadding }}>{ListHeader}</View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: layout.screenPadding, gap: 16 }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 20, color: colors.navy, textAlign: 'center', letterSpacing: -0.3 }}>
              {hasActiveFilters ? 'No pieces match your filters.' : "We're still building inventory."}
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, textAlign: 'center', lineHeight: 21 }}>
              {hasActiveFilters
                ? "Try adjusting your filters, or tell us what you'd like to see."
                : "New pieces added every week. Tell us what brands or styles you're looking for."}
            </Text>
            {hasActiveFilters ? (
              <View style={{ gap: 10, width: '100%' }}>
                <Pressable onPress={clearFilters} style={{
                  backgroundColor: colors.navy, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center',
                }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>Clear Filters</Text>
                </Pressable>
                <Pressable
                  onPress={() => Linking.openURL('mailto:support@davenport.rentals?subject=Inventory Request')}
                  style={{ borderRadius: 12, paddingVertical: 12, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.slate }}>Request a piece instead →</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => Linking.openURL('mailto:support@davenport.rentals?subject=Inventory Request')}
                style={{ backgroundColor: colors.navy, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12, alignItems: 'center' }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>Tell us what you want →</Text>
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
          contentContainerStyle={{ paddingHorizontal: layout.screenPadding, gap: layout.cardGap, paddingBottom: insets.bottom + 100 }}
          columnWrapperStyle={{ gap: layout.cardGap }}
          renderItem={({ item, index }) => <PieceCard piece={item} index={index % 6} />}
          onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
          onEndReachedThreshold={0.3}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={e => {
            const y = e.nativeEvent.contentOffset.y
            setScrolledDown(y > lastScrollY.current && y > 60)
            lastScrollY.current = y
          }}
          ListFooterComponent={isFetchingNextPage ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Inter-Regular', color: colors.slate }}>Loading more…</Text>
            </View>
          ) : null}
        />
      )}

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        categoryGroup={categoryGroup}
        size={size}
        wearFilter={wearFilter}
        sortBy={sortBy}
        brand={brand}
        season={season}
        onCategoryChange={setCategoryGroup}
        onSizeChange={setSize}
        onWearFilterChange={setWearFilter}
        onSortChange={setSortBy}
        onBrandChange={setBrand}
        onSeasonChange={setSeason}
      />
    </View>
  )
}
