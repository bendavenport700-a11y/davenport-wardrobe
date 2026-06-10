import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1B2A4A',
        cream: '#F5F0E8',
        sand: '#C9B99A',
      },
    },
  },
}

export default config
