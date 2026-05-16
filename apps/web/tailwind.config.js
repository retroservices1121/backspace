module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      // Based on dark theme
      primary: '#09A0F1',
      secondary: '#0EBD7E',
      tertiary: '#FFB21D',
      fontFocus: '#FFFFFF',
      fontPrimary: '#E1E1E1',
      fontSecondary: '#ACACAC',
      fontTertiary: '#8C8C8C',
      backgroundNormal: '#1B1B1B',
      backgroundMedium: '#131313',
      backgroundLight: '#242424',
      backgroundDark: '#000000',
      dividerColor: '#202329',
      iconColor: '#E1E1E1',
      none: 'transparent',
      error: '#F44464',
      white: 'white',
      black: 'black',

      // ─── New design tokens (Phase 12 / webui port). Names chosen
      // to not collide with the legacy palette above so we can opt
      // components into the new design surface-by-surface instead
      // of forcing a global migration. Source of truth: :root in
      // globals.css; if you change one, change both.
      canvas: '#08070d',           // var(--bg)
      'canvas-2': '#0c0a16',       // var(--bg-2)
      surface: '#0f0d1a',
      'surface-2': '#16142a',
      hover: 'rgba(255,255,255,0.04)',
      'hover-2': 'rgba(88,34,251,0.10)',
      ink: '#ffffff',
      'ink-2': 'rgba(255,255,255,0.72)',
      'ink-3': 'rgba(255,255,255,0.5)',
      'ink-4': 'rgba(255,255,255,0.3)',
      line: 'rgba(255,255,255,0.08)',
      'line-2': 'rgba(255,255,255,0.14)',
      brand: '#5822FB',
      'brand-2': '#7B4CFF',
      'brand-soft': 'rgba(88,34,251,0.18)',
      'orange-vivid': '#FF8800',
      'blue-vivid': '#1C70F5',
      'green-vivid': '#0EAD69',
      'green-2': '#3BD691',
      'pink-vivid': '#ff5470',
      'pink-2': '#ff8a9b',
      gold: '#FFB44C',
    },
    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '768px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    },
    extend: {
      width: {
        'media' : '550px'
      },
      height: {
        'media' : '550px'
      },
      // font-display = Poppins (UI + display copy from the new design)
      // font-mono   = JetBrains Mono (numerics, mono labels, prices)
      // font-sans stays unchanged for legacy components that don't
      // opt in.
      fontFamily: {
        display: ['Poppins', 'ui-sans-serif', 'system-ui', '-apple-system',
          'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo',
          'monospace'],
      },
    },
  },
  plugins: [],
}
