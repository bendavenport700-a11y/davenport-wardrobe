import { useState } from 'react'
import {
  Modal, View, Text, Pressable, TextInput,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSubmitReview } from '@/hooks/useReviews'
import { DEFAULT_BLURHASH } from '@/constants/layout'
import { colors } from '@/constants/colors'

export interface ReviewModalProps {
  visible: boolean
  rentalId: string
  pieceId: string
  userId: string
  pieceName: string
  pieceBrand: string
  pieceImage: string | null
  onClose: () => void
}

function StarPicker({ rating, onSelect }: { rating: number; onSelect: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Pressable key={n} onPress={() => onSelect(n)} hitSlop={10}>
          <Text style={{ fontSize: 36, color: n <= rating ? colors.accent : colors.sand }}>★</Text>
        </Pressable>
      ))}
    </View>
  )
}

export function ReviewModal({
  visible, rentalId, pieceId, userId,
  pieceName, pieceBrand, pieceImage, onClose,
}: ReviewModalProps) {
  const insets = useSafeAreaInsets()
  const [rating, setRating]         = useState(0)
  const [body, setBody]             = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { mutateAsync, isPending }  = useSubmitReview()

  async function handleSubmit() {
    if (!rating) return
    setSubmitError(null)
    try {
      await mutateAsync({
        rental_id: rentalId,
        piece_id:  pieceId,
        user_id:   userId,
        rating,
        body:      body.trim() || undefined,
      })
      reset()
    } catch (err: any) {
      setSubmitError(err?.message ?? 'Failed to submit. Please try again.')
    }
  }

  function reset() {
    setRating(0)
    setBody('')
    setSubmitError(null)
    onClose()
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={reset}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={s.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={reset} />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>

            <View style={s.handle} />

            {/* Piece header */}
            <View style={s.pieceRow}>
              {pieceImage && (
                <Image
                  source={pieceImage}
                  style={s.thumb}
                  contentFit="cover"
                  placeholder={DEFAULT_BLURHASH}
                />
              )}
              <View style={{ flex: 1 }}>
                <Text style={s.brand}>{pieceBrand}</Text>
                <Text style={s.pieceName} numberOfLines={2}>{pieceName}</Text>
              </View>
            </View>

            <Text style={s.prompt}>How would you rate this piece?</Text>

            <StarPicker rating={rating} onSelect={setRating} />

            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder="Share your thoughts… (optional)"
              placeholderTextColor={colors.gray400}
              multiline
              maxLength={280}
              style={s.input}
              textAlignVertical="top"
            />

            {submitError && (
              <Text style={{ fontFamily: 'Inter-Regular', fontSize: 13, color: colors.error, textAlign: 'center' }}>
                {submitError}
              </Text>
            )}

            <View style={s.actions}>
              <Pressable onPress={reset} style={s.skipBtn}>
                <Text style={s.skipText}>Skip</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmit}
                disabled={!rating || isPending}
                style={[s.submitBtn, (!rating || isPending) && { opacity: 0.45 }]}
              >
                <Text style={s.submitText}>
                  {isPending ? 'Submitting…' : 'Submit Review'}
                </Text>
              </Pressable>
            </View>

          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const s = StyleSheet.create({
  backdrop:  { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(8,14,26,0.55)' },
  sheet:     { backgroundColor: colors.cream, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 24, gap: 20 },
  handle:    { width: 38, height: 4, borderRadius: 2, backgroundColor: colors.sand + '70', alignSelf: 'center', marginBottom: 2 },
  pieceRow:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb:     { width: 56, height: 56, borderRadius: 10 },
  brand:     { fontFamily: 'Inter-Medium', fontSize: 10, color: colors.slate, textTransform: 'uppercase', letterSpacing: 1.3 },
  pieceName: { fontFamily: 'Inter-Bold', fontSize: 15, color: colors.navy, marginTop: 2, lineHeight: 20 },
  prompt:    { fontFamily: 'Inter-Bold', fontSize: 17, color: colors.navy, letterSpacing: -0.2 },
  input:     { backgroundColor: colors.white, borderRadius: 12, padding: 14, fontFamily: 'Inter-Regular', fontSize: 14, color: colors.navy, minHeight: 80, borderWidth: 1, borderColor: colors.sand + '60' },
  actions:   { flexDirection: 'row', gap: 10 },
  skipBtn:   { paddingVertical: 14, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1, borderColor: colors.sand + '80', justifyContent: 'center' },
  skipText:  { fontFamily: 'Inter-Medium', fontSize: 15, color: colors.slate },
  submitBtn: { flex: 1, backgroundColor: colors.navy, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  submitText:{ fontFamily: 'Inter-Bold', fontSize: 15, color: colors.cream },
})
