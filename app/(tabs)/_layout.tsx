import { Platform, View, useWindowDimensions } from 'react-native'
import { Tabs } from 'expo-router'
import { BlurView } from 'expo-blur'
import { Feather } from '@expo/vector-icons'
import { colors } from '@/constants/colors'
import { useSuitcaseStore, useSuitcaseHydrated } from '@/store/suitcaseStore'
import { WebNavbar } from '@/components/nav/WebNavbar'

function TabIcon({ name, focused }: { name: keyof typeof Feather.glyphMap; focused: boolean }) {
  return <Feather name={name} size={22} color={focused ? colors.navy : colors.gray400} />
}

export default function TabLayout() {
  const { width } = useWindowDimensions()
  const isWide = Platform.OS === 'web' && width >= 768
  const itemCount = useSuitcaseStore(s => s.items.length)
  const hydrated = useSuitcaseHydrated()

  return (
    <View style={{ flex: 1 }}>
      {isWide && <WebNavbar />}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.navy,
          tabBarInactiveTintColor: colors.gray400,
          tabBarLabelStyle: { fontFamily: 'Inter-Medium', fontSize: 11 },
          tabBarStyle: {
            display: isWide ? 'none' : 'flex',
            borderTopWidth: 0,
            elevation: 0,
            height: 80,
            paddingBottom: 20,
          },
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
              <BlurView
                tint="light"
                intensity={80}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
            ) : (
              <View style={{ flex: 1, backgroundColor: colors.cream }} />
            ),
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="pieces"
          options={{
            title: 'Browse',
            tabBarIcon: ({ focused }) => <TabIcon name="grid" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="suitcase"
          options={{
            title: 'Suitcase',
            tabBarIcon: ({ focused }) => <TabIcon name="briefcase" focused={focused} />,
            tabBarBadge: hydrated && itemCount > 0 ? itemCount : undefined,
            tabBarBadgeStyle: { backgroundColor: colors.error, color: colors.white, fontSize: 11 },
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ focused }) => <TabIcon name="user" focused={focused} />,
          }}
        />
      </Tabs>
    </View>
  )
}
