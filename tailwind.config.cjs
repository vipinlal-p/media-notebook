module.exports = {
  content: ['./frontend/index.html', './frontend/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#070b14',
        panel: '#121826',
        muted: '#8b98b5',
        accent: '#ff5b38',
        accentSoft: '#ff8158',
        success: '#4fd1a1',
      },
      boxShadow: {
        glow: '0 24px 80px rgba(255, 91, 56, 0.16)',
      },
      backgroundImage: {
        spotlight:
          'radial-gradient(circle at top left, rgba(255, 91, 56, 0.22), transparent 26%), radial-gradient(circle at top right, rgba(79, 209, 161, 0.18), transparent 24%)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        body: ['"Manrope"', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
}
