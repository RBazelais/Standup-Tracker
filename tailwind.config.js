const { mauve, violet, red } = require("@radix-ui/colors");

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				// Raw Radix scales (for edge cases)
				...mauve,
				...violet,
				...red,

				// ============================================
				// SEMANTIC TOKENS - Use these in components
				// ============================================

				// Surfaces (background layers, darkest to lightest)
				surface: {
					base: mauve.mauve1, // #121113 - page bg
					raised: mauve.mauve2, // #1a191b - cards
					overlay: mauve.mauve3, // #232225 - inputs, modals
					sunken: "#0e0d0f", // recessed areas
				},

				// Borders
				border: {
					subtle: mauve.mauve4, // barely visible
					DEFAULT: mauve.mauve5, // standard
					strong: mauve.mauve6, // emphasis
					focus: violet.violet9, // focus rings
				},

				// Text hierarchy
				text: {
					muted: mauve.mauve9, // disabled
					subtle: mauve.mauve10, // placeholder
					soft: mauve.mauve11, // secondary, labels
					DEFAULT: mauve.mauve12, // primary
				},

				// Interactive accent
				accent: {
					subtle: violet.violet3, // hover bg
					DEFAULT: violet.violet9, // buttons, links
					hover: violet.violet10, // hover
					active: violet.violet11, // pressed
					text: violet.violet11, // accent text
				},

				// Status colors
				danger: {
					subtle: red.red3,
					DEFAULT: red.red9,
					text: red.red11,
				},
				success: {
					subtle: "#132d21",
					DEFAULT: "#30a46c",
					text: "#4cc38a",
				},
			},

			// Custom shadows with proper dark theme values
			boxShadow: {
				sm: "0 0.0625rem 0.125rem rgba(0, 0, 0, 0.3)",
				md: "0 0.25rem 0.375rem rgba(0, 0, 0, 0.4)",
				lg: "0 0.625rem 0.9375rem rgba(0, 0, 0, 0.5)",
				focus: `0 0 0 0.125rem ${violet.violet9}40`,
				"focus-accent": `0 0 0 0.125rem ${violet.violet9}`,
			},

			// Border radius
			borderRadius: {
				sm: "0.25rem", // 4px
				md: "0.5rem", // 8px
				lg: "0.75rem", // 12px
			},

			// Font families
			fontFamily: {
				sans: [
					"Inter",
					"-apple-system",
					"BlinkMacSystemFont",
					"Segoe UI",
					"sans-serif",
				],
			},

			// Adjusted font sizes for UI (rem with unitless line-height)
			fontSize: {
				xs: ["0.75rem", { lineHeight: "1.333" }], // 12px / 16px
				sm: ["0.8125rem", { lineHeight: "1.385" }], // 13px / 18px
				base: ["0.875rem", { lineHeight: "1.429" }], // 14px / 20px
				md: ["0.9375rem", { lineHeight: "1.467" }], // 15px / 22px
				lg: ["1.125rem", { lineHeight: "1.444" }], // 18px / 26px
				xl: ["1.25rem", { lineHeight: "1.4" }], // 20px / 28px
				"2xl": ["1.5rem", { lineHeight: "1.333" }], // 24px / 32px
				"3xl": ["1.875rem", { lineHeight: "1.2" }], // 30px / 36px
			},

			// Animation keyframes
			keyframes: {
				overlayShow: {
					from: { opacity: "0" },
					to: { opacity: "1" },
				},
				contentShow: {
					from: {
						opacity: "0",
						transform: "translate(-50%, -48%) scale(0.96)",
					},
					to: {
						opacity: "1",
						transform: "translate(-50%, -50%) scale(1)",
					},
				},
				slideDown: {
					from: { height: "0", opacity: "0" },
					to: {
						height: "var(--radix-accordion-content-height)",
						opacity: "1",
					},
				},
				slideUp: {
					from: {
						height: "var(--radix-accordion-content-height)",
						opacity: "1",
					},
					to: { height: "0", opacity: "0" },
				},
				fadeIn: {
					from: { opacity: "0" },
					to: { opacity: "1" },
				},
				scaleIn: {
					from: { opacity: "0", transform: "scale(0.95)" },
					to: { opacity: "1", transform: "scale(1)" },
				},
			},

			animation: {
				overlayShow: "overlayShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
				contentShow: "contentShow 150ms cubic-bezier(0.16, 1, 0.3, 1)",
				slideDown: "slideDown 200ms cubic-bezier(0.16, 1, 0.3, 1)",
				slideUp: "slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)",
				fadeIn: "fadeIn 150ms ease",
				scaleIn: "scaleIn 150ms ease",
			},

			// Transitions
			transitionTimingFunction: {
				spring: "cubic-bezier(0.16, 1, 0.3, 1)",
			},
		},
	},
	plugins: [require("@tailwindcss/typography")],
};
