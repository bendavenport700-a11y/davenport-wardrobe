import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing,
} from 'react-native-reanimated'
import { colors } from '@/constants/colors'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: object
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useSharedValue(1)
  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1, true
    )
  }, [])
  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return (
    <Animated.View
      style={[animatedStyle, { width, height, borderRadius, backgroundColor: colors.gray200 }, style]}
    />
  )
}

export function PieceCardSkeleton() {
  return (
    <View style={{ flex: 1, margin: 6 }}>
      <Skeleton height={220} borderRadius={12} />
      <View style={{ marginTop: 8, gap: 6 }}>
        <Skeleton width="60%" height={12} />
        <Skeleton width="80%" height={16} />
        <Skeleton width="40%" height={12} />
      </View>
    </View>
  )
}

export function WardrobeCardSkeleton() {
  return (
    <View style={{ width: 220, marginRight: 12 }}>
      <Skeleton width={220} height={280} borderRadius={18} />
    </View>
  )
}

export function SuitcaseSkeleton() {
  return (
    <View style={{ flex: 1, padding: 16, gap: 16 }}>
      <Skeleton height={24} width="50%" />
      {[0, 1, 2].map(i => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Skeleton width={64} height={64} borderRadius={8} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton height={14} width="70%" />
            <Skeleton height={12} width="40%" />
          </View>
          <Skeleton width={48} height={16} />
        </View>
      ))}
    </View>
  )
}
