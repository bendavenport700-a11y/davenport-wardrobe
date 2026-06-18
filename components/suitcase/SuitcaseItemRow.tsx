import { View, Text, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Feather } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { colors } from '@/constants/colors'
import { DEFAULT_BLURHASH } from '@/constants/layout'
import { formatCentsPerMonth } from '@/utils/format'
import type { SuitcaseItem } from '@/types'

interface SuitcaseItemRowProps {
  item: SuitcaseItem
  onRemove: (pieceId: string, size: string) => void
  unavailable?: boolean
  removeDisabled?: boolean
}

export function SuitcaseItemRow({ item, onRemove, unavailable = false, removeDisabled = false }: SuitcaseItemRowProps) {
  const { piece, size } = item

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 12,
      backgroundColor: colors.white, borderRadius: 16, padding: 14,
      marginBottom: 10,
      borderWidth: 1, borderColor: colors.sand + '80',
      shadowColor: colors.navy, shadowOpacity: 0.06, shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 }, elevation: 2,
      opacity: unavailable ? 0.6 : 1,
    }}>
      <Pressable
        onPress={() => router.push({ pathname: '/piece/[id]', params: { id: piece.id } } as any)}
        accessibilityRole="button"
        accessibilityLabel={`View ${piece.name}`}
      >
        <Image
          source={piece.images[0] ?? null}
          placeholder={DEFAULT_BLURHASH}
          contentFit="cover"
          style={{ width: 64, height: 80, borderRadius: 10 }}
          transition={200}
        />
      </Pressable>

      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.slate, textTransform: 'uppercase', letterSpacing: 0.7 }}>
          {piece.brand}
        </Text>
        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 15, color: colors.navy }} numberOfLines={2}>
          {piece.name}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <View style={{ backgroundColor: colors.sand + '80', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.navy }}>{size}</Text>
          </View>
          {unavailable && (
            <View style={{ backgroundColor: colors.error + '20', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 }}>
              <Text style={{ fontFamily: 'Inter-Medium', fontSize: 11, color: colors.error }}>No longer available</Text>
            </View>
          )}
        </View>
      </View>

      <View style={{ alignItems: 'flex-end', gap: 10 }}>
        <Text style={{ fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy }}>
          {formatCentsPerMonth(item.rental_fee_cents)}
        </Text>
        <Pressable
          disabled={removeDisabled}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
            onRemove(piece.id, size)
          }}
          hitSlop={12}
          accessibilityLabel={`Remove ${piece.name}`}
          style={{ opacity: removeDisabled ? 0.3 : 1 }}>
          <Feather name="trash-2" size={16} color={colors.slate} />
        </Pressable>
      </View>
    </View>
  )
}
