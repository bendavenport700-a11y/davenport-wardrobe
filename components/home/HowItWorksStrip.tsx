import { View, Text } from 'react-native'
import Animated, {
  FadeIn,
  FadeInLeft,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated'
import { useEffect } from 'react'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

const DARK = colors.ink

const STEPS = [
  {
    num: '01',
    title: 'Pick your pieces',
    body: 'Browse curated styles from Vuori, Bonobos, Faherty, and more. Choose your size.',
  },
  {
    num: '02',
    title: 'Rent monthly',
    body: 'Ships in 1–2 weeks, professionally cleaned and ready to wear.',
  },
  {
    num: '03',
    title: 'Love it? Buy it.',
    body: "The buyout price drops every month you rent. Own it whenever you're ready.",
  },
  {
    num: '04',
    title: 'Not for you? Return it.',
    body: 'Send it back, no questions asked. Swap for something else or cancel anytime.',
  },
]

// Subtle breathe: ring softly expands from the dot and fades — not aggressive
function PulseDot({ delay }: { delay: number }) {
  const ringScale   = useSharedValue(1.0)
  const ringOpacity = useSharedValue(0.65)

  useEffect(() => {
    ringScale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1.9, { duration: 1800, easing: Easing.out(Easing.cubic) }),
        withTiming(1.0, { duration: 0 }),
      ),
      -1
    ))
    ringOpacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(0, { duration: 1800, easing: Easing.out(Easing.cubic) }),
        withTiming(0.65, { duration: 0 }),
      ),
      -1
    ))
  }, [])

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }))

  return (
    <View style={{ width: 22, height: 22, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{
        position: 'absolute',
        width: 22, height: 22, borderRadius: 11,
        borderWidth: 1,
        borderColor: colors.sand + 'AA',
      }, ringStyle]} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.sand }} />
    </View>
  )
}

export function HowItWorksStrip() {
  return (
    <View style={{ backgroundColor: DARK, paddingVertical: 36 }}>
      <View style={{ paddingHorizontal: layout.screenPadding }}>

        {/* Header */}
        <Animated.View entering={FadeIn.duration(500)} style={{ marginBottom: 28 }}>
          <Text style={{
            fontFamily: 'Inter-Medium',
            fontSize: 10,
            color: colors.sand,
            letterSpacing: 3,
            textTransform: 'uppercase',
            marginBottom: 10,
          }}>
            The process
          </Text>
          <Text style={{
            fontFamily: 'PlayfairDisplay-Bold',
            fontSize: 26,
            color: colors.cream,
            letterSpacing: -0.3,
            lineHeight: 34,
          }}>
            How it works
          </Text>
          <Text style={{
            fontFamily: 'Inter-Regular',
            fontSize: 13,
            color: colors.sand,
            lineHeight: 20,
            marginTop: 8,
            maxWidth: 280,
          }}>
            Try before you commit. Buy what you love at a price that's already come down.
          </Text>
        </Animated.View>

        {/* Timeline steps */}
        {STEPS.map((step, i) => (
          <Animated.View
            key={i}
            entering={FadeInLeft.delay(250 + i * 130).duration(400)}
            style={{ flexDirection: 'row', gap: 18 }}
          >
            {/* Left: dot + connector */}
            <View style={{ alignItems: 'center', width: 22, paddingTop: 3 }}>
              <PulseDot delay={i * 400} />
              {i < STEPS.length - 1 && (
                <View style={{
                  flex: 1, width: 1,
                  backgroundColor: colors.sand + '20',
                  marginTop: 6,
                }} />
              )}
            </View>

            {/* Right: content */}
            <View style={{ flex: 1, paddingBottom: i < STEPS.length - 1 ? 24 : 0 }}>
              <Text style={{
                fontFamily: 'Inter-Medium',
                fontSize: 9,
                color: colors.sand + '50',
                letterSpacing: 2.5,
                textTransform: 'uppercase',
                marginBottom: 5,
              }}>
                {step.num}
              </Text>
              <Text style={{
                fontFamily: 'Inter-Bold',
                fontSize: 15,
                color: colors.cream,
                letterSpacing: -0.2,
                lineHeight: 21,
                marginBottom: 5,
              }}>
                {step.title}
              </Text>
              <Text style={{
                fontFamily: 'Inter-Regular',
                fontSize: 12,
                color: colors.sand,
                lineHeight: 18,
              }}>
                {step.body}
              </Text>
            </View>
          </Animated.View>
        ))}

        {/* Footer */}
        <Animated.View
          entering={FadeIn.delay(900).duration(500)}
          style={{
            marginTop: 20,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: colors.sand + '18',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.sand + '50' }} />
          <Text style={{
            fontFamily: 'Inter-Regular',
            fontSize: 11,
            color: colors.sand + '70',
            flex: 1,
            lineHeight: 17,
          }}>
            Buyout price drops automatically every month you rent.
          </Text>
        </Animated.View>

      </View>
    </View>
  )
}
