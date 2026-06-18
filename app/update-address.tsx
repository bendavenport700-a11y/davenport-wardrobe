import { useState } from 'react'
import { View, Text, TextInput, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '@/store/authStore'
import { useUpdateProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/Button'
import { colors } from '@/constants/colors'

const schema = z.object({
  line1: z.string().min(5, 'Street address required'),
  line2: z.string().optional(),
  city:  z.string().min(2, 'City required'),
  state: z.string().length(2, 'Use 2-letter state code'),
  zip:   z.string().regex(/^\d{5}$/, '5-digit ZIP required'),
})
type FormData = z.infer<typeof schema>

export default function UpdateAddressScreen() {
  const { session, profile } = useAuthStore()
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile()
  const [serverError, setServerError] = useState<string | null>(null)
  const insets = useSafeAreaInsets()

  const existing = profile?.shipping_address as { line1?: string; line2?: string; city?: string; state?: string; zip?: string } | null

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      line1: existing?.line1 ?? '',
      line2: existing?.line2 ?? '',
      city:  existing?.city  ?? '',
      state: existing?.state ?? '',
      zip:   existing?.zip   ?? '',
    },
  })

  const onSubmit = async (data: FormData) => {
    if (!session?.user.id) return
    setServerError(null)
    try {
      await updateProfile({
        userId: session.user.id,
        updates: { shipping_address: data },
      })
      router.back()
    } catch {
      setServerError('Could not update address. Please try again.')
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: insets.top + 20 }}>
        <Pressable
          onPress={() => router.back()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          style={{ marginBottom: 24 }}
        >
          <Text style={{ fontFamily: 'Inter-Medium', fontSize: 15, color: colors.navy }}>← Back</Text>
        </Pressable>

        <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 28, color: colors.navy, marginBottom: 8 }}>
          Shipping address
        </Text>
        <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, marginBottom: 28, lineHeight: 22 }}>
          Update where we send your pieces.
        </Text>

        {serverError && (
          <View style={{ backgroundColor: colors.error + '15', borderRadius: 10, padding: 14, marginBottom: 16 }}>
            <Text style={{ color: colors.error, fontFamily: 'Inter-Regular', fontSize: 14 }}>{serverError}</Text>
          </View>
        )}

        <View style={{ gap: 16 }}>
          <Controller name="line1" control={control} render={({ field }) => (
            <View>
              <Text style={label}>Street address</Text>
              <TextInput
                style={[input, errors.line1 && errorBorder]}
                placeholder="123 Main Street"
                placeholderTextColor={colors.gray400}
                autoCapitalize="words"
                onChangeText={field.onChange}
                value={field.value}
              />
              {errors.line1 && <Text style={errorText}>{errors.line1.message}</Text>}
            </View>
          )} />

          <Controller name="line2" control={control} render={({ field }) => (
            <View>
              <Text style={label}>Apt / Unit <Text style={{ color: colors.slate }}>(optional)</Text></Text>
              <TextInput
                style={input}
                placeholder="Apt 2B"
                placeholderTextColor={colors.gray400}
                onChangeText={field.onChange}
                value={field.value ?? ''}
              />
            </View>
          )} />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 2 }}>
              <Controller name="city" control={control} render={({ field }) => (
                <View>
                  <Text style={label}>City</Text>
                  <TextInput
                    style={[input, errors.city && errorBorder]}
                    placeholder="Fairfield"
                    placeholderTextColor={colors.gray400}
                    autoCapitalize="words"
                    onChangeText={field.onChange}
                    value={field.value}
                  />
                  {errors.city && <Text style={errorText}>{errors.city.message}</Text>}
                </View>
              )} />
            </View>
            <View style={{ flex: 1 }}>
              <Controller name="state" control={control} render={({ field }) => (
                <View>
                  <Text style={label}>State</Text>
                  <TextInput
                    style={[input, errors.state && errorBorder]}
                    placeholder="CT"
                    placeholderTextColor={colors.gray400}
                    autoCapitalize="characters"
                    maxLength={2}
                    onChangeText={v => field.onChange(v.toUpperCase())}
                    value={field.value}
                  />
                  {errors.state && <Text style={errorText}>{errors.state.message}</Text>}
                </View>
              )} />
            </View>
            <View style={{ flex: 1 }}>
              <Controller name="zip" control={control} render={({ field }) => (
                <View>
                  <Text style={label}>ZIP</Text>
                  <TextInput
                    style={[input, errors.zip && errorBorder]}
                    placeholder="06824"
                    placeholderTextColor={colors.gray400}
                    keyboardType="numeric"
                    maxLength={5}
                    onChangeText={field.onChange}
                    value={field.value}
                  />
                  {errors.zip && <Text style={errorText}>{errors.zip.message}</Text>}
                </View>
              )} />
            </View>
          </View>

          <Button label="Save address" onPress={handleSubmit(onSubmit)} loading={isPending} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const label    = { fontFamily: 'Inter-Medium', fontSize: 14, color: colors.navy, marginBottom: 6 } as const
const input    = { borderWidth: 1.5, borderColor: colors.sand, borderRadius: 10, padding: 14, fontFamily: 'Inter-Regular', fontSize: 16, color: colors.navy, backgroundColor: colors.white } as const
const errorBorder = { borderColor: colors.error } as const
const errorText   = { color: colors.error, fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 4 } as const
