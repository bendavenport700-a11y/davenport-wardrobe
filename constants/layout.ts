import { Dimensions } from 'react-native'
const W = Dimensions.get('window').width

export const layout = {
  screenPadding:  24,
  cardRadius:     14,
  cardPadding:    16,
  imageRadius:    12,
  cardGap:        12,
  tabBarHeight:   60,
  gridItemWidth:  Math.floor((W - 48 - 12) / 2),
  pieceCardWidth: Math.floor((W - 48 - 12) / 2),
} as const

// Default blurhash placeholder for all expo-image components
export const DEFAULT_BLURHASH = 'L36*0N~q~qIU~qIU~qIU~qj[j['
