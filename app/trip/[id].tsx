import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { useTrip, useRemoveTripItem } from '@/hooks/useTrip'
import { useSuitcaseStore } from '@/store/suitcaseStore'
import { TripItemRow } from '@/components/trip/TripItemRow'
import { Skeleton } from '@/components/ui/Skeleton'
import type { TripItem } from '@/types'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

const TRIP_TYPE_LABELS: Record<string, string> = {
  event: 'Event',
  vacation: 'Vacation',
  extended_stay: 'Extended Stay',
  season: 'Season / School',
}

function tripDateLine(trip: { start_date: string | null; end_date: string | null; destination: string | null }): string {
  const parts: string[] = []
  if (trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date + 'T00:00:00Z')
    const end = new Date(trip.end_date + 'T00:00:00Z')
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
    parts.push(`${fmt.format(start)} – ${fmt.format(end)} · ${days} days`)
  } else if (trip.start_date) {
    parts.push(new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(trip.start_date + 'T00:00:00Z')))
  }
  if (trip.destination) parts.push(trip.destination)
  return parts.join(' · ')
}

export default function TripDetailScreen() {
  const insets = useSafeAreaInsets()
  const { id: rawId } = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(rawId) ? rawId[0] : rawId
  const { data: trip, isLoading, isError } = useTrip(id)
  const { mutateAsync: removeItem } = useRemoveTripItem()
  const addToSuitcase = useSuitcaseStore(s => s.addItem)

  function handleRemove(item: TripItem) {
    Alert.alert('Remove from plan?', `Remove ${item.piece?.name ?? 'this piece'} from your packing list?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => removeItem({ id: item.id, trip_id: item.trip_id }),
      },
    ])
  }

  function handleSendToSuitcase() {
    const items = trip?.items ?? []
    const sizedItems = items.filter(i => i.size && i.piece)
    const unsizedCount = items.filter(i => i.piece && !i.size).length

    if (items.length === 0) {
      Alert.alert('Empty packing list', 'Add some pieces to your plan first.')
      return
    }

    if (sizedItems.length === 0) {
      Alert.alert('No sized pieces', 'Select sizes for your pieces before sending to your suitcase.')
      return
    }

    const message = unsizedCount > 0
      ? `${sizedItems.length} piece${sizedItems.length !== 1 ? 's' : ''} will be added to your suitcase. ${unsizedCount} piece${unsizedCount !== 1 ? 's' : ''} without a size will be skipped.`
      : `Add ${sizedItems.length} piece${sizedItems.length !== 1 ? 's' : ''} to your suitcase?`

    Alert.alert('Send to Suitcase', message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Add to Suitcase',
        onPress: () => {
          sizedItems.forEach(item => {
            if (item.piece && item.size) {
              addToSuitcase(item.piece, item.size)
            }
          })
          router.push('/(tabs)/suitcase' as any)
        },
      },
    ])
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream }}>
        <View style={{ paddingTop: insets.top + 16, paddingHorizontal: layout.screenPadding, paddingBottom: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={colors.navy} />
          </Pressable>
        </View>
        <View style={{ paddingHorizontal: layout.screenPadding, gap: 12 }}>
          <Skeleton height={32} borderRadius={10} />
          <Skeleton height={18} borderRadius={8} />
          <Skeleton height={100} borderRadius={14} />
          <Skeleton height={100} borderRadius={14} />
        </View>
      </View>
    )
  }

  if (isError || !trip) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center', padding: layout.screenPadding }}>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center', marginBottom: 16 }}>
          Couldn't load this plan.
        </Text>
        <Pressable onPress={() => router.back()} style={{ padding: 8 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy }}>← Go back</Text>
        </Pressable>
      </View>
    )
  }

  const items = trip.items ?? []
  const unsizedCount = items.filter(i => !i.size).length
  const dateLine = tripDateLine(trip)

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <View style={{ paddingHorizontal: layout.screenPadding, marginBottom: 16 }}>
          <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="arrow-back" size={22} color={colors.navy} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: layout.screenPadding, gap: 20 }}>
          {/* Trip header */}
          <View style={{ gap: 4 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, letterSpacing: 1.4, textTransform: 'uppercase' }}>
              {TRIP_TYPE_LABELS[trip.type] ?? trip.type}
            </Text>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 26, color: colors.navy, letterSpacing: -0.6 }}>
              {trip.name}
            </Text>
            {dateLine.length > 0 && (
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate }}>
                {dateLine}
              </Text>
            )}
            {(trip.occasions?.length ?? 0) > 0 && (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                {trip.occasions!.map(occ => (
                  <View key={occ} style={{
                    backgroundColor: colors.navy + '0D',
                    borderRadius: 12,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}>
                    <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.navy }}>{occ}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Packing list */}
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, letterSpacing: 1.4, textTransform: 'uppercase' }}>
                Packing List{items.length > 0 ? ` (${items.length})` : ''}
              </Text>
              {unsizedCount > 0 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="warning-outline" size={13} color={colors.warning} />
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.warning }}>
                    {unsizedCount} unsized
                  </Text>
                </View>
              )}
            </View>

            {items.length === 0 ? (
              <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 24, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: colors.sand + '80' }}>
                <Ionicons name="shirt-outline" size={28} color={colors.gray400} />
                <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, textAlign: 'center', lineHeight: 21 }}>
                  Your packing list is empty. Browse pieces and add them to this plan.
                </Text>
              </View>
            ) : (
              items.map((item, i) => (
                <Animated.View key={item.id} entering={FadeInDown.delay(i * 40).springify()}>
                  <TripItemRow item={item} onRemove={handleRemove} />
                </Animated.View>
              ))
            )}

            {/* Browse CTA */}
            <Pressable
              onPress={() => router.push('/(tabs)/pieces' as any)}
              accessibilityRole="button"
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                borderWidth: 1.5,
                borderColor: colors.navy + '50',
                borderRadius: 14,
                paddingVertical: 14,
                opacity: pressed ? 0.85 : 1,
                borderStyle: 'dashed',
              })}
            >
              <Ionicons name="add" size={16} color={colors.navy} />
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
                Browse pieces for this plan
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Send to suitcase footer */}
      {items.length > 0 && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: layout.screenPadding,
          paddingBottom: insets.bottom + 20,
          paddingTop: 14,
          backgroundColor: colors.cream,
          borderTopWidth: 1,
          borderTopColor: colors.sand + '50',
        }}>
          <Pressable
            onPress={handleSendToSuitcase}
            accessibilityRole="button"
            style={({ pressed }) => ({
              backgroundColor: colors.navy,
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 8,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Ionicons name="briefcase-outline" size={16} color={colors.cream} />
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>
              Send to Suitcase →
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
