import { Modal, View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, Easing,
} from 'react-native-reanimated'
import { useEffect, useState } from 'react'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useTrips } from '@/hooks/useTrips'
import { useAddTripItem } from '@/hooks/useTrip'
import type { Piece } from '@/types'
import { colors } from '@/constants/colors'

const TRIP_LABELS: Record<string, string> = {
  event:        'Event',
  vacation:     'Vacation',
  extended_stay:'Extended Stay',
  season:       'Season / School',
}

const TRIP_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  event:        'airplane-outline',
  vacation:     'sunny-outline',
  extended_stay:'home-outline',
  season:       'school-outline',
}

interface Props {
  visible: boolean
  onClose: () => void
  userId: string
  piece: Piece
  size: string
}

export function TripPickerSheet({ visible, onClose, userId, piece, size }: Props) {
  const insets = useSafeAreaInsets()
  const { data: trips = [], isLoading } = useTrips(userId)
  const { mutateAsync: addItem } = useAddTripItem()
  const [adding, setAdding] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  const translateY = useSharedValue(700)
  const backdropOpacity = useSharedValue(0)

  useEffect(() => {
    if (visible) {
      setMounted(true)
      setDone(null)
      translateY.value = withSpring(0, { damping: 26, stiffness: 300 })
      backdropOpacity.value = withTiming(1, { duration: 200 })
    } else if (mounted) {
      translateY.value = withTiming(700, { duration: 240, easing: Easing.in(Easing.quad) }, finished => {
        if (finished) runOnJS(setMounted)(false)
      })
      backdropOpacity.value = withTiming(0, { duration: 200 })
    }
  }, [visible])

  const sheetStyle   = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }))
  const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }))

  async function handleSelect(tripId: string) {
    if (adding) return
    setAdding(tripId)
    setAddError(null)
    try {
      await addItem({ trip_id: tripId, piece_id: piece.id, size })
      setDone(tripId)
    } catch {
      setAddError('Something went wrong. Try again.')
    } finally {
      setAdding(null)
    }
  }

  if (!mounted) return null

  const activeTripCount = trips.filter(t => t.status !== 'complete').length

  return (
    <Modal transparent visible={mounted} onRequestClose={onClose} statusBarTranslucent animationType="none">
      <View style={StyleSheet.absoluteFill}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink + '99' }, backdropStyle]}>
          <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>

        <Animated.View style={[s.sheet, sheetStyle]}>
          <View style={s.handle} />

          <View style={s.header}>
            <Text style={s.title}>Add to Trip</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={20} color={colors.slate} />
            </Pressable>
          </View>

          <Text style={s.sub} numberOfLines={2}>
            {piece.brand} {piece.name} · Size {size}
          </Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 340 }}
            contentContainerStyle={{ gap: 10, paddingVertical: 8 }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.navy} style={{ marginTop: 20 }} />
            ) : activeTripCount === 0 ? (
              <View style={s.emptyBox}>
                <Ionicons name="airplane-outline" size={24} color={colors.gray400} style={{ marginBottom: 8 }} />
                <Text style={s.emptyText}>No active trips yet.</Text>
                <Pressable
                  onPress={() => { onClose(); router.push('/trip/new' as any) }}
                  style={s.newTripBtn}
                >
                  <Text style={s.newTripText}>Plan a Trip →</Text>
                </Pressable>
              </View>
            ) : (
              trips
                .filter(t => t.status !== 'complete')
                .map(trip => {
                  const isDone    = done === trip.id
                  const isAdding  = adding === trip.id
                  return (
                    <Pressable
                      key={trip.id}
                      onPress={() => handleSelect(trip.id)}
                      disabled={!!adding || isDone}
                      style={({ pressed }) => [s.tripRow, isDone && s.tripRowDone, pressed && !isDone && { opacity: 0.85 }]}
                    >
                      <View style={[s.iconWrap, isDone && { backgroundColor: colors.success + '18' }]}>
                        <Ionicons
                          name={isDone ? 'checkmark' : (TRIP_ICONS[trip.type] ?? 'airplane-outline')}
                          size={18}
                          color={isDone ? colors.success : colors.navy}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.tripName, isDone && { color: colors.success }]} numberOfLines={1}>
                          {isDone ? 'Added!' : trip.name}
                        </Text>
                        <Text style={s.tripSub}>
                          {TRIP_LABELS[trip.type] ?? trip.type}
                          {trip.destination ? ` · ${trip.destination}` : ''}
                        </Text>
                      </View>
                      {isAdding ? (
                        <ActivityIndicator size="small" color={colors.navy} />
                      ) : isDone ? null : (
                        <Ionicons name="add-circle-outline" size={20} color={colors.navy + '80'} />
                      )}
                    </Pressable>
                  )
                })
            )}
          </ScrollView>

          {addError && (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: '#dc2626', textAlign: 'center', marginBottom: 8, paddingHorizontal: 4 }}>
              {addError}
            </Text>
          )}

          <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
            <Pressable
              onPress={() => { onClose(); router.push('/trip/new' as any) }}
              style={s.newTripBtnFull}
            >
              <Ionicons name="add" size={15} color={colors.navy} />
              <Text style={s.newTripFullText}>Plan a new trip</Text>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.cream,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    overflow: 'hidden', maxHeight: '85%',
    paddingHorizontal: 22, paddingTop: 8,
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: colors.sand + '70',
    alignSelf: 'center', marginBottom: 14,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  title:   { fontFamily: 'Inter-Bold', fontSize: 17, color: colors.navy, letterSpacing: -0.3 },
  sub:     { fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, marginBottom: 8 },
  emptyBox: {
    alignItems: 'center', paddingVertical: 24, gap: 4,
  },
  emptyText: { fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate },
  newTripBtn: { marginTop: 10 },
  newTripText: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy },
  tripRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: colors.sand + '80',
  },
  tripRowDone: { borderColor: colors.success + '40', backgroundColor: colors.success + '08' },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: colors.navy + '0D',
    alignItems: 'center', justifyContent: 'center',
  },
  tripName: { fontFamily: 'Inter-Bold', fontSize: 14, color: colors.navy, letterSpacing: -0.2 },
  tripSub:  { fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, marginTop: 1 },
  footer: {
    borderTopWidth: 1, borderTopColor: colors.sand + '50',
    paddingTop: 12,
  },
  newTripBtnFull: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.sand + '90',
    borderRadius: 12, paddingVertical: 13,
  },
  newTripFullText: { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy },
})
