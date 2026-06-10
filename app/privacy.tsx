import { ScrollView, Text, View, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'

const POLICY = `DAVENPORT WARDROBE — PRIVACY POLICY
Last updated: June 2026

1. INFORMATION WE COLLECT
We collect the following information when you create an account and use our service:
• Name and email address
• Shipping address
• Payment method (processed and stored by Stripe — we do not store card numbers)
• Rental and order history
• Device identifiers for app functionality

2. HOW WE USE YOUR INFORMATION
We use your information to:
• Process and fulfill rental orders
• Charge your saved payment method for monthly rentals
• Send order confirmations, billing receipts, and shipping updates
• Provide customer support
• Improve the service

3. DATA SHARING
We do not sell your personal information. We share data only with:
• Stripe (payment processing) — stripe.com/privacy
• Resend (transactional email delivery)
• Supabase (secure database hosting)

4. DATA RETENTION
We retain your account data for as long as your account is active. When you delete your account, your personal information is removed within 30 days. Order and rental records may be retained for legal and financial compliance purposes, anonymized from your identity.

5. YOUR RIGHTS
You may at any time:
• Request a copy of your data — email privacy@davenport.rentals
• Request correction of inaccurate data
• Delete your account in-app (Account tab → Delete Account at the bottom)

6. SECURITY
Your data is encrypted in transit and at rest. Payment information is handled exclusively by Stripe and never stored on Davenport servers.

7. CONTACT
For privacy questions: privacy@davenport.rentals
For support: support@davenport.rentals`

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: insets.top + 12, paddingBottom: 12, paddingHorizontal: 20,
        borderBottomWidth: 1, borderBottomColor: colors.sand,
      }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 20, color: colors.navy }}>
          Privacy Policy
        </Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate }}>Close</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.navy, lineHeight: 24 }}>
          {POLICY}
        </Text>
      </ScrollView>
    </View>
  )
}
