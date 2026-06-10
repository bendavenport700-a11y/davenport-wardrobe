import { View, Text, ScrollView } from 'react-native'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

const STEPS = [
  {
    title: 'Pick your pieces',
    body: 'Browse curated pieces from Vuori, Bonobos, J.Crew, and more. Choose your size.',
  },
  {
    title: 'Rent monthly',
    body: 'Ships to your door in 2–3 days. Keep it as long as you want.',
  },
  {
    title: 'Love it? Buy it.',
    body: 'The buyout price drops every month you rent. Decide to own it whenever you\'re ready.',
  },
  {
    title: 'Not for you? Return it.',
    body: 'Send it back, no questions asked. Swap for something else or cancel — your call.',
  },
]

export function HowItWorksStrip() {
  return (
    <View style={{ paddingTop: 28, paddingBottom: 8, gap: 20 }}>

      {/* Section header */}
      <View style={{ paddingHorizontal: layout.screenPadding, gap: 4 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, color: colors.navy }}>
          Rent first. Decide later.
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, lineHeight: 22 }}>
          Try before you commit. Buy what you love at a price that's already come down.
        </Text>
      </View>

      {/* 4-step cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: layout.screenPadding, gap: 10 }}
      >
        {STEPS.map((step, i) => (
          <View key={i} style={{
            backgroundColor: i === 2 ? colors.navy : colors.white,
            borderRadius: 16,
            padding: 18,
            width: 176,
            gap: 10,
            borderWidth: 1,
            borderColor: i === 2 ? 'transparent' : colors.sand,
          }}>
            <View style={{
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: i === 2 ? colors.cream + '30' : colors.navy + '12',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: i === 2 ? colors.cream : colors.navy }}>
                {i + 1}
              </Text>
            </View>
            <Text style={{
              fontFamily: 'Inter-Medium', fontSize: 14,
              color: i === 2 ? colors.cream : colors.navy,
            }}>
              {step.title}
            </Text>
            <Text style={{
              fontFamily: 'Inter-Regular', fontSize: 12,
              color: i === 2 ? colors.sand : colors.slate,
              lineHeight: 17,
            }}>
              {step.body}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Buyout explainer */}
      <View style={{
        marginHorizontal: layout.screenPadding,
        backgroundColor: colors.navy + '08',
        borderRadius: 14,
        padding: 16,
        gap: 8,
      }}>
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
          The buyout price drops as you rent.
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }}>
          Rent it, wear it, and decide if you want to own it. The longer you keep a piece, the lower the buyout price gets — no pressure, no deadline.
        </Text>
      </View>

    </View>
  )
}
