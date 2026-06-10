import { View, type ViewStyle } from 'react-native'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  padding?: number
}

export function Card({ children, style, padding = layout.cardPadding }: CardProps) {
  return (
    <View style={[{
      backgroundColor: colors.white,
      borderRadius: layout.cardRadius,
      padding,
      shadowColor: '#000',
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    }, style]}>
      {children}
    </View>
  )
}
