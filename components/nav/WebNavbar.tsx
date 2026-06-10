import { View, Text, Pressable } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useSuitcaseStore, useSuitcaseHydrated } from '@/store/suitcaseStore'
import { colors } from '@/constants/colors'

const NAV_ITEMS = [
  { label: 'Home',      href: '/(tabs)/',        segment: '/' },
  { label: 'Browse',    href: '/(tabs)/pieces',   segment: '/pieces' },
  { label: 'Suitcase',  href: '/(tabs)/suitcase', segment: '/suitcase' },
  { label: 'Account',   href: '/(tabs)/account',  segment: '/account' },
]

export function WebNavbar() {
  const pathname = usePathname()
  const itemCount = useSuitcaseStore(s => s.items.length)
  const hydrated = useSuitcaseHydrated()

  return (
    <View style={{
      height: 64,
      backgroundColor: colors.cream,
      borderBottomWidth: 1,
      borderBottomColor: colors.sand,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 48,
    }}>
      {/* Brand wordmark */}
      <Pressable
        onPress={() => router.replace('/(tabs)/' as any)}
        accessibilityLabel="Davenport home"
        accessibilityRole="link"
      >
        <Text style={{
          fontFamily: 'PlayfairDisplay-Bold',
          fontSize: 20,
          color: colors.navy,
          letterSpacing: 5,
        }}>
          DAVENPORT
        </Text>
      </Pressable>

      {/* Nav links */}
      <View style={{ flexDirection: 'row', gap: 36, alignItems: 'center' }}>
        {NAV_ITEMS.map(({ label, href, segment }) => {
          const isActive = pathname === segment || (segment === '/' && (pathname === '' || pathname === '/'))
          const displayLabel = label === 'Suitcase' && hydrated && itemCount > 0
            ? `Suitcase (${itemCount})`
            : label

          return (
            <Pressable
              key={segment}
              onPress={() => router.push(href as any)}
              accessibilityLabel={`Go to ${label}`}
              accessibilityRole="link"
            >
              <Text style={{
                fontFamily: isActive ? 'Inter-Medium' : 'Inter-Regular',
                fontSize: 15,
                color: isActive ? colors.navy : colors.slate,
              }}>
                {displayLabel}
              </Text>
              {isActive && (
                <View style={{ height: 2, backgroundColor: colors.navy, borderRadius: 1, marginTop: 3 }} />
              )}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
