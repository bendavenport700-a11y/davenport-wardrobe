import { View, Text, Pressable, Linking, Modal } from 'react-native'
import { colors } from '@/constants/colors'

const APP_STORE_URL = 'https://apps.apple.com/app/id6778844291'

export function ForceUpdateModal({ visible }: { visible: boolean }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{
        flex: 1, backgroundColor: colors.ink + 'B3',
        alignItems: 'center', justifyContent: 'center', padding: 32,
      }}>
        <View style={{
          backgroundColor: colors.cream, borderRadius: 20,
          padding: 28, width: '100%', alignItems: 'center', gap: 16,
        }}>
          <Text style={{ fontFamily: 'PlayfairDisplay-Bold', fontSize: 24, color: colors.navy, textAlign: 'center' }}>
            Update Required
          </Text>
          <Text style={{ fontFamily: 'Inter-Regular', fontSize: 15, color: colors.slate, textAlign: 'center', lineHeight: 22 }}>
            A new version of Davenport is available with improvements and fixes. Please update to continue.
          </Text>
          <Pressable
            onPress={() => Linking.openURL(APP_STORE_URL)}
            style={{
              backgroundColor: colors.navy, borderRadius: 14,
              paddingVertical: 16, paddingHorizontal: 32,
              width: '100%', alignItems: 'center', marginTop: 4,
            }}
          >
            <Text style={{ fontFamily: 'Inter-Medium', fontSize: 16, color: colors.cream }}>
              Update on the App Store
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
