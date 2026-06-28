import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import type { Trip } from '@/types'
import { colors } from '@/constants/colors'

const TRIP_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  event: 'airplane-outline',
  vacation: 'sunny-outline',
  extended_stay: 'home-outline',
  season: 'school-outline',
}

const TRIP_LABELS: Record<string, string> = {
  event: 'Event',
  vacation: 'Vacation',
  extended_stay: 'Extended Stay',
  season: 'Season / School',
}

const STATUS_COLORS: Record<string, string> = {
  planning: colors.slate,
  active: colors.accent,
  ordered: colors.info,
  complete: colors.success,
}

function tripDateLabel(trip: Trip): string {
  if (trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date + 'T00:00:00Z')
    const end = new Date(trip.end_date + 'T00:00:00Z')
    const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
    return `${fmt.format(start)} – ${fmt.format(end)} · ${days}d`
  }
  if (trip.start_date) {
    const d = new Date(trip.start_date + 'T00:00:00Z')
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
  }
  return TRIP_LABELS[trip.type] ?? trip.type
}

export function TripCard({ trip }: { trip: Trip }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } } as any)}
      accessibilityRole="button"
      accessibilityLabel={`View trip: ${trip.name}`}
      style={({ pressed }) => ({
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.sand + '80',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      <View style={{
        width: 44, height: 44, borderRadius: 12,
        backgroundColor: colors.navy + '0D',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Ionicons name={TRIP_ICONS[trip.type] ?? 'airplane-outline'} size={20} color={colors.navy} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.navy, letterSpacing: -0.2 }} numberOfLines={1}>
          {trip.name}
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate }}>
          {tripDateLabel(trip)}{trip.destination ? ` · ${trip.destination}` : ''}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{
          width: 7, height: 7, borderRadius: 3.5,
          backgroundColor: STATUS_COLORS[trip.status] ?? colors.slate,
        }} />
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, textTransform: 'capitalize' }}>
          {trip.status}
        </Text>
        <Ionicons name="chevron-forward" size={13} color={colors.gray400} />
      </View>
    </Pressable>
  )
}
