import { View, Text, Pressable } from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'

interface ScreenHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  right?: React.ReactNode
}

export function ScreenHeader({ title, subtitle, showBack = false, right }: ScreenHeaderProps) {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View style={{
      paddingTop: insets.top + 8,
      paddingBottom: 16,
      paddingHorizontal: 20,
      backgroundColor: colors.cream,
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    }}>
      <View style={{ flex: 1 }}>
        {showBack && (
          <Pressable onPress={() => router.back()} hitSlop={8} style={{ marginBottom: 4 }}
            accessibilityLabel="Go back" accessibilityRole="button">
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>← Back</Text>
          </Pressable>
        )}
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 26, color: colors.navy }}>{title}</Text>
        {subtitle && (
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, marginTop: 2 }}>{subtitle}</Text>
        )}
      </View>
      {right && <View>{right}</View>}
    </View>
  )
}
