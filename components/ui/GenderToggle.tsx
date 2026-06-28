import { View, Text, Pressable } from 'react-native'
import { colors } from '@/constants/colors'

type GenderOption = 'men' | 'women' | 'all'

interface Props {
  value: GenderOption
  onChange: (value: GenderOption) => void
}

const OPTIONS: { value: GenderOption; label: string }[] = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'all', label: 'All' },
]

export function GenderToggle({ value, onChange }: Props) {
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: colors.gray100,
      borderRadius: 10,
      padding: 3,
      gap: 2,
    }}>
      {OPTIONS.map(opt => {
        const active = value === opt.value
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: active }}
            style={{
              flex: 1,
              paddingVertical: 7,
              borderRadius: 8,
              alignItems: 'center',
              backgroundColor: active ? colors.white : 'transparent',
            }}
          >
            <Text style={{
              fontFamily: active ? 'Inter-Medium' : 'Inter-Regular',
              fontSize: 13,
              color: active ? colors.navy : colors.slate,
            }}>
              {opt.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
}
