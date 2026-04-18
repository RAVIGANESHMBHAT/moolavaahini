import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff8ed',
          100: '#ffefd3',
          200: '#ffdaa5',
          300: '#ffbf6d',
          400: '#ff9a32',
          500: '#ff7c0a',
          600: '#f06000',
          700: '#c74702',
          800: '#9e390b',
          900: '#7f310c',
          950: '#451604',
        },
        earth: {
          50: '#fdf6ed',
          100: '#f8e8d0',
          200: '#f0ce9d',
          300: '#e7ae65',
          400: '#df8e3a',
          500: '#d97320',
          600: '#c05717',
          700: '#9e3f16',
          800: '#813318',
          900: '#6b2c17',
          950: '#3a1309',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        kannada: ['var(--font-noto-kannada)', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '72ch',
          },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
        },
        '.scrollbar-hide::-webkit-scrollbar': {
          display: 'none',
        },
      })
    },
  ],
}

export default config
