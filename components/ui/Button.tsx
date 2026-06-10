import { Text, Pressable, ActivityIndicator, type PressableProps } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { colors } from '@/constants/colors'

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  loading?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function Button({
  label, variant = 'primary', loading = false, size = 'lg', disabled, onPress, ...props
}: ButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }) }
  const handlePressOut = () => { scale.value = withSpring(1.0, { damping: 15, stiffness: 400 }) }

  const bgColors = {
    primary:     colors.navy,
    secondary:   'transparent',
    ghost:       'transparent',
    destructive: colors.error,
  }
  const textColors = {
    primary:     colors.cream,
    secondary:   colors.navy,
    ghost:       colors.slate,
    destructive: colors.white,
  }
  const borderColors = {
    primary:     'transparent',
    secondary:   colors.navy,
    ghost:       'transparent',
    destructive: 'transparent',
  }
  const paddingY = size === 'sm' ? 10 : size === 'md' ? 12 : 16

  return (
    <AnimatedPressable
      style={[
        animatedStyle,
        {
          // Disabled → gray. Loading → keep variant color (button stays active-looking with spinner).
          backgroundColor: disabled ? colors.gray200 : bgColors[variant],
          borderRadius: 12,
          paddingVertical: paddingY,
          paddingHorizontal: 20,
          borderWidth: 1.5,
          borderColor: disabled ? colors.gray200 : borderColors[variant],
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={disabled || loading ? undefined : onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      accessibilityLabel={label}
      {...props}
    >
      {loading
        ? <ActivityIndicator size="small" color={disabled ? colors.gray400 : textColors[variant]} />
        : <Text style={{
            fontFamily: 'Inter-Medium',
            fontSize: size === 'sm' ? 14 : 16,
            color: disabled ? colors.gray400 : textColors[variant],
            letterSpacing: 0.2,
          }}>
            {label}
          </Text>
      }
    </AnimatedPressable>
  )
}
