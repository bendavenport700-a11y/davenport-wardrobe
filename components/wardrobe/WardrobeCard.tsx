import { useEffect, useState } from 'react'
import { Pressable, View, Text } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/colors'
import { DEFAULT_BLURHASH } from '@/constants/layout'
import type { Wardrobe } from '@/types'

interface WardrobeCardProps {
  wardrobe: Wardrobe
}

function useWardrobePreviews(wardrobeId: string) {
  return useQuery<string[]>({
    queryKey: ['wardrobe-previews', wardrobeId],
    queryFn: async () => {
      const { data } = await supabase
        .from('pieces')
        .select('images')
        .eq('wardrobe_id', wardrobeId)
        .eq('is_available', true)
        .eq('is_draft', false)
        .limit(5)
      const imgs: string[] = []
      for (const p of data ?? []) {
        if (p.images?.[0]) imgs.push(p.images[0])
      }
      return imgs
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function WardrobeCard({ wardrobe }: WardrobeCardProps) {
  const { data: images = [] } = useWardrobePreviews(wardrobe.id)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return
    const timer = setInterval(() => setIdx(i => (i + 1) % images.length), 2500)
    return () => clearInterval(timer)
  }, [images.length])

  // Home screen cards always show piece images — cover art is only used on the wardrobe detail page
  const displayImage = images.length > 0 ? images[idx] : null

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/wardrobe/[id]', params: { id: wardrobe.id } } as any)}
      accessibilityRole="button"
      accessibilityLabel={`Browse ${wardrobe.name} wardrobe`}
      style={{ width: 220 }}>

      {/* Image with overlay */}
      <View style={{ width: 220, height: 280, borderRadius: 18, overflow: 'hidden', backgroundColor: colors.navy }}>
        <Image
          source={displayImage ?? undefined}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          placeholder={DEFAULT_BLURHASH}
          transition={600}
        />

        {/* Dark gradient overlay */}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          paddingHorizontal: 14, paddingBottom: 14, paddingTop: 40,
          backgroundColor: 'rgba(10,16,30,0.58)',
        }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 16, color: colors.cream, lineHeight: 20 }} numberOfLines={1}>
            {wardrobe.name}
          </Text>
          {wardrobe.description && (
            <Text style={{ fontFamily: 'Inter-Regular', fontSize: 11, color: colors.cream + 'CC', marginTop: 3, lineHeight: 15 }} numberOfLines={2}>
              {wardrobe.description}
            </Text>
          )}
        </View>

        {/* Dot indicators when multiple images */}
        {images.length > 1 && (
          <View style={{
            position: 'absolute', top: 10, right: 10,
            flexDirection: 'row', gap: 4,
          }}>
            {images.map((_, i) => (
              <View key={i} style={{
                width: 5, height: 5, borderRadius: 2.5,
                backgroundColor: i === idx ? colors.cream : colors.cream + '55',
              }} />
            ))}
          </View>
        )}

        {/* "No cover yet" fallback when no images */}
        {!displayImage && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 48, color: colors.cream + '40' }}>D</Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}
