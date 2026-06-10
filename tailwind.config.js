const { colors } = require('./constants/colors')
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy:    colors.navy,
        cream:   colors.cream,
        sand:    colors.sand,
        slate:   colors.slate,
        white:   colors.white,
        error:   colors.error,
        success: colors.success,
        warning: colors.warning,
        gray50:  colors.gray50,
        gray100: colors.gray100,
        gray200: colors.gray200,
        gray400: colors.gray400,
        gray700: colors.gray700,
        gray900: colors.gray900,
      },
      fontFamily: {
        playfair: ['PlayfairDisplay-Bold'],
        sans: ['Inter-Regular'],
        medium: ['Inter-Medium'],
      },
    },
  },
  plugins: [],
}
