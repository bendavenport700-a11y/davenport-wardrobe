import { View, Text } from 'react-native'
import { colors } from '@/constants/colors'
import { formatCents, formatCentsPerMonth } from '@/utils/format'
import { multiPieceDiscount } from '@/utils/pricing'

interface SuitcaseSummaryProps {
  itemCount: number
  rawMonthlyCents: number
  hasDepositOnFile: boolean
  handlingFeeCents: number
  depositCents: number
}

export function SuitcaseSummary({
  itemCount,
  rawMonthlyCents,
  hasDepositOnFile,
  handlingFeeCents,
  depositCents,
}: SuitcaseSummaryProps) {
  const discountRate = multiPieceDiscount(itemCount)
  const savingsCents = Math.round(rawMonthlyCents * discountRate)
  const discountedMonthly = rawMonthlyCents - savingsCents
  const dueTodayCents = discountedMonthly + handlingFeeCents + (hasDepositOnFile ? 0 : depositCents)

  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 18, gap: 10 }}>
      <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 18, color: colors.navy, marginBottom: 2 }}>
        Order Summary
      </Text>

      <Row label={`Monthly (${itemCount} piece${itemCount !== 1 ? 's' : ''})`} value={formatCentsPerMonth(rawMonthlyCents)} />

      {savingsCents > 0 && (
        <Row
          label={`Bundle discount (${Math.round(discountRate * 100)}% off)`}
          value={`−${formatCents(savingsCents)}/mo`}
          valueColor={colors.success}
        />
      )}

      {savingsCents > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: colors.sand, marginVertical: 2 }} />
          <Row
            label="Monthly total"
            value={formatCentsPerMonth(discountedMonthly)}
            bold
          />
        </>
      )}

      <View style={{ height: 1, backgroundColor: colors.sand, marginVertical: 2 }} />

      <Row label="Handling & shipping" value={formatCents(handlingFeeCents)} />

      {!hasDepositOnFile && (
        <Row
          label="Refundable deposit"
          value={formatCents(depositCents)}
          sublabel="Held, not charged — returned when all pieces are back"
        />
      )}

      <View style={{ height: 1.5, backgroundColor: colors.navy + '20', marginVertical: 2 }} />

      <Row
        label="Due today"
        value={formatCents(dueTodayCents)}
        bold
        largeValue
      />

      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, lineHeight: 18, marginTop: 2 }}>
        After today: {formatCentsPerMonth(discountedMonthly)} billed on the 1st of each month.
        Cancel or swap pieces anytime.
      </Text>
    </View>
  )
}

interface RowProps {
  label: string
  value: string
  sublabel?: string
  valueColor?: string
  bold?: boolean
  largeValue?: boolean
}

function Row({ label, value, sublabel, valueColor, bold, largeValue }: RowProps) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Text style={{
          fontFamily: bold ? 'Inter-Medium' : 'Inter-Regular',
          fontSize: 14, color: colors.navy, flex: 1,
        }}>
          {label}
        </Text>
        <Text style={{
          fontFamily: bold ? 'Inter-Medium' : 'Inter-Regular',
          fontSize: largeValue ? 18 : 14,
          color: valueColor ?? colors.navy,
        }}>
          {value}
        </Text>
      </View>
      {sublabel && (
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.slate, marginTop: 2, lineHeight: 16 }}>
          {sublabel}
        </Text>
      )}
    </View>
  )
}
