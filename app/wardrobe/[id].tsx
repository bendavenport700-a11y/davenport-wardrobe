import { useState } from 'react'
import { View, Text, ScrollView, Pressable, Modal, Alert } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { Image } from 'expo-image'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useWardrobes } from '@/hooks/useWardrobes'
import { usePieces } from '@/hooks/usePieces'
import { useAuthStore } from '@/store/authStore'
import { useSuitcaseStore } from '@/store/suitcaseStore'
import { useIsWardrobeSaved, useToggleSavedWardrobe } from '@/hooks/useSavedWardrobes'
import { PieceCard } from '@/components/piece/PieceCard'
import { PieceCardSkeleton, Skeleton } from '@/components/ui/Skeleton'
import { FilterBar, categoryGroupToList } from '@/components/ui/FilterBar'
import { ErrorState } from '@/components/ui/ErrorState'
import { formatCentsPerMonth } from '@/utils/format'
import { SIZES_BY_CATEGORY } from '@/constants/inventory'
import { colors } from '@/constants/colors'
import { layout, DEFAULT_BLURHASH } from '@/constants/layout'
import type { Piece, PieceColor } from '@/types'

// ── Add All modal ──────────────────────────────────────────────────────────

function AddAllModal({
  pieces,
  onClose,
}: {
  pieces: Piece[]
  onClose: () => void
}) {
  const { addItem, hasItem } = useSuitcaseStore()
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({})

  const setSize = (pieceId: string, size: string) =>
    setSelectedSizes(prev =>
      prev[pieceId] === size ? { ...prev, [pieceId]: '' } : { ...prev, [pieceId]: size }
    )

  const readyCount = Object.values(selectedSizes).filter(Boolean).length

  const handleAdd = () => {
    let added = 0
    for (const piece of pieces) {
      const size = selectedSizes[piece.id]
      if (size && !hasItem(piece.id, size)) {
        addItem(piece, size)
        added++
      }
    }
    onClose()
    if (added > 0) {
      router.push('/(tabs)/suitcase' as any)
    } else {
      Alert.alert('Already in suitcase', 'The selected pieces are already in your suitcase.')
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
          borderBottomWidth: 1, borderBottomColor: colors.sand,
        }}>
          <View>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 22, color: colors.navy }}>
              Add to Suitcase
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, marginTop: 2 }}>
              Select a size for each piece you want
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close">
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate }}>Done</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 120 }}>
          {pieces.map(piece => {
            const categorySizes = SIZES_BY_CATEGORY[piece.category ?? '']
            const availableSizes = categorySizes
              ? categorySizes.filter((s: string) => piece.sizes_available.includes(s))
              : piece.sizes_available
            const selected = selectedSizes[piece.id]
            const alreadyAdded = selected && hasItem(piece.id, selected)

            return (
              <View key={piece.id} style={{
                backgroundColor: colors.white, borderRadius: 14, padding: 14,
                borderWidth: 1.5,
                borderColor: selected ? colors.navy : colors.sand,
              }}>
                {/* Piece row */}
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                  <Image
                    source={piece.images?.[0] ?? null}
                    placeholder={DEFAULT_BLURHASH}
                    style={{ width: 52, height: 64, borderRadius: 8 }}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
                    <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, textTransform: 'uppercase', letterSpacing: 0.7 }}>
                      {piece.brand}
                    </Text>
                    <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 14, color: colors.navy }} numberOfLines={2}>
                      {piece.name}
                    </Text>
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate }}>
                      {formatCentsPerMonth(piece.rental_fee)}
                    </Text>
                  </View>
                  {alreadyAdded && (
                    <View style={{ alignSelf: 'flex-start', backgroundColor: colors.success + '20', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.success }}>In suitcase</Text>
                    </View>
                  )}
                </View>

                {/* Size selector */}
                {availableSizes.length > 0 ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {availableSizes.map((size: string) => (
                      <Pressable
                        key={size}
                        onPress={() => setSize(piece.id, size)}
                        accessibilityState={{ selected: selected === size }}
                        style={{
                          paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8, borderWidth: 1.5,
                          backgroundColor: selected === size ? colors.navy : colors.white,
                          borderColor: selected === size ? colors.navy : colors.sand,
                        }}>
                        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: selected === size ? colors.cream : colors.navy }}>
                          {size}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate }}>
                    No sizes available
                  </Text>
                )}
              </View>
            )
          })}
        </ScrollView>

        {/* Sticky CTA */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: colors.cream, borderTopWidth: 1, borderTopColor: colors.sand,
          padding: 20,
        }}>
          <Pressable
            onPress={handleAdd}
            disabled={readyCount === 0}
            accessibilityRole="button"
            accessibilityLabel={`Add ${readyCount} pieces to suitcase`}
            style={{
              backgroundColor: readyCount > 0 ? colors.navy : colors.gray200,
              borderRadius: 14, padding: 18, alignItems: 'center',
            }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 17, color: readyCount > 0 ? colors.cream : colors.gray400 }}>
              {readyCount > 0 ? `Add ${readyCount} Piece${readyCount !== 1 ? 's' : ''} to Suitcase →` : 'Select sizes above'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

// ── Wardrobe detail screen ─────────────────────────────────────────────────

export default function WardrobeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { session } = useAuthStore()
  const insets = useSafeAreaInsets()
  const userId = session?.user.id
  const { data: isSaved = false } = useIsWardrobeSaved(userId, id)
  const { mutate: toggleSave, isPending: savePending } = useToggleSavedWardrobe()
  const [categoryGroup, setCategoryGroup] = useState<string | null>(null)
  const [color, setColor] = useState<PieceColor | null>(null)
  const [size, setSize] = useState<string | null>(null)
  const [showAddAll, setShowAddAll] = useState(false)

  const { data: wardrobes, isLoading: wLoading, isError: wError } = useWardrobes()
  const wardrobe = wardrobes?.find(w => w.id === id)

  const categoryList = categoryGroupToList(categoryGroup)
  const { data, isLoading: pLoading, isError: pError, refetch: refetchPieces } = usePieces({
    wardrobeId: id, category: categoryList ?? undefined, color, size, availableOnly: true,
  })
  const pieces = data?.pages.flat() ?? []

  if (wError) {
    return <ErrorState message="Couldn't load this wardrobe." onRetry={() => router.back()} />
  }

  return (
    <>
      <ScrollView style={{ flex: 1, backgroundColor: colors.cream }} showsVerticalScrollIndicator={false}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{
            position: 'absolute', top: insets.top + 12, left: 16, zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
          }}>
          <Text style={{ color: colors.white, fontFamily: 'Inter-Medium', fontSize: 14 }}>← Back</Text>
        </Pressable>

        {/* Save wardrobe button */}
        {session && (
          <Pressable
            onPress={() => toggleSave({ userId: userId!, wardrobeId: id, isSaved })}
            disabled={savePending}
            accessibilityLabel={isSaved ? 'Unsave wardrobe' : 'Save wardrobe'}
            accessibilityRole="button"
            style={{
              position: 'absolute', top: insets.top + 12, right: 16, zIndex: 10,
              backgroundColor: isSaved ? colors.cream : 'rgba(0,0,0,0.35)',
              borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6,
              flexDirection: 'row', alignItems: 'center', gap: 5,
              opacity: savePending ? 0.6 : 1,
            }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: isSaved ? colors.navy : colors.white }}>
              {isSaved ? 'Saved' : 'Save'}
            </Text>
          </Pressable>
        )}

        {wLoading ? (
          <Skeleton height={240} borderRadius={0} />
        ) : (
          <Image
            source={wardrobe?.cover_image_url ?? undefined}
            style={{ width: '100%', height: 240 }}
            contentFit="cover"
            placeholder={DEFAULT_BLURHASH}
          />
        )}

        <View style={{ padding: layout.screenPadding }}>
          {wLoading ? (
            <>
              <Skeleton height={28} width="60%" style={{ marginBottom: 8 }} />
              <Skeleton height={16} width="80%" />
            </>
          ) : (
            <>
              <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 26, color: colors.navy, marginBottom: 6 }}>
                {wardrobe?.name}
              </Text>
              {wardrobe?.description && (
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, lineHeight: 22, marginBottom: 12 }}>
                  {wardrobe.description}
                </Text>
              )}
              {(wardrobe?.tags?.length ?? 0) > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, marginBottom: 16 }}>
                  {wardrobe?.tags.map(tag => (
                    <View key={tag} style={{
                      backgroundColor: colors.navy + '12', borderRadius: 20,
                      paddingHorizontal: 12, paddingVertical: 5,
                    }}>
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.navy }}>{tag}</Text>
                    </View>
                  ))}
                </ScrollView>
              )}
            </>
          )}

          <FilterBar
            selectedGroup={categoryGroup}
            selectedColor={color}
            selectedSize={size}
            onGroupChange={setCategoryGroup}
            onColorChange={setColor}
            onSizeChange={setSize}
          />
        </View>

        {/* Add All CTA */}
        {!pLoading && pieces.length > 0 && (
          <Animated.View entering={FadeInDown.springify()} style={{ paddingHorizontal: layout.screenPadding, marginBottom: 16 }}>
            <Pressable
              onPress={() => {
                if (!session) { router.push('/(auth)/login' as any); return }
                setShowAddAll(true)
              }}
              accessibilityRole="button"
              accessibilityLabel="Add entire wardrobe to suitcase"
              style={{
                backgroundColor: colors.navy, borderRadius: 14, paddingVertical: 14,
                alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
              }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>
                Add Wardrobe to Suitcase
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.cream + 'AA' }}>
                ({pieces.length} piece{pieces.length !== 1 ? 's' : ''})
              </Text>
            </Pressable>
          </Animated.View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: layout.screenPadding, paddingBottom: 40 }}>
          {pError ? (
            <ErrorState message="Couldn't load pieces." onRetry={() => refetchPieces()} />
          ) : pLoading ? (
            [0, 1, 2, 3].map(i => (
              <View key={i} style={{ width: '50%' }}><PieceCardSkeleton /></View>
            ))
          ) : pieces.length === 0 ? (
            <View style={{ width: '100%', alignItems: 'center', paddingVertical: 40 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center' }}>
                Nothing available right now — check back soon.
              </Text>
            </View>
          ) : pieces.map((piece, index) => (
            <View key={piece.id} style={{ width: '50%' }}>
              <PieceCard piece={piece} index={index % 6} />
            </View>
          ))}
        </View>
      </ScrollView>

      {showAddAll && (
        <AddAllModal pieces={pieces} onClose={() => setShowAddAll(false)} />
      )}
    </>
  )
}
