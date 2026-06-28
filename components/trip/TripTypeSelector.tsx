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
  { type: 'event',         icon: 'airplane-outline',  label: 'Event',          sub: '1–7 days, specific occasions' },
  { type: 'vacation',      icon: 'sunny-outline',     label: 'Vacation',       sub: '1–2 weeks, leisure travel' },
  { type: 'extended_stay', icon: 'home-outline',      label: 'Extended Stay',  sub: '1–3 months' },
  { type: 'season',        icon: 'school-outline',    label: 'Season / School', sub: 'A whole semester or year' },
]

interface Props {
  value: TripType | null
  onChange: (type: TripType) => void
}

export function TripTypeSelector({ value, onChange }: Props) {
  return (
    <View style={{ gap: 10 }}>
      {OPTIONS.map(opt => {
        const selected = value === opt.type
        return (
          <Pressable
            key={opt.type}
            onPress={() => onChange(opt.type)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 18,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: selected ? colors.navy : colors.sand + '80',
              backgroundColor: selected ? colors.navy + '08' : colors.white,
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: selected ? colors.navy + '12' : colors.gray100,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Ionicons name={opt.icon} size={22} color={selected ? colors.navy : colors.slate} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.navy, letterSpacing: -0.2 }}>
                {opt.label}
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, marginTop: 2 }}>
                {opt.sub}
              </Text>
            </View>
            {selected && (
              <Ionicons name="checkmark-circle" size={22} color={colors.navy} />
            )}
          </Pressable>
        )
      })}
    </View>
  )
}
