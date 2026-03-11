/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        'pul': {
          'white': '#ffffff',
          'light': '#f7f7f7',
          'border': '#e5e5e5',
          'gray': '#666666',
          'dark-gray': '#333333',
          'black': '#000000',
          'blue': '#89CFF0',
        },
        'teams': {
          'new-york': '#FF6B35',
          'indy': '#ED1C24',
          'minnesota': '#582C83',
          'milwaukee': '#1E3A5F',
          'philadelphia': '#006D77',
          'raleigh': '#00A651',
          'nashville': '#4B0082',
          'dc': '#8B2332',
          'atlanta': '#E31837',
          'austin': '#F7941D',
        }
      },
      fontFamily: {
        'sans': ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'display': ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}