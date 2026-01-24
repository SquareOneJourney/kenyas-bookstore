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
        },
    },
    plugins: [],
}
