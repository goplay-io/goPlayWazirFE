/** @type {import('tailwindcss').Config} */
export default {
    prefix: 'tw-',
    content: [
        "./index.html",
        "./src/**/*.{vue,js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
                lato: ['Lato', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                montserrat: ['Montserrat', 'ui-sans-serif', 'system-ui', 'sans-serif'],
                condensed: ['Roboto Condensed', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: 'var(--primary-50)',
                    100: 'var(--primary-100)',
                    200: 'var(--primary-200)',
                    300: 'var(--primary-300)',
                    400: 'var(--primary-400)',
                    500: 'var(--primary-500)',
                    600: 'var(--primary-600)',
                    700: 'var(--primary-700)',
                    800: 'var(--primary-800)',
                    900: 'var(--primary-900)',
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                    active: 'var(--color-primary-active)',
                    light: 'var(--color-primary-light)',
                },
                secondary: {
                    50: 'var(--secondary-50)',
                    100: 'var(--secondary-100)',
                    200: 'var(--secondary-200)',
                    300: 'var(--secondary-300)',
                    400: 'var(--secondary-400)',
                    500: 'var(--secondary-500)',
                    600: 'var(--secondary-600)',
                    700: 'var(--secondary-700)',
                    800: 'var(--secondary-800)',
                    900: 'var(--secondary-900)',
                    DEFAULT: 'var(--color-secondary)',
                    hover: 'var(--color-secondary-hover)',
                    active: 'var(--color-secondary-active)',
                    light: 'var(--color-secondary-light)',
                },
                neutral: {
                    50: 'var(--neutral-50)',
                    100: 'var(--neutral-100)',
                    200: 'var(--neutral-200)',
                    300: 'var(--neutral-300)',
                    400: 'var(--neutral-400)',
                    500: 'var(--neutral-500)',
                    600: 'var(--neutral-600)',
                    700: 'var(--neutral-700)',
                    800: 'var(--neutral-800)',
                    900: 'var(--neutral-900)',
                },
                theme: {

                    background: 'var(--color-background)',
                    'background-alt': 'var(--color-background-alt)',
                    surface: 'var(--color-surface)',
                    'surface-alt': 'var(--color-surface-alt)',
                    hover: 'var(--color-surface-alt)',
                    text: 'var(--color-text)',
                    'text-secondary': 'var(--color-text-secondary)',
                    'text-muted': 'var(--color-text-muted)',
                    'text-inverse': 'var(--color-text-inverse)',
                    border: 'var(--color-border)',
                    'border-light': 'var(--color-border-light)',
                    'border-strong': 'var(--color-border-strong)',
                    error: 'var(--color-error)',
                    warning: 'var(--color-warning)',
                    success: 'var(--color-success)',
                    header: 'var(--color-header-bg)',
                    'header-text': 'var(--color-header-text)',
                    nav: 'var(--color-nav)',
                    'nav-hover': 'var(--color-nav-hover)',
                    'nav-text': 'var(--color-nav-text)',
                },
                error: {
                    50: 'var(--error-50)',
                    100: 'var(--error-100)',
                    200: 'var(--error-200)',
                    300: 'var(--error-300)',
                    400: 'var(--error-400)',
                    500: 'var(--error-500)',
                    600: 'var(--error-600)',
                    700: 'var(--error-700)',
                    800: 'var(--error-800)',
                    900: 'var(--error-900)',
                    DEFAULT: 'var(--color-error)',
                },
                warning: {
                    50: 'var(--warning-50)',
                    100: 'var(--warning-100)',
                    200: 'var(--warning-200)',
                    300: 'var(--warning-300)',
                    400: 'var(--warning-400)',
                    500: 'var(--warning-500)',
                    600: 'var(--warning-600)',
                    700: 'var(--warning-700)',
                    800: 'var(--warning-800)',
                    900: 'var(--warning-900)',
                    DEFAULT: 'var(--color-warning)',
                },
                success: {
                    50: 'var(--secondary-50)',
                    100: 'var(--secondary-100)',
                    200: 'var(--secondary-200)',
                    300: 'var(--secondary-300)',
                    400: 'var(--secondary-400)',
                    500: 'var(--secondary-500)',
                    600: 'var(--secondary-600)',
                    700: 'var(--secondary-700)',
                    800: 'var(--secondary-800)',
                    900: 'var(--secondary-900)',
                    DEFAULT: 'var(--color-success)',

                },
                odds: {
                    back: 'var(--color-back-bg-1)',
                    'back-hover': 'var(--color-back-hover)',
                    lay: 'var(--color-lay-bg-1)',
                    'lay-hover': 'var(--color-lay-hover)',
                },
                // Custom colors from prototype
                'card-dark': '#09081b',
                'card-bg': '#121325',
                'accent-red': '#bf1742',
                'accent-orange': '#9e4d2d',
                'accent-blue': '#2491eb',
                'accent-yellow': '#ebb324',
                gold: 'var(--color-gold)',
                'accent-green': '#18a81d',
                'light-green': '#004B02',
                marquee: 'var(--color-marquee)',
            }, keyframes: {
                slideInUp: {
                    'from': {
                        opacity: '0',
                        transform: 'translateY(20px) scale(0.9)'
                    },
                    'to': {
                        opacity: '1',
                        transform: 'translateY(0) scale(1)'
                    }
                },
                slideInTransaction: {
                    'from': {
                        opacity: '0',
                        transform: 'translateX(-20px) scale(0.95)'
                    },
                    'to': {
                        opacity: '1',
                        transform: 'translateX(0) scale(1)'
                    }
                },
                rotate: {
                    '0%, 100%': {
                        transform: 'rotate(0deg) scale(1)'
                    },
                    '50%': {
                        transform: 'rotate(5deg) scale(1.1)'
                    }
                }
            },
            animation: {
                'slideInUp': 'slideInUp 0.6s ease-out forwards',
                'slideInTransaction': 'slideInTransaction 0.5s ease-out forwards',
                'rotate': 'rotate 4s ease-in-out infinite',
            }
        },
    },
    corePlugins: {
        preflight: false,
    },
    plugins: [],
}