/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}', './public/**/*.html'],
    theme: {
        extend: {
            backgroundImage: {
                'grain': 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" seed="2"/%3E%3CfeColorMatrix in="noise" type="saturate" values="0"/%3E%3C/filter%3E%3Crect width="400" height="400" fill="rgba(0,0,0,0.02)" filter="url(%23noiseFilter)"/%3E%3C/svg%3E")',
            },
            fontSize: {
                xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0em' }],
                sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0em' }],
                base: ['1rem', { lineHeight: '1.6rem', letterSpacing: '0em' }],
                lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '0em' }],
                xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.005em', fontWeight: '600' }],
                '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em', fontWeight: '600' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.015em', fontWeight: '700' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.02em', fontWeight: '700' }],
                '5xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.025em', fontWeight: '700' }],
                '6xl': ['3.75rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '800' }],
                '7xl': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.035em', fontWeight: '800' }],
                '8xl': ['5.25rem', { lineHeight: '1.05', letterSpacing: '-0.04em', fontWeight: '900' }],
                '9xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.045em', fontWeight: '900' }],
            },
            fontFamily: {
                heading: ['Playfair Display', 'serif'],
                paragraph: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['Space Mono', 'monospace'],
            },
            colors: {
                primary: "#4A0820",
                "primary-foreground": "#ffffff",
                secondary: "#000000",
                "secondary-foreground": "#ffffff",
                background: "#ffffff",
                foreground: "#000000",
                "color-7": "#490708ff"
            },
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
    },
    plugins: [require('@tailwindcss/container-queries'), require('@tailwindcss/typography')],
}
