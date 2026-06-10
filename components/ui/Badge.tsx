import { View, Text } from 'react-native'
import { statusColor } from '@/utils/format'

interface BadgeProps {
  label: string
  color?: string
}

export function Badge({ label, color }: BadgeProps) {
  const bg = color ?? statusColor(label)
  return (
    <View style={{
      backgroundColor: bg + '20', borderRadius: 999,
      paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
    }}>
      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: bg }}>
        {label}
      </Text>
    </View>
  )
}
