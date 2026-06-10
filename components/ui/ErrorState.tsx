import { View, Text, Pressable } from 'react-native'
import { colors } from '@/constants/colors'

interface ErrorStateProps {
  message?: string
  onRetry?: () => void
}

export function ErrorState({ message = 'Something went wrong', onRetry }: ErrorStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.error + '15', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 20, color: colors.error }}>!</Text>
      </View>
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center' }}>
        {message}
      </Text>
      {onRetry && (
        <Pressable
          onPress={onRetry}
          style={{ backgroundColor: colors.navy, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}
        >
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.cream }}>Try Again</Text>
        </Pressable>
      )}
    </View>
  )
}
