import { View, Text } from 'react-native'
import { Button } from './Button'
import { colors } from '@/constants/colors'

interface EmptyStateProps {
  message: string
  ctaLabel?: string
  onCta?: () => void
}

export function EmptyState({ message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.sand, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, color: colors.navy }}>D</Text>
      </View>
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate, textAlign: 'center' }}>
        {message}
      </Text>
      {ctaLabel && onCta && (
        <Button label={ctaLabel} onPress={onCta} />
      )}
    </View>
  )
}
