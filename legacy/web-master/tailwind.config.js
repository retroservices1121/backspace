module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
		zindex: {},
    extend: {
			animation: {
				beat: "beat 1s infinite",
			},
			keyframes: {
				beat: {
					"0%": {
						transform: "scale(1)",
					},
					"33%": {
						transform: "scale(1.1)",
					},
					"66%": {
						transform: "scale(0.9)",
					},
					"100%": {
						transform: "scale(1)",
					},
				},
			},
    },
  },
plugins: [
require('@tailwindcss/line-clamp'),
],
}
