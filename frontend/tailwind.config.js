module.exports = {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{js,jsx,ts,tsx}"
    ],
    plugins: [
        require("tailwindcss-animate"),
        require("@tailwindcss/typography")
    ],
    theme: {
    	extend: {
    		colors: {
    			background: 'oklch(var(--background) / <alpha-value>)',
    			foreground: 'oklch(var(--foreground) / <alpha-value>)',
    			card: {
    				DEFAULT: 'oklch(var(--card) / <alpha-value>)',
    				foreground: 'oklch(var(--card-foreground) / <alpha-value>)'
    			},
    			popover: {
    				DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
    				foreground: 'oklch(var(--popover-foreground) / <alpha-value>)'
    			},
    			primary: {
    				DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
    				foreground: 'oklch(var(--primary-foreground) / <alpha-value>)'
    			},
    			secondary: {
    				DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
    				foreground: 'oklch(var(--secondary-foreground) / <alpha-value>)'
    			},
    			muted: {
    				DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
    				foreground: 'oklch(var(--muted-foreground) / <alpha-value>)'
    			},
    			accent: {
    				DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
    				foreground: 'oklch(var(--accent-foreground) / <alpha-value>)'
    			},
    			destructive: {
    				DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
    				foreground: 'oklch(var(--destructive-foreground) / <alpha-value>)'
    			},
    			border: 'oklch(var(--border) / <alpha-value>)',
    			input: 'oklch(var(--input) / <alpha-value>)',
    			ring: 'oklch(var(--ring) / <alpha-value>)',
    			chart: {
    				'1': 'oklch(var(--chart-1) / <alpha-value>)',
    				'2': 'oklch(var(--chart-2) / <alpha-value>)',
    				'3': 'oklch(var(--chart-3) / <alpha-value>)',
    				'4': 'oklch(var(--chart-4) / <alpha-value>)',
    				'5': 'oklch(var(--chart-5) / <alpha-value>)'
    			},
    			sidebar: {
    				DEFAULT: 'oklch(var(--sidebar) / <alpha-value>)',
    				foreground: 'oklch(var(--sidebar-foreground) / <alpha-value>)',
    				primary: 'oklch(var(--sidebar-primary) / <alpha-value>)',
    				'primary-foreground': 'oklch(var(--sidebar-primary-foreground) / <alpha-value>)',
    				accent: 'oklch(var(--sidebar-accent) / <alpha-value>)',
    				'accent-foreground': 'oklch(var(--sidebar-accent-foreground) / <alpha-value>)',
    				border: 'oklch(var(--sidebar-border) / <alpha-value>)',
    				ring: 'oklch(var(--sidebar-ring) / <alpha-value>)'
    			}
    		},
    		fontFamily: {
    			sans: [
    				'var(--font-sans)'
    			],
    			serif: [
    				'var(--font-serif)'
    			],
    			mono: [
    				'var(--font-mono)'
    			]
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		boxShadow: {
    			'2xs': 'var(--shadow-2xs)',
    			xs: 'var(--shadow-xs)',
    			sm: 'var(--shadow-sm)',
    			DEFAULT: 'var(--shadow)',
    			md: 'var(--shadow-md)',
    			lg: 'var(--shadow-lg)',
    			xl: 'var(--shadow-xl)',
    			'2xl': 'var(--shadow-2xl)'
    		},
    		animation: {
    			'float-slow': 'float-slow 6s ease-in-out infinite',
    			'float-medium': 'float-medium 8s ease-in-out infinite',
    			'float-slower': 'float-slower 10s ease-in-out infinite',
    			'float-slowest': 'float-slowest 12s ease-in-out infinite',
    			'pulse-slow': 'pulse-slow 7s ease-in-out infinite',
    			'slide-right': 'slide-right 15s linear infinite',
    			'slide-left': 'slide-left 15s linear infinite',
    			'slide-right-slower': 'slide-right-slower 20s linear infinite',
    			'slide-left-slower': 'slide-left-slower 20s linear infinite',
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out',
    			scroll: 'scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite'
    		},
    		keyframes: {
    			'float-slow': {
    				'0%, 100%': {
    					transform: 'translateY(0)'
    				},
    				'50%': {
    					transform: 'translateY(-10px)'
    				}
    			},
    			'float-medium': {
    				'0%, 100%': {
    					transform: 'translateY(0)'
    				},
    				'50%': {
    					transform: 'translateY(-15px)'
    				}
    			},
    			'float-slower': {
    				'0%, 100%': {
    					transform: 'translateY(0)'
    				},
    				'50%': {
    					transform: 'translateY(-20px)'
    				}
    			},
    			'float-slowest': {
    				'0%, 100%': {
    					transform: 'translateY(0)'
    				},
    				'50%': {
    					transform: 'translateY(-25px)'
    				}
    			},
    			'pulse-slow': {
    				'0%, 100%': {
    					opacity: '0.2',
    					transform: 'scale(1)'
    				},
    				'50%': {
    					opacity: '0.3',
    					transform: 'scale(1.05)'
    				}
    			},
    			'slide-right': {
    				'0%': {
    					transform: 'translateX(-100%)'
    				},
    				'100%': {
    					transform: 'translateX(100%)'
    				}
    			},
    			'slide-left': {
    				'0%': {
    					transform: 'translateX(100%)'
    				},
    				'100%': {
    					transform: 'translateX(-100%)'
    				}
    			},
    			'slide-right-slower': {
    				'0%': {
    					transform: 'translateX(-100%)'
    				},
    				'100%': {
    					transform: 'translateX(100%)'
    				}
    			},
    			'slide-left-slower': {
    				'0%': {
    					transform: 'translateX(100%)'
    				},
    				'100%': {
    					transform: 'translateX(-100%)'
    				}
    			},
    			scroll: {
    				'0%': {
    					transform: 'translateX(0%)'
    				},
    				'100%': {
    					transform: 'translateX(-100%)'
    				}
    			},
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		rotate: {
    			'15': '15deg'
    		},
    		backgroundImage: {
    			noise: 'url("https://www.reactbits.dev/assets/noise.png")'
    		}
    	}
    }
}
