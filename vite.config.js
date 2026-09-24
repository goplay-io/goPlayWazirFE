import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'marquee',
        },
      },
    }),
    vuetify({ autoImport: { labs: true } }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../Shared'),
    },
  },
  server: {
    host: true, // Expose on all network interfaces (accessible via WiFi)
    port: 5173, // Default port (you can change this)
  },
})
