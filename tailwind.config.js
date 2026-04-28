/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,jsx,mdx}',
    './src/components/**/*.{js,jsx,mdx}',
    './src/app/**/*.{js,jsx,mdx}',
    './src/lib/**/*.{js,jsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary accent green
        primary: {
          DEFAULT: '#34C759',
          dark: '#2AA84A',
          light: '#4DD469',
        },
        // Background colors
        background: {
          DEFAULT: '#FFFFFF',
          light: '#FAFAFA',
          lighter: '#F8F8F8',
          lighter2: '#F5F5F5',
        },
        // Text colors
        text: {
          dark: '#1A202C',
          heading: '#2D3748',
          body: '#4A5568',
          muted: '#718096',
        },
        // Border/Divider colors
        border: {
          DEFAULT: '#E2E8F0',
          light: '#CBD5E0',
        },
        // Additional accent colors
        accent: {
          purple: '#9B59B6',
          purpleLight: '#A044FF',
          purpleDark: '#6600FF',
          blue: '#3498DB',
          orange: '#FF7C47',
          yellow: '#FFC107',
        },
      },
      fontFamily: {
        heading: ['Inter', 'sans-serif'],
        body: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
