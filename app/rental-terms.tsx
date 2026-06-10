import { ScrollView, Text, View, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'

const TERMS = `DAVENPORT WARDROBE LLC — RENTAL TERMS
Last updated: June 2026

Davenport Wardrobe LLC, a limited liability company ('Company', 'we', 'us').

1. MINIMUM RENTAL PERIOD
Each item rented through Davenport has a minimum rental period of 30 days. Returning an item before 30 days does not reduce your first month's charge.

2. MONTHLY BILLING
Your saved payment method is charged on the 1st of each month for all active rentals. Charges are processed automatically. You will receive a receipt by email after each successful charge.

3. SECURITY DEPOSIT
A refundable security deposit is held on your payment method when you place your first order. The deposit amount is disclosed at checkout. Your deposit is returned when all rented items have been received back in acceptable condition.

4. DAMAGE AND LOSS
Normal wear is expected and acceptable. Damage beyond normal wear, or failure to return an item within 90 days of a return request, may result in your deposit being charged. You will be given at least 30 days written notice before any deposit capture.

5. RETURNS
To return an item, email returns@davenport.rentals with your order number. We will provide instructions. Items must be returned in the condition received (accounting for normal wear).

6. ITEM CONDITION
Items are described accurately at time of listing. Condition is assessed as New, Like New, or Good. Wear count reflects prior rentals.

7. CANCELLATION
You may cancel a rental at any time after the 30-day minimum by returning the item. No cancellation fee beyond the minimum period.

8. CONTACT
Questions: support@davenport.rentals
Returns: returns@davenport.rentals

9. NON-RETURN AND DEFAULT
If you fail to return rented items within 90 days of a return request, or if your account becomes 90 days past due, Davenport may: (a) capture your full security deposit, (b) suspend your account, (c) report the outstanding balance to collections, and (d) pursue recovery through small claims court. You will be given at least 30 days written notice before any deposit capture. The outstanding balance will be calculated as the buyout price of all unreturned items at the time of default.

10. SHIPPING AND DELIVERY
Davenport ships within 2–3 business days. Delivery fee covers one-way shipping only. Return shipping via prepaid label provided by Davenport.

11. GOVERNING LAW
These Rental Terms shall be governed by and construed in accordance with the laws of the state in which Davenport Wardrobe LLC is registered, without regard to conflict of law provisions. Any disputes shall be resolved in the courts of that state.

12. PRIVACY
Davenport Wardrobe LLC collects your name, email, shipping address, and payment method to fulfill your rental orders. We do not sell your personal information. See our Privacy Policy at davenport.rentals/privacy for full details.`

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
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16, color: colors.slate }}>Close</Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: insets.bottom + 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.navy, lineHeight: 24 }}>
          {TERMS}
        </Text>
      </ScrollView>
    </View>
  )
}
