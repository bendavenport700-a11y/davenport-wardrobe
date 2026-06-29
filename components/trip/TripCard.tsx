import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import type { Trip } from '@/types'
import { colors } from '@/constants/colors'

const TYPE_LABELS: Record<string, string> = {
  event:         'Event',
  vacation:      'Vacation',
  extended_stay: 'Extended Stay',
  season:        'Season',
}

const TYPE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  event:         'calendar-outline',
  vacation:      'airplane-outline',
  extended_stay: 'home-outline',
  season:        'sunny-outline',
}

function formatDateRange(trip: Trip): string | null {
  if (trip.start_date && trip.end_date) {
    const start = new Date(trip.start_date + 'T00:00:00Z')
    const end = new Date(trip.end_date + 'T00:00:00Z')
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
    return `${fmt.format(start)} – ${fmt.format(end)}`
  }
  if (trip.start_date) {
    const d = new Date(trip.start_date + 'T00:00:00Z')
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
  }
  return null
}

export function TripCard({ trip }: { trip: Trip }) {
  const dateRange = formatDateRange(trip)

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } } as any)}
      accessibilityRole="button"
      accessibilityLabel={`View plan: ${trip.name}`}
      style={({ pressed }) => ({
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.sand + '80',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        opacity: pressed ? 0.9 : 1,
      })}
    >
      {/* Icon bubble */}
      <View style={{
        width: 46, height: 46, borderRadius: 13,
        backgroundColor: colors.navy + '0D',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Ionicons name={TYPE_ICONS[trip.type] ?? 'calendar-outline'} size={21} color={colors.navy} />
      </View>

      {/* Text */}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.navy, letterSpacing: -0.2 }} numberOfLines={1}>
          {trip.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{
            backgroundColor: colors.sand + '80',
            borderRadius: 20, paddingHorizontal: 7, paddingVertical: 2,
          }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.slate, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              {TYPE_LABELS[trip.type] ?? trip.type}
            </Text>
          </View>
          {dateRange && (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate }}>
              {dateRange}
            </Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={14} color={colors.gray400} />
    </Pressable>
  )
}
