/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        primary: {
          50: '#f6f4f0',
          100: '#ede7db',
          200: '#d9ccb0',
          300: '#c5b085',
          400: '#a89464',
          500: '#8b7849',
          600: '#4a3e2a', // Darker main brown
          700: '#3d3322',
          800: '#30291b',
          900: '#241f15',
        },
        secondary: {
          50: '#fefcf0',
          100: '#fdf8dc',
          200: '#fbf2b9',
          300: '#f8eb96',
          400: '#F3E37C', // Main yellow/gold
          500: '#f0dc5a',
          600: '#ecd238',
          700: '#d4bb1f',
          800: '#b29e19',
          900: '#8f8014',
        },
        accent: {
          50: '#f0f9fa',
          100: '#e1f3f5',
          200: '#c4e7eb',
          300: '#a6dae0',
          400: '#9AC2C9', // Main light blue
          500: '#7db0b8',
          600: '#609da7',
          700: '#518490',
          800: '#426b75',
          900: '#33525a',
        },
        neutral: {
          50: '#f9f9f9',
          100: '#f3f3f3',
          200: '#e8e8e8', // Light grey
          300: '#d6d6d6',
          400: '#b4b4b4',
          500: '#9a9a9a',
          600: '#818181',
          700: '#6a6a6a',
          800: '#545454',
          900: '#3f3f3f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px 0 rgba(89, 78, 54, 0.08)',
        'medium': '0 4px 16px 0 rgba(89, 78, 54, 0.12)',
        'large': '0 8px 32px 0 rgba(89, 78, 54, 0.16)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}