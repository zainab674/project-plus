/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			'foreground-black': '#323338',
			"primary": "#090818",
			"secondary": "#1f1b32",
			"foreground-primary": "#ffffff",
			"foreground-secondary": "#b0b0c3",  
  			
			"tbutton-bg": "#7e22ce",        
			"tbutton-hover": "#a855f7",     
			"tbutton-text": "#ffffff",

			"accent": "#a855f7",         
			"accent-hover": "#9333ea"    
 
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
