import { Platform, View, Pressable, StyleSheet, useWindowDimensions } from 'react-native'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors } from '@/constants/colors'
import { useSuitcaseStore, useSuitcaseHydrated } from '@/store/suitcaseStore'
import { WebNavbar } from '@/components/nav/WebNavbar'

const MARGIN = 16
const PILL_H = 62

function PillBackground() {
  return (
    <View style={{
      flex: 1,
      borderRadius: PILL_H / 2,
      overflow: 'hidden',
      borderWidth: 1.5,
      borderColor: colors.accent + '66',
    }}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.ink + '8C' }]} />
    </View>
  )
}

export default function TabLayout() {
  const insets    = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const isWide    = Platform.OS === 'web' && width >= 768
  const itemCount = useSuitcaseStore(s => s.items.length)
  const hydrated  = useSuitcaseHydrated()

  if (isWide) {
    return (
      <View style={{ flex: 1 }}>
        <WebNavbar />
        <Tabs screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="index"    options={{ title: 'Home' }} />
          <Tabs.Screen name="pieces"   options={{ title: 'Browse' }} />
          <Tabs.Screen name="suitcase" options={{ title: 'Suitcase' }} />
          <Tabs.Screen name="account"  options={{ title: 'Account' }} />
        </Tabs>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.accent + '80',
          tabBarBackground: () => <PillBackground />,
          tabBarStyle: {
            position: 'absolute',
            bottom: insets.bottom + 12,
            left: MARGIN,
            right: MARGIN,
            height: PILL_H,
            borderRadius: PILL_H / 2,
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            paddingTop: 0,
            paddingBottom: 0,
            elevation: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.30,
            shadowRadius: 24,
          },
          tabBarLabelStyle: {
            fontFamily: 'Inter-Medium',
            fontSize: 10,
            letterSpacing: 0.2,
          },
          tabBarButton: (props) => (
            <Pressable
              {...props}
              onPress={props.onPress}
              onLongPress={props.onLongPress}
              style={[props.style, { justifyContent: 'center', padding: 0 }]}
            >
              {props.children}
            </Pressable>
          ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={20}
                color={focused ? colors.accent : colors.accent + '80'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="pieces"
          options={{
            title: 'Browse',
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'grid' : 'grid-outline'}
                size={20}
                color={focused ? colors.accent : colors.accent + '80'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="suitcase"
          options={{
            title: 'Suitcase',
            tabBarBadge: hydrated && itemCount > 0 ? itemCount : undefined,
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'briefcase' : 'briefcase-outline'}
                size={20}
                color={focused ? colors.accent : colors.accent + '80'}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={20}
                color={focused ? colors.accent : colors.accent + '80'}
              />
            ),
          }}
        />
      </Tabs>
    </View>
  )
}
