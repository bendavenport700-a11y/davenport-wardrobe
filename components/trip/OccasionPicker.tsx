import { View, Text, Pressable } from 'react-native'
import type { TripType } from '@/types'
import { colors } from '@/constants/colors'

const OCCASIONS_BY_TYPE: Record<TripType, string[]> = {
  event: ['Ceremony / Wedding', 'Rehearsal Dinner', 'Reception', 'Travel Day', 'Day-After Brunch'],
  vacation: ['Beach Days', 'Nice Dinners', 'Daytime Exploring', 'Athletic / Active', 'Travel Days'],
  extended_stay: ['Everyday Casual', 'Work', 'Weekend / Going Out', 'Formal Occasions', 'Athletic / Gym'],
  season: ['Everyday Casual', 'Work / Class', 'Weekend / Going Out', 'Formal Occasions', 'Athletic / Gym'],
}

interface Props {
  tripType: TripType
  selected: string[]
  onChange: (occasions: string[]) => void
}

export function OccasionPicker({ tripType, selected, onChange }: Props) {
  const options = OCCASIONS_BY_TYPE[tripType] ?? []

  function toggle(occ: string) {
    if (selected.includes(occ)) {
      onChange(selected.filter(o => o !== occ))
    } else {
      onChange([...selected, occ])
    }
  }

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {options.map(occ => {
        const active = selected.includes(occ)
        return (
          <Pressable
            key={occ}
            onPress={() => toggle(occ)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: active }}
            style={({ pressed }) => ({
              paddingHorizontal: 14,
              paddingVertical: 9,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: active ? colors.navy : colors.sand + '80',
              backgroundColor: active ? colors.navy : colors.white,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text style={{
              fontFamily: 'Inter-Medium',
              fontSize: 13,
              color: active ? colors.cream : colors.navy,
            }}>
              {occ}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
