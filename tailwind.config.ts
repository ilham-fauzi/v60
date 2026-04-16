import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#131313',
          container: {
            lowest: '#0a0a0a',
            low: '#111111',
            DEFAULT: '#1a1a1a',
            high: '#222222',
            highest: '#2a2a2a',
          },
          bright: '#333333',
        },
        primary: {
          DEFAULT: '#FFBF00',
          container: '#FFBF00',
        },
        secondary: {
          DEFAULT: '#00F2FF',
          container: '#00F2FF',
        },
        tertiary: {
          DEFAULT: '#ece1ff',
        },
        error: {
          DEFAULT: '#ff5449',
          container: '#93000a',
        },
        on: {
          surface: {
            DEFAULT: '#e5e2e1',
            variant: '#a09d9a',
          },
          primary: {
            container: '#131313',
          },
          secondary: {
            container: '#131313',
          },
        },
        outline: {
          DEFAULT: '#6b6865',
          variant: 'rgba(255, 255, 255, 0.1)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Space Grotesk', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'xxxxl': '2.5rem',
      },
      boxShadow: {
        'glow-amber': '0 0 40px -10px rgba(255,191,0,0.25)',
        'glow-teal': '0 0 40px -10px rgba(0,242,255,0.15)',
      },
    },
  },
  plugins: [],
}

export default config
