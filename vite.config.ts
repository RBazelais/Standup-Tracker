import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const isVercelPreview = process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL;

export default defineConfig({
	plugins: [react(), tailwindcss()],
	define: isVercelPreview ? {
		'import.meta.env.VITE_APP_URL': JSON.stringify(`https://${process.env.VERCEL_BRANCH_URL}`),
	} : {},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					'react-vendor': ['react', 'react-dom', 'react-router-dom'],
					'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-slot'],
					'markdown': ['react-markdown'],
					'octokit': ['@octokit/rest'],
					'date': ['date-fns'],
					'animation': ['framer-motion'],
					'icons': ['lucide-react'],
				},
			},
		},
		chunkSizeWarningLimit: 600,
	},
})