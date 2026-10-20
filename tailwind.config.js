/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Tight Variable"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        bg: 'rgb(var(--c-bg) / <alpha-value>)',
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        sunken: 'rgb(var(--c-sunken) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        edge: 'rgb(var(--c-edge) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        mute: 'rgb(var(--c-mute) / <alpha-value>)',
        // brand = black for primary fills. accent = text highlight colour. sun = lime highlight.
        brand: 'rgb(var(--c-brand) / <alpha-value>)',
        'brand-deep': 'rgb(var(--c-brand-deep) / <alpha-value>)',
        'brand-soft': 'rgb(var(--c-brand-soft) / <alpha-value>)',
        'on-brand': 'rgb(var(--c-on-brand) / <alpha-value>)',
        accent: 'rgb(var(--c-accent) / <alpha-value>)',
        sun: 'rgb(var(--c-sun) / <alpha-value>)',
        lav: 'rgb(var(--c-lav) / <alpha-value>)',
        sky: 'rgb(var(--c-sky) / <alpha-value>)',
        mint: 'rgb(var(--c-mint) / <alpha-value>)',
        pos: 'rgb(var(--c-pos) / <alpha-value>)',
        'pos-soft': 'rgb(var(--c-pos-soft) / <alpha-value>)',
        neg: 'rgb(var(--c-neg) / <alpha-value>)',
        'neg-soft': 'rgb(var(--c-neg-soft) / <alpha-value>)',
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.03), 0 8px 24px rgb(0 0 0 / 0.05)',
        pop: '0 6px 16px rgb(0 0 0 / 0.18)',
        'pop-sm': '0 1px 2px rgb(0 0 0 / 0.05)',
        nav: '0 10px 30px rgb(0 0 0 / 0.12)',
      },
      keyframes: {
        rise: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'none' } },
        sheet: { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        fade: { from: { opacity: 0 }, to: { opacity: 1 } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-5px)' } },
      },
      animation: {
        rise: 'rise .3s ease-out both',
        sheet: 'sheet .25s ease-out both',
        fade: 'fade .2s ease-out both',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
