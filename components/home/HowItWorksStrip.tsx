import { useState, useRef } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

const STEPS = [
  {
    num: '1',
    title: 'Pick your pieces',
    body: 'Browse curated pieces from Vuori, Bonobos, J.Crew, and more. Choose your size.',
  },
  {
    num: '2',
    title: 'Rent monthly',
    body: 'Ships to your door in 2–3 days. Keep it as long as you want.',
  },
  {
    num: '3',
    title: 'Love it? Buy it.',
    body: 'The buyout price drops every month you rent. Own it whenever you\'re ready.',
  },
  {
    num: '4',
    title: 'Not for you? Return it.',
    body: 'Send it back, no questions asked. Swap for something else or cancel — your call.',
  },
]

const CARD_WIDTH = 176
const CARD_GAP   = 10
const ITEM_W     = CARD_WIDTH + CARD_GAP

export function HowItWorksStrip() {
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

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
      <View>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={e =>
            setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / ITEM_W))
          }
          onScrollEndDrag={e =>
            setActiveIdx(Math.round(e.nativeEvent.contentOffset.x / ITEM_W))
          }
          contentContainerStyle={{ paddingHorizontal: layout.screenPadding, gap: CARD_GAP }}
        >
          {STEPS.map((step, i) => (
            <View key={i} style={{
              backgroundColor: i === 2 ? colors.navy : colors.white,
              borderRadius: 16, padding: 18, width: CARD_WIDTH, gap: 10,
              borderWidth: 1, borderColor: i === 2 ? 'transparent' : colors.sand,
            }}>
              <View style={{
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: i === 2 ? colors.cream + '30' : colors.navy + '12',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: i === 2 ? colors.cream : colors.navy }}>
                  {step.num}
                </Text>
              </View>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: i === 2 ? colors.cream : colors.navy }}>
                {step.title}
              </Text>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: i === 2 ? colors.sand : colors.slate, lineHeight: 17 }}>
                {step.body}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Swipe hint + dots */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 12 }}>
          {/* Dots */}
          <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center' }}>
            {STEPS.map((_, i) => (
              <View key={i} style={{
                height: 5, borderRadius: 2.5,
                width: i === activeIdx ? 16 : 5,
                backgroundColor: i === activeIdx ? colors.navy : colors.sand,
              }} />
            ))}
          </View>
          {/* Swipe hint — only shows on first card */}
          {activeIdx === 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate }}>
                swipe
              </Text>
              <Ionicons name="chevron-forward" size={11} color={colors.slate} />
            </View>
          )}
        </View>
      </View>

      {/* Buyout explainer */}
      <View style={{
        marginHorizontal: layout.screenPadding,
        backgroundColor: colors.navy + '08',
        borderRadius: 14, padding: 16, gap: 8,
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
