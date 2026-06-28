import { View, Text } from 'react-native'
import { colors } from '@/constants/colors'
import { formatCents, formatCentsPerMonth, wearCountLabel } from '@/utils/format'
import type { Piece } from '@/types'

interface PricingBlockProps {
  piece: Piece
  compact?: boolean
  rentalFeeCents?: number
  buyoutCents?: number
  wearCount?: number
}

export function PricingBlock({ piece, compact = false, rentalFeeCents, buyoutCents, wearCount }: PricingBlockProps) {
  const displayRental  = rentalFeeCents  ?? piece.rental_fee
  const displayBuyout  = buyoutCents     ?? piece.buyout_price
  const displayWear    = wearCount       ?? piece.wear_count

  if (compact) {
    return (
      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy }}>
        {formatCentsPerMonth(displayRental)}
      </Text>
    )
  }
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy }}>
          {formatCentsPerMonth(displayRental)}
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>to rent</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>
          {formatCents(displayBuyout)} to own outright
        </Text>
        {displayWear > 0 && (
          <View style={{ backgroundColor: colors.success + '20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.success }}>
              {wearCountLabel(displayWear)}
            </Text>
          </View>
        )}
      </View>
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate }}>
        Buyout price drops with each rental cycle.
      </Text>
    </View>
  )
}
