/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deep emerald green: chrome, nav, headers — the "closed shop" tone.
        ink: {
          DEFAULT: '#075B3A',
          50: '#EAF4EF',
          100: '#CDE3D4',
          400: '#40725A',
          600: '#075B3A',
          700: '#043D2A',
          900: '#0D2318',
        },
        // Lime: primary CTA, price emphasis, active states — matches the Shopina logo accent.
        marigold: {
          DEFAULT: '#7ED321',
          50: '#F3FBEA',
          100: '#EAF7E8',
          400: '#7ED321',
          600: '#5FA818',
        },
        // Chili: discount badges, sale ribbons, destructive actions.
        chili: {
          DEFAULT: '#E23744',
          50: '#FDECEE',
          400: '#E23744',
          600: '#B91F2B',
        },
        base: '#F8FBF8',
        surface: '#FFFFFF',
        ink900text: '#17201C',
        muted: '#68736D',
        line: '#E4E7EF',
      },
      fontFamily: {
        display: ['var(--font-sora)', 'sans-serif'],
        body: ['var(--font-inter)', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'monospace'],
      },
      borderRadius: {
        card: '10px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 43, 77, 0.06), 0 4px 12px rgba(20, 43, 77, 0.06)',
        cardHover: '0 4px 8px rgba(20, 43, 77, 0.08), 0 12px 24px rgba(20, 43, 77, 0.10)',
      },
    },
  },
  plugins: [],
};
