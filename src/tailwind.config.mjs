/** @type {import('tailwindcss').Config} */
export default {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}', './public/**/*.html'],
    theme: {
        extend: {
            backgroundImage: {
                'grain': 'url("data:image/svg+xml,%3Csvg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" result="noise" seed="2"/%3E%3CfeColorMatrix in="noise" type="saturate" values="0"/%3E%3C/filter%3E%3Crect width="400" height="400" fill="rgba(0,0,0,0.02)" filter="url(%23noiseFilter)"/%3E%3C/svg%3E")',
            },
            fontSize: {
                xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.01em' }],
                sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],
                base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
                lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
                xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em', fontWeight: 'bold' }],
                '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em', fontWeight: 'bold' }],
                '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.01em', fontWeight: 'bold' }],
                '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.01em', fontWeight: 'bold' }],
                '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: 'bold' }],
                '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: 'bold' }],
                '7xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: 'bold' }],
                '8xl': ['5.25rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: 'bold' }],
                '9xl': ['6rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: 'bold' }],
            },
            fontFamily: {
                heading: ["cinzel", "serif"],
                paragraph: ["Inter", "system-ui", "sans-serif"],
                mono: ["Space Mono", "monospace"],
                roboto: ["roboto", "sans-serif"],
                montserrat: ["montserrat", "sans-serif"],
                "azeret-mono-black": ["azeret-mono-black", "azeret mono", "monospace"],
                "barlow-extralight": ["barlow-extralight", "barlow", "sans-serif"],
                "helvetica-neue-bold": ["helvetica neue bold", "sans-serif"],
                cinzel: ["cinzel", "serif"],

                "helveticaneuew01-thin": [
                    "helveticaneuew01-thin",
                    "helveticaneuew02-thin,helveticaneuew10-35thin",
                    "sans-serif"
                ],

                "roboto-bold": ["roboto-bold", "roboto", "sans-serif"],
                "fira-mono": ["fira-mono", "monospace"],
                "cormorant-garamond-v2": ["cormorant-garamond-v2", "serif"],
                "oswald-v2": ["oswald-v2", "sans-serif"],
                tiny5: ["tiny5", "sans-serif"],
                "bauhaus-pro": ["bauhaus-pro", "sans-serif"],
                "ibm-plex-sans": ["ibm-plex-sans", "sans-serif"],
                "gaude-expanded": ["gaude-expanded", "sans-serif"]
            },
            colors: {
                primary: "#6F0809",
                "primary-foreground": "#ffffff",
                secondary: "#000000",
                "secondary-foreground": "#ffffff",
                background: "#ffffff",
                foreground: "#000000",
                "color-7": "#6F0809ff"
            },
        },
    },
    future: {
        hoverOnlyWhenSupported: true,
    },
    plugins: [require('@tailwindcss/container-queries'), require('@tailwindcss/typography')],
}
