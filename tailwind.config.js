/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#162033',
        muted: '#68748a',
        line: '#dfe6f1',
        canvas: '#f4f7fb',
        brand: '#315fe8',
      },
      boxShadow: {
        card: '0 10px 35px rgba(31, 47, 74, 0.08)',
        modal: '0 28px 90px rgba(15, 23, 42, 0.24)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
    },
  },
  plugins: [],
};
