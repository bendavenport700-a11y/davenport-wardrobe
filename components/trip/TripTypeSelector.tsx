import { View, Text, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { TripType } from '@/types'
import { colors } from '@/constants/colors'

interface TripTypeOption {
  type: TripType
  icon: React.ComponentProps<typeof Ionicons>['name']
  label: string
  sub: string
}

const OPTIONS: TripTypeOption[] = [
  { type: 'event',         icon: 'calendar-outline', label: 'Event',         sub: 'Wedding, conference, dinner' },
  { type: 'vacation',      icon: 'airplane-outline', label: 'Vacation',      sub: 'Trip, weekend getaway' },
  { type: 'extended_stay', icon: 'home-outline',     label: 'Extended Stay', sub: 'Semester, work assignment' },
  { type: 'season',        icon: 'sunny-outline',    label: 'Season',        sub: 'Seasonal wardrobe refresh' },
]

interface Props {
  value: TripType | null
  onChange: (type: TripType) => void
}

export function TripTypeSelector({ value, onChange }: Props) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {OPTIONS.map(opt => {
        const selected = value === opt.type
        return (
          <Pressable
            key={opt.type}
            onPress={() => onChange(opt.type)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={({ pressed }) => ({
              width: '47%',
              padding: 16,
              borderRadius: 18,
              borderWidth: 1.5,
              borderColor: selected ? colors.navy : colors.sand + '90',
              backgroundColor: selected ? colors.navy : colors.white,
              opacity: pressed ? 0.88 : 1,
              gap: 10,
            })}
          >
            <View style={{
              width: 38, height: 38, borderRadius: 10,
              backgroundColor: selected ? colors.cream + '20' : colors.gray100,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={opt.icon} size={20} color={selected ? colors.cream : colors.slate} />
            </View>
            <View style={{ gap: 2 }}>
              <Text style={{
                fontFamily: 'Inter-Bold', fontSize: 14,
                color: selected ? colors.cream : colors.navy,
                letterSpacing: -0.2,
              }}>
                {opt.label}
              </Text>
              <Text style={{
                fontFamily: 'Inter-Regular', fontSize: 11.5,
                color: selected ? colors.cream + 'AA' : colors.slate,
                lineHeight: 16,
              }}>
                {opt.sub}
              </Text>
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}
