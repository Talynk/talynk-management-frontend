/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html",
       "./src/**/*.{ts,tsx,js,jsx}"
      ],

  theme: {
  	extend: {
  		colors: {
  			blue: {
  				DEFAULT: '#006FFD',
  				50: '#E6F0FF',
  				100: '#CCE0FF',
  				200: '#99C2FF',
  				300: '#66A3FF',
  				400: '#3385FF',
  				500: '#006FFD',
  				600: '#0058CA',
  				700: '#004297',
  				800: '#002B64',
  				900: '#001531',
  			},
  			grey: '#71727A',
  			darkGrey: '#44454A',
  			red: {
  				DEFAULT: '#FF3B30',
  				50: '#FFECEB',
  				100: '#FFD9D7',
  				200: '#FFB3AF',
  				300: '#FF8D86',
  				400: '#FF675E',
  				500: '#FF3B30',
  				600: '#CC2F26',
  				700: '#99231D',
  				800: '#661813',
  				900: '#330C0A',
  			},
  			black1: '#2F3037',
  			kyan: '#D4E8F6',
  			lightGrey: '#F8F9FE',
  			bgGrey: '#8F9098',
  			green: {
  				50: '#E6F7EF',
  				100: '#CCF0DF',
  				200: '#99E0BF',
  				300: '#66D19F',
  				400: '#33C17F',
  				500: '#00B25F',
  				600: '#008E4C',
  				700: '#006B39',
  				800: '#004726',
  				900: '#002413',
  			},
  			yellow: {
  				50: '#FFF9E6',
  				100: '#FFF3CC',
  				200: '#FFE799',
  				300: '#FFDB66',
  				400: '#FFCF33',
  				500: '#FFC300',
  				600: '#CC9C00',
  				700: '#997500',
  				800: '#664E00',
  				900: '#332700',
  			},
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
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require('tailwind-scrollbar'),
      require("tailwindcss-animate")
],
}

