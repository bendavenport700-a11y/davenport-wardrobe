import { ScrollView, Text, View, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'

type Section = {
  number: string
  title: string
  body: string
  subsections?: { label: string; text: string }[]
  footer?: string
}

const SECTIONS: Section[] = [
  {
    number: '1',
    title: 'Minimum Rental Period',
    body: 'Each item rented through Davenport has a minimum rental period of 30 days. Returning an item before 30 days does not reduce your first payment.',
  },
  {
    number: '2',
    title: 'Rolling Billing',
    body: 'Rental fees are charged on a rolling 30-day cycle from the date your order is placed, not on a calendar-month schedule. Each active rental is billed independently. Charges are processed automatically to your saved payment method. You will receive a receipt by email after each successful charge.',
  },
  {
    number: '3',
    title: 'Security Deposit',
    body: 'A refundable security deposit is held on your payment method when you place your first order. The deposit amount is disclosed at checkout. Your deposit authorization is released when all rented items have been returned and inspected in acceptable condition. If your deposit was partially applied to a damage charge, the remaining authorization is automatically released by our payment processor.',
  },
  {
    number: '4',
    title: 'Damage Charges',
    body: 'Normal wear is expected and acceptable. Damage beyond normal wear — including stains, tears, missing buttons, or structural damage — will be assessed per item at the time of return.',
    subsections: [
      { label: '(a) Deposit Capture', text: 'Damage charges up to the amount of your security deposit will be applied against your deposit hold.' },
      { label: '(b) Excess Damage', text: 'If damage to one or more items exceeds your security deposit, the excess amount will be charged separately to your saved payment method. You authorize this charge by accepting these terms.' },
      { label: '(c) Multiple Items', text: 'Each item is assessed independently. If multiple returned items are damaged, damage charges are calculated per item and may be applied individually or in aggregate.' },
      { label: '(d) Buyout Option', text: 'In lieu of a damage charge, Davenport may charge you the buyout price of the damaged item. You will be notified in advance if this applies.' },
    ],
    footer: 'You will be given at least 30 days written notice before any deposit capture or damage charge is applied.',
  },
  {
    number: '5',
    title: 'Returns',
    body: "To return an item, tap 'Return' on your active rental in the Davenport app, or email returns@davenport.rentals with your order number. We will email a prepaid return label within 24 hours. Ship back within 21 days. Items must be returned in the condition received, accounting for normal wear.",
  },
  {
    number: '6',
    title: 'Refund Requests',
    body: "To request a refund, tap 'Request Refund' on your order in the Davenport app. Refund requests are reviewed within 3–5 business days. Approved refunds are credited to your original payment method. Refunds are not available after 30 days from your order date.",
  },
  {
    number: '7',
    title: 'Item Condition',
    body: 'Items are described accurately at time of listing. Condition is assessed as Pristine, Excellent, Well-Worn, or Veteran based on prior rental count. Wear count reflects rentals completed.',
  },
  {
    number: '8',
    title: 'Cancellation',
    body: 'You may request a return at any time. Your first 30 days are billed upfront and non-refundable, regardless of when you return. After day 30, billing stops as soon as you submit a return request. No cancellation fee.',
  },
  {
    number: '9',
    title: 'Non-Return and Default',
    body: 'If you fail to return rented items within 90 days of a return request, or if your account becomes 90 days past due, Davenport may:',
    subsections: [
      { label: '(a)', text: 'Charge your saved payment method the buyout price for each unreturned item. By accepting these terms, you expressly authorize this charge for any item not returned within the default period.' },
      { label: '(b)', text: 'Capture your full security deposit.' },
      { label: '(c)', text: 'Suspend your account.' },
      { label: '(d)', text: 'Report the outstanding balance to collections.' },
      { label: '(e)', text: 'Pursue recovery through small claims court.' },
    ],
    footer: 'You will be given at least 30 days written notice before any non-return charge is applied. The outstanding balance for non-returned items is calculated as the current buyout price of each unreturned item at the time of default. If multiple items are unreturned, each item\'s buyout price is charged separately.',
  },
  {
    number: '10',
    title: 'Contact',
    body: 'Questions: support@davenport.rentals\nReturns: returns@davenport.rentals',
  },
  {
    number: '11',
    title: 'Shipping and Delivery',
    body: 'Davenport ships within 1–2 weeks. Delivery fee covers one-way shipping only. Return shipping via prepaid label provided by Davenport.',
  },
  {
    number: '12',
    title: 'Governing Law',
    body: 'These Rental Terms shall be governed by and construed in accordance with the laws of the state in which Davenport Wardrobe LLC is registered, without regard to conflict of law provisions. Any disputes shall be resolved in the courts of that state.',
  },
  {
    number: '13',
    title: 'Privacy',
    body: 'Davenport Wardrobe LLC collects your name, email, shipping address, and payment method to fulfill your rental orders. We do not sell your personal information. See our Privacy Policy at davenport.rentals/privacy for full details.',
  },
]

export default function RentalTermsScreen() {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: colors.sand,
      }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 20, color: colors.navy }}>
          Rental Terms
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Close" accessibilityRole="button">
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate }}>Close</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 48 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, marginBottom: 28, letterSpacing: 0.1 }}>
          Davenport Wardrobe LLC — Last updated June 2026
        </Text>

        <View style={{ gap: 24 }}>
          {SECTIONS.map(section => (
            <View key={section.number} style={{
              backgroundColor: colors.white, borderRadius: 14,
              padding: 18, gap: 10,
              borderWidth: 1, borderColor: colors.sand + '80',
            }}>
              {/* Section header */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={{
                  backgroundColor: colors.navy, borderRadius: 6,
                  width: 26, height: 26, alignItems: 'center', justifyContent: 'center', marginTop: 1,
                }}>
                  <Text style={{ fontFamily: 'Inter-Bold', fontSize: 11, color: colors.cream }}>
                    {section.number}
                  </Text>
                </View>
                <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: colors.navy, flex: 1, lineHeight: 20, paddingTop: 4 }}>
                  {section.title.toUpperCase()}
                </Text>
              </View>

              {/* Body */}
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13.5, color: colors.slate, lineHeight: 22 }}>
                {section.body}
              </Text>

              {/* Subsections */}
              {section.subsections && (
                <View style={{ gap: 10, paddingLeft: 4 }}>
                  {section.subsections.map((sub, i) => (
                    <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
                      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 13, color: colors.navy, minWidth: 28 }}>
                        {sub.label}
                      </Text>
                      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13.5, color: colors.slate, lineHeight: 22, flex: 1 }}>
                        {sub.text}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Footer note */}
              {section.footer && (
                <View style={{ backgroundColor: colors.sand + '30', borderRadius: 8, padding: 12 }}>
                  <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12.5, color: colors.navy, lineHeight: 20, opacity: 0.8 }}>
                    {section.footer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
