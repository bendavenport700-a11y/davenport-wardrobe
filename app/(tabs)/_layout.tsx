import { Platform, View, useWindowDimensions } from 'react-native'
import { Tabs } from 'expo-router'
import { WebNavbar } from '@/components/nav/WebNavbar'
import { CustomTabBar } from '@/components/nav/CustomTabBar'

export default function TabLayout() {
  const { width } = useWindowDimensions()
  const isWide    = Platform.OS === 'web' && width >= 768

  if (isWide) {
    return (
      <View style={{ flex: 1 }}>
        <WebNavbar />
        <Tabs screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="index"    options={{ title: 'Home' }} />
          <Tabs.Screen name="pieces"   options={{ title: 'Browse' }} />
          <Tabs.Screen name="suitcase" options={{ title: 'Suitcase' }} />
          <Tabs.Screen name="plans"    options={{ title: 'Plans' }} />
          <Tabs.Screen name="account"  options={{ title: 'Account' }} />
        </Tabs>
      </View>
    )
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={props => <CustomTabBar {...(props as any)} />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index"    options={{ title: 'Home' }} />
        <Tabs.Screen name="pieces"   options={{ title: 'Browse' }} />
        <Tabs.Screen name="suitcase" options={{ title: 'Suitcase' }} />
        <Tabs.Screen name="plans"    options={{ title: 'Plans' }} />
        <Tabs.Screen name="account"  options={{ title: 'Account' }} />
      </Tabs>
    </View>
  )
}
