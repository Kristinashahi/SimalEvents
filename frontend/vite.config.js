import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  server: {
    historyApiFallback: true, // Ensures the frontend handles navigation
  },
  plugins: [react()],
})
