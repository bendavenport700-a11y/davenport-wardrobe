import { View, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import { formatCents } from '@/utils/format'

interface DepositExplainerProps {
  depositCents: number
  hasDepositOnFile: boolean
}

export function DepositExplainer({ depositCents, hasDepositOnFile }: DepositExplainerProps) {
  if (hasDepositOnFile) {
    return (
      <View style={{
        backgroundColor: colors.success + '15', borderRadius: 12, padding: 14,
        flexDirection: 'row', gap: 10, alignItems: 'center',
      }}>
        <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.success, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark" size={16} color={colors.white} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.success }}>
            Deposit on file
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, marginTop: 2 }}>
            Your {formatCents(depositCents)} security deposit is already held. No additional charge.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ backgroundColor: colors.navy + '08', borderRadius: 12, padding: 14, gap: 8 }}>
      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
        About the {formatCents(depositCents)} security deposit
      </Text>
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.slate, lineHeight: 20 }}>
        A <Text style={{ fontFamily: 'Inter-Medium', color: colors.navy }}>refundable hold</Text> placed
        on your card — not a charge. Like a hotel pre-authorization, it's released within 2–3 business
        days once all pieces are returned in good condition.
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        {['Held, not charged', 'Released on return', 'Any major card'].map(label => (
          <View key={label} style={{
            flex: 1, backgroundColor: colors.navy + '08', borderRadius: 8,
            paddingVertical: 8, paddingHorizontal: 4, alignItems: 'center',
          }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.navy, textAlign: 'center', lineHeight: 14 }}>
              {label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
