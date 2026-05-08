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
      }
    },
  },
  plugins: [],
}
