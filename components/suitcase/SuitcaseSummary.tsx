import { View, Text } from 'react-native'
import { colors } from '@/constants/colors'
import { formatCents, formatCentsPerMonth } from '@/utils/format'
import { multiPieceDiscount } from '@/utils/pricing'

interface SuitcaseSummaryProps {
  itemCount: number
  discountPieceCount?: number  // total active pieces incl. existing rentals; defaults to itemCount
  rawMonthlyCents: number
  hasDepositOnFile: boolean
  handlingFeeCents: number
  depositCents: number
}

export function SuitcaseSummary({
  itemCount,
  discountPieceCount,
  rawMonthlyCents,
  hasDepositOnFile,
  handlingFeeCents,
  depositCents,
}: SuitcaseSummaryProps) {
  const discountRate = multiPieceDiscount(discountPieceCount ?? itemCount)
  const savingsCents = Math.round(rawMonthlyCents * discountRate)
  const discountedMonthly = rawMonthlyCents - savingsCents
  // Deposit is a hold (capture_method: manual) — not a charge. Only monthly + handling are captured.
  const dueTodayCents = discountedMonthly + handlingFeeCents

  return (
    <View style={{ backgroundColor: colors.white, borderRadius: 16, padding: 18, gap: 10, borderWidth: 1, borderColor: colors.sand + '80' }}>
      <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 18, color: colors.navy, marginBottom: 2, letterSpacing: 0.1 }}>
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

      <View style={{ height: 1.5, backgroundColor: colors.navy + '20', marginVertical: 2 }} />

      <Row
        label="Charged today"
        value={formatCents(dueTodayCents)}
        bold
        largeValue
      />

      {!hasDepositOnFile && (
        <Row
          label="+ Deposit hold"
          value={formatCents(depositCents)}
          sublabel="Authorized on your card, not captured. Released in full when your pieces are returned."
        />
      )}

      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate, lineHeight: 18, marginTop: 2 }}>
        After today: {formatCentsPerMonth(discountedMonthly)} billed every 30 days from your order date.
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
