/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF', // Bleu Roi
        'primary-dark': '#1E3A8A', // Bleu encore plus sombre
        secondary: '#F59E0B', // Or/Ambre
        background: '#EFF6FF', // Bleu très pâle (Ice Blue)
        card: '#FFFFFF', // Blanc pur
        'text-main': '#111827', // Gris presque noir
        'text-muted': '#6B7280', // Gris moyen
        success: '#059669', // Vert Émeraude
        danger: '#DC2626', // Rouge
      },
    },
  },
  plugins: [],
}
