import { View, Text } from 'react-native'
import { colors } from '@/constants/colors'
import { formatCents, formatCentsPerMonth, wearCountLabel } from '@/utils/format'
import type { Piece } from '@/types'

interface PricingBlockProps {
  piece: Piece
  compact?: boolean
}

export function PricingBlock({ piece, compact = false }: PricingBlockProps) {
  if (compact) {
    return (
      <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy }}>
        {formatCentsPerMonth(piece.rental_fee)}
      </Text>
    )
  }
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy }}>
          {formatCentsPerMonth(piece.rental_fee)}
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>to rent</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 14, color: colors.slate }}>
          {formatCents(piece.buyout_price)} to own outright
        </Text>
        {piece.wear_count > 0 && (
          <View style={{ backgroundColor: colors.success + '20', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.success }}>
              {wearCountLabel(piece.wear_count)}
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
