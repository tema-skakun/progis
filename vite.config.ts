import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],
	server: {
		port: 5173,
		proxy: {
			'/ogc': {
				target: 'http://zs.zulugis.ru:6473',
				changeOrigin: true,
				secure: false,
				rewrite: p => p.replace(/^\/ogc/, ''),
				headers: { Authorization: 'Basic bW86bW8=' } // mo:mo
			}
		}
	}
});
