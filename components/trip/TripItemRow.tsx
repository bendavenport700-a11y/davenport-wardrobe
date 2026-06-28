import { useState } from 'react'
import { View, Text, Pressable, Modal, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { Image } from 'expo-image'
import { Ionicons } from '@expo/vector-icons'
import { useUpdateTripItem } from '@/hooks/useTrip'
import type { TripItem } from '@/types'
import { SIZES_BY_CATEGORY } from '@/constants/inventory'
import { colors } from '@/constants/colors'
import { DEFAULT_BLURHASH } from '@/constants/layout'

interface Props {
  item: TripItem
  onRemove: (item: TripItem) => void
}

export function TripItemRow({ item, onRemove }: Props) {
  const piece = item.piece
  const missingSize = !item.size
  const { mutateAsync: updateItem } = useUpdateTripItem()
  const [showSizePicker, setShowSizePicker] = useState(false)
  const [saving, setSaving] = useState(false)

  // Build available size list: prefer piece.sizes_available, fall back to category defaults
  const sizeOptions: string[] = piece?.sizes_available?.length
    ? piece.sizes_available
    : (SIZES_BY_CATEGORY[piece?.category ?? ''] ?? ['XS', 'S', 'M', 'L', 'XL', 'XXL'])

  async function handleSizeSelect(size: string) {
    setSaving(true)
    setShowSizePicker(false)
    try {
      await updateItem({ id: item.id, trip_id: item.trip_id, size })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <View style={{
        backgroundColor: colors.white,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: missingSize ? colors.warning + '60' : colors.sand + '80',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 12,
      }}>
        {piece?.images?.[0] ? (
          <Image
            source={piece.images[0]}
            placeholder={DEFAULT_BLURHASH}
            style={{ width: 56, height: 70, borderRadius: 10 }}
            contentFit="cover"
          />
        ) : (
          <View style={{ width: 56, height: 70, borderRadius: 10, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Inter-Bold', fontSize: 18, color: colors.cream }}>D</Text>
          </View>
        )}

        <View style={{ flex: 1, gap: 2 }}>
          {piece?.brand && (
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 10, color: colors.slate, textTransform: 'uppercase', letterSpacing: 0.7 }}>
              {piece.brand}
            </Text>
          )}
          <Text style={{ fontFamily: 'Inter-Bold', fontSize: 14, color: colors.navy, letterSpacing: -0.2 }} numberOfLines={2}>
            {piece?.name ?? 'Unknown piece'}
          </Text>

          {missingSize ? (
            <Pressable
              onPress={() => setShowSizePicker(true)}
              disabled={saving}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.warning} />
              ) : (
                <>
                  <Ionicons name="warning-outline" size={12} color={colors.warning} />
                  <Text style={{ fontFamily: 'Inter-Medium', fontSize: 12, color: colors.warning }}>
                    Tap to select size
                  </Text>
                  <Ionicons name="chevron-forward" size={11} color={colors.warning + 'AA'} />
                </>
              )}
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setShowSizePicker(true)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
            >
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 12, color: colors.slate }}>
                Size {item.size}{item.occasion ? ` · ${item.occasion}` : ''}
              </Text>
              <Ionicons name="pencil-outline" size={11} color={colors.slate + '70'} />
            </Pressable>
          )}
        </View>

        <Pressable
          onPress={() => onRemove(item)}
          hitSlop={12}
          accessibilityLabel="Remove from trip"
          style={{ padding: 4 }}
        >
          <Ionicons name="close" size={18} color={colors.gray400} />
        </Pressable>
      </View>

      {/* Size picker modal */}
      <Modal
        visible={showSizePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSizePicker(false)}
      >
        <View style={s.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowSizePicker(false)} />
          <View style={s.sheet}>
            <View style={s.handle} />
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>Select Size</Text>
              <Pressable onPress={() => setShowSizePicker(false)} hitSlop={12}>
                <Ionicons name="close" size={20} color={colors.slate} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, padding: 4 }}>
                {sizeOptions.map(size => {
                  const selected = size === item.size
                  return (
                    <Pressable
                      key={size}
                      onPress={() => handleSizeSelect(size)}
                      style={{
                        paddingHorizontal: 18, paddingVertical: 12,
                        borderRadius: 12, borderWidth: 1.5,
                        backgroundColor: selected ? colors.navy : colors.white,
                        borderColor: selected ? colors.navy : colors.sand + 'CC',
                      }}
                    >
                      <Text style={{
                        fontFamily: 'Inter-Medium', fontSize: 14,
                        color: selected ? colors.cream : colors.navy,
                      }}>
                        {size}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,14,26,0.55)' },
  sheet: {
    backgroundColor: colors.cream,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    padding: 22, paddingBottom: 40, gap: 16, maxHeight: '70%',
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: colors.sand + '70', alignSelf: 'center', marginBottom: 8,
  },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle:  { fontFamily: 'Inter-Bold', fontSize: 17, color: colors.navy, letterSpacing: -0.3 },
})
