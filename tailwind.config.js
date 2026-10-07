/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)', surface: 'var(--surface)', sunk: 'var(--sunk)', ink: 'var(--ink)', muted: 'var(--muted)', line: 'var(--line)',
        accent: 'var(--accent)', accentInk: 'var(--accent-ink)', accentSoft: 'var(--accent-soft)',
        good: 'var(--good)', goodSoft: 'var(--good-soft)', warn: 'var(--warn)', warnSoft: 'var(--warn-soft)', danger: 'var(--danger)',
      },
      fontFamily: {
        display: ['"Barlow Condensed"', '"Arial Narrow"', 'sans-serif'],
        body: ['Barlow', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
