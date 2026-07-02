import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import type { TripWithCount } from '@/hooks/useTrips'
import { colors } from '@/constants/colors'

const TYPE_LABELS: Record<string, string> = {
  event:         'Event',
  vacation:      'Vacation',
  extended_stay: 'Extended Stay',
  season:        'Season',
}

type TypeColor = { bg: string; text: string }
const TYPE_COLORS: Record<string, TypeColor> = {
  event:         { bg: colors.gold + '22', text: colors.gold },
  vacation:      { bg: '#EFF6FF',          text: '#1D4ED8' },
  extended_stay: { bg: colors.sand,        text: colors.slate },
  season:        { bg: '#F0FDF4',          text: '#15803D' },
}

function formatDateRange(start: string | null, end: string | null): string | null {
  const fmt = (d: string) =>
    new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  if (start && end) return `${fmt(start)} – ${fmt(end)}`
  if (start) return `From ${fmt(start)}`
  if (end) return `Until ${fmt(end)}`
  return null
}

export function TripCard({ trip }: { trip: TripWithCount }) {
  const dateRange = formatDateRange(trip.start_date, trip.end_date)
  const typeColor = TYPE_COLORS[trip.type] ?? { bg: colors.sand, text: colors.slate }

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/trip/[id]', params: { id: trip.id } } as any)}
      accessibilityRole="button"
      accessibilityLabel={`View plan: ${trip.name}`}
      style={({ pressed }) => ({
        backgroundColor: colors.white,
        borderRadius: 18,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.sand + '80',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      {/* Piece count bubble — matches web */}
      <View style={{
        width: 52, height: 52, borderRadius: 14,
        backgroundColor: colors.sand + '99',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 20, color: colors.navy, lineHeight: 22 }}>
          {trip.item_count}
        </Text>
        <Text style={{
          fontFamily: 'Inter-Medium', fontSize: 8,
          color: colors.slate + '80',
          textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 1,
        }}>
          {trip.item_count === 1 ? 'piece' : 'pieces'}
        </Text>
      </View>

      {/* Plan info */}
      <View style={{ flex: 1, gap: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 17, color: colors.navy, letterSpacing: -0.2, flexShrink: 1 }} numberOfLines={1}>
            {trip.name}
          </Text>
          <View style={{
            backgroundColor: typeColor.bg,
            borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2.5, flexShrink: 0,
          }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 9, color: typeColor.text, textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {TYPE_LABELS[trip.type] ?? trip.type}
            </Text>
          </View>
        </View>

        {dateRange ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Ionicons name="calendar-outline" size={11} color={colors.slate + '70'} />
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate + '80' }}>
              {dateRange}
            </Text>
          </View>
        ) : (
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.gray400 }}>
            No dates set
          </Text>
        )}
      </View>

      <Ionicons name="chevron-forward" size={14} color={colors.gray400} />
    </Pressable>
  )
}
