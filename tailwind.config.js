/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', 'class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
  	screens: {
  		'xs': '475px',
  		'sm': '640px',
  		'md': '768px',
  		'lg': '1024px',
  		'xl': '1280px',
  		'2xl': '1536px',
  	},
  	extend: {
  		fontFamily: {
  			sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
  			display: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
  		},
  		animation: {
  			'pulse-border': 'pulse-border 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  			'slide-up': 'slide-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'slide-down': 'slide-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'fade-in': 'fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'bounce-slow': 'bounce 3s infinite'
  		},
  		keyframes: {
  			'pulse-border': {
  				'0%, 100%': {
  					opacity: 1
  				},
  				'50%': {
  					opacity: 0.5
  				}
  			},
  			'slide-up': {
  				'0%': {
  					transform: 'translateY(100%)',
  					opacity: 0
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: 1
  				}
  			},
  			'slide-down': {
  				'0%': {
  					transform: 'translateY(-100%)',
  					opacity: 0
  				},
  				'100%': {
  					transform: 'translateY(0)',
  					opacity: 1
  				}
  			},
  			'fade-in': {
  				'0%': {
  					opacity: 0
  				},
  				'100%': {
  					opacity: 1
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
  		spacing: {
  			'safe-bottom': 'max(env(safe-area-inset-bottom), 0px)',
  			'safe-top': 'max(env(safe-area-inset-top), 0px)',
  			'safe-left': 'max(env(safe-area-inset-left), 0px)',
  			'safe-right': 'max(env(safe-area-inset-right), 0px)'
  		},
  		minHeight: {
  			touch: '44px',
  			'touch-large': '48px'
  		},
  		minWidth: {
  			touch: '44px',
  			'touch-large': '48px'
  		},
  		perspective: {
  			'1000': '1000px'
  		},
		boxShadow: {
			'0': 'none',
			'1': '0 1px 2px rgba(0, 0, 0, 0.05)',
			'2': '0 4px 6px rgba(0, 0, 0, 0.08)',
			'3': '0 8px 12px rgba(0, 0, 0, 0.12)',
			'3xl': '0 35px 60px -12px rgba(0, 0, 0, 0.25)',
			'neumorphic': '5px 5px 15px rgba(0, 0, 0, 0.1), -5px -5px 15px rgba(255, 255, 255, 0.7)',
			'neumorphic-dark': '5px 5px 15px rgba(0, 0, 0, 0.3), -5px -5px 15px rgba(255, 255, 255, 0.05)',
			// Custom shadow levels
			'level-1': 'var(--shadow-level-1)',
			'level-2': 'var(--shadow-level-2)',
			'level-3': 'var(--shadow-level-3)'
		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			// Custom dashboard colors
  			'page-bg': 'var(--page-bg)',
  			'dashboard-card-bg': 'var(--dashboard-card-bg)',
  			'metrics-card-bg': 'var(--metrics-card-bg)',
  			'modal-card-bg': 'var(--modal-card-bg)',
  			'alt-card-bg': 'var(--alt-card-bg)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} 
