/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                ink: '#0F172A',
                ecru: '#F6F1E8',
                oxblood: '#722F37',
                brass: '#C08A3A',
                bone: '#E8DFCF',
                midnight: '#0C1A2C',
                mist: 'hsl(220 15% 96%)',
                forest: '#244B3C',
                cream: '#FAF5E1',
                'deep-blue': '#102840',
                accent: '#E6CBA8',
                muted: 'hsl(240 4.8% 95.9%)',
                'muted-foreground': 'hsl(240 3.8% 46.1%)',
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            boxShadow: {
                elevate: '0 16px 40px -20px rgba(15, 23, 42, 0.35)',
                'soft-plate': '0 30px 70px -40px rgba(0, 0, 0, 0.45)',
            },
            letterSpacing: {
                wide: '0.06em',
                wider: '0.12em',
            },
        },
    },
    plugins: [],
}
