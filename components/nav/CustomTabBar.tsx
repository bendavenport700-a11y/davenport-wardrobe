import { useEffect, useRef } from 'react'
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native'
import { BlurView } from 'expo-blur'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTabBarStore } from '@/store/tabBarStore'
import { useSuitcaseStore, useSuitcaseHydrated } from '@/store/suitcaseStore'
import { colors } from '@/constants/colors'

const MARGIN     = 16
const EXPANDED_H = 62
const COMPACT_H  = 50

type TabDef = {
  name: string
  label: string
  icon: string
  iconOutline: string
}

const TABS: TabDef[] = [
  { name: 'index',    label: 'Home',     icon: 'home',      iconOutline: 'home-outline'        },
  { name: 'pieces',   label: 'Browse',   icon: 'grid',      iconOutline: 'grid-outline'        },
  { name: 'suitcase', label: 'Suitcase', icon: 'briefcase', iconOutline: 'briefcase-outline'   },
  { name: 'plans',    label: 'Plans',    icon: 'clipboard', iconOutline: 'clipboard-outline'   },
  { name: 'account',  label: 'Account',  icon: 'person',    iconOutline: 'person-outline'      },
]

interface TabBarProps {
  state: { index: number; routes: { key: string; name: string }[] }
  navigation: {
    emit: (event: { type: string; target: string; canPreventDefault?: boolean }) => { defaultPrevented: boolean }
    navigate: (opts: { name: string; merge: boolean }) => void
  }
}

export function CustomTabBar({ state, navigation }: TabBarProps) {
  const insets          = useSafeAreaInsets()
  const scrolledDown    = useTabBarStore(s => s.scrolledDown)
  const setScrolledDown = useTabBarStore(s => s.setScrolledDown)
  const itemCount       = useSuitcaseStore(s => s.items.length)
  const hydrated        = useSuitcaseHydrated()

  // Reset to expanded whenever the active tab changes
  useEffect(() => {
    setScrolledDown(false)
  }, [state.index])

  const anim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.spring(anim, {
      toValue: scrolledDown ? 1 : 0,
      useNativeDriver: false,
      stiffness: 180,
      damping: 22,
      mass: 0.7,
    }).start()
  }, [scrolledDown])

  const pillHeight     = anim.interpolate({ inputRange: [0, 1], outputRange: [EXPANDED_H, COMPACT_H] })
  const labelOpacity   = anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [1, 0, 0] })
  const labelHeight    = anim.interpolate({ inputRange: [0, 1], outputRange: [13, 0] })
  const labelMarginTop = anim.interpolate({ inputRange: [0, 1], outputRange: [3, 0] })
  const borderOpacity  = anim.interpolate({ inputRange: [0, 1], outputRange: [0.27, 0.18] })

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { bottom: insets.bottom + 12 }]}
    >
      <Animated.View style={[styles.pill, { height: pillHeight }]}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, styles.overlay]} />
        <Animated.View style={[StyleSheet.absoluteFill, styles.border, { opacity: borderOpacity }]} />

        <View style={styles.row}>
          {TABS.map((tab, index) => {
            const route   = state.routes[index]
            if (!route) return null
            const focused    = state.index === index
            const iconColor  = focused ? colors.accent : colors.accent + '6A'
            const showBadge  = tab.name === 'suitcase' && hydrated && itemCount > 0

            return (
              <Pressable
                key={tab.name}
                style={styles.tabItem}
                onPress={() => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  })
                  if (!focused && !event.defaultPrevented) {
                    navigation.navigate({ name: route.name, merge: true })
                  }
                }}
                onLongPress={() => {
                  navigation.emit({ type: 'tabLongPress', target: route.key })
                }}
              >
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={(focused ? tab.icon : tab.iconOutline) as any}
                    size={20}
                    color={iconColor}
                  />
                  {showBadge && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {itemCount > 9 ? '9+' : itemCount}
                      </Text>
                    </View>
                  )}
                </View>

                <Animated.Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color:       iconColor,
                      opacity:     labelOpacity,
                      height:      labelHeight,
                      marginTop:   labelMarginTop,
                    },
                  ]}
                >
                  {tab.label}
                </Animated.Text>
              </Pressable>
            )
          })}
        </View>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: MARGIN,
    right: MARGIN,
  },
  pill: {
    borderRadius: EXPANDED_H / 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 22,
    elevation: 12,
  },
  overlay: {
    backgroundColor: colors.ink + 'AA',
  },
  border: {
    borderRadius: EXPANDED_H / 2,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -9,
    backgroundColor: colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Inter-Bold',
  },
  label: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 0.2,
    overflow: 'hidden',
  },
})
