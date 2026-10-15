import basicSsl from '@vitejs/plugin-basic-ssl'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The camera only opens on localhost or HTTPS: `npm run dev:phone` serves
// over HTTPS (self-signed certificate) on the local network, to test on a phone.
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'phone' ? [basicSsl()] : [])],
}))
