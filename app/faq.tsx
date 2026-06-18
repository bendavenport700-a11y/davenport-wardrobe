import { View, Text, ScrollView, Linking, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'
import { layout } from '@/constants/layout'

const QUESTIONS = [
  {
    q: 'How does delivery work?',
    a: "We prepare and ship your piece directly to you, professionally cleaned and ready to wear. Most orders arrive within 1–2 weeks. You'll get a tracking number by email once it ships.",
  },
  {
    q: 'Why does shipping take 1–2 weeks?',
    a: "Every piece gets inspected and professionally cleaned before it ships. We don't rush that. It takes a few days to make sure everything is in perfect condition before it goes out. We're working on getting faster as we grow.",
  },
  {
    q: 'Are the pieces clean when they arrive?',
    a: "Yes. Every piece is professionally cleaned before it ships to you. We don't send anything out that isn't in perfect, wear-ready condition. If something ever arrives and doesn't look right, email us immediately and we'll make it right.",
  },
  {
    q: "What if it doesn't fit?",
    a: "Email returns@davenport.rentals within 7 days of delivery. We'll arrange a return at no cost and help you find something that fits better. If a size is running small or large, just let us know. We'd rather get you into the right piece than lose you over a sizing issue.",
  },
  {
    q: "What's the $75 deposit for?",
    a: "It's a refundable hold on your card, not a charge. Think of it like a hotel pre-authorization. It covers potential damage beyond normal wear and tear. We release it in full within 2–3 business days once all your pieces are returned in good condition. If there's ever a concern, we'll always contact you before taking any action.",
  },
  {
    q: 'Can I cancel anytime?',
    a: "Yes, after 30 days. You can return any piece after the 30-day minimum with no cancellation fee. Monthly billing stops the day we receive it back. No long-term contract, no penalties, no questions asked.",
  },
  {
    q: 'Does the buyout price really drop?',
    a: "Yes, automatically. Every month you keep renting a piece, its buyout price comes down. So if you're on the fence about owning something, just keep renting and you'll pay less for it the longer you stay. No deadline and no pressure. When you're ready, just let us know.",
  },
  {
    q: 'How does the buyout price work?',
    a: "The buyout price starts close to retail and drops a little every month you rent. After 6+ months you're often buying at well below what it costs new. And you've already been wearing it, so you know you love it. Email support@davenport.rentals anytime to ask about the current buyout price on a piece you're renting.",
  },
  {
    q: 'Is my payment information safe?',
    a: "All payments are processed by Stripe, the same platform used by Amazon, Shopify, and millions of other businesses. We never see or store your card number. Your $75 deposit is held as a pre-authorization, not a charge, and is released automatically when your pieces come back.",
  },
  {
    q: 'Who is Davenport?',
    a: "Davenport is a small business I started in Fairfield, CT because I got tired of spending $200+ on clothes I wore twice. We add new pieces every week and every customer matters. If something goes wrong, email me directly at ben@davenport.rentals and I'll personally make it right.\n\n- Ben Davenport, founder",
  },
]

export default function FAQScreen() {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.cream }}
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ paddingHorizontal: layout.screenPadding, marginBottom: 28 }}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Go back" accessibilityRole="button" style={{ marginBottom: 20 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy }}>← Back</Text>
        </Pressable>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 30, color: colors.navy, marginBottom: 8 }}>
          Common questions.
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, lineHeight: 22 }}>
          Real answers. No fluff.
        </Text>
      </View>

      <View style={{ paddingHorizontal: layout.screenPadding, gap: 12 }}>
        {QUESTIONS.map((item, i) => (
          <View
            key={i}
            style={{
              backgroundColor: colors.white,
              borderRadius: 14,
              padding: 18,
              gap: 10,
              borderWidth: 1,
              borderColor: colors.sand,
            }}
          >
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy, lineHeight: 22 }}>
              {item.q}
            </Text>
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate, lineHeight: 22 }}>
              {item.a}
            </Text>
          </View>
        ))}
      </View>

      <View style={{
        marginHorizontal: layout.screenPadding,
        marginTop: 24,
        backgroundColor: colors.navy,
        borderRadius: 14,
        padding: 20,
        gap: 10,
      }}>
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.cream }}>
          Still have a question?
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.sand, lineHeight: 21 }}>
          Email us and a real person will respond, usually within a few hours.
        </Text>
        <Pressable
          onPress={() => Linking.openURL('mailto:support@davenport.rentals')}
          accessibilityRole="button"
          style={{
            backgroundColor: colors.cream,
            borderRadius: 10,
            paddingVertical: 12,
            alignItems: 'center',
            marginTop: 4,
          }}
        >
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
            Email support@davenport.rentals
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}
