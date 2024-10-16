import { resolve } from "path";
import { defineConfig } from "vite";
import vituum from 'vituum'
import handlebars from '@vituum/vite-plugin-handlebars'

export default defineConfig((configEnv) => {
  // Helps with getting Vite in debug mode, remove when done.
  console.log('import.meta.env.MODE', import.meta)
  console.log('configEnv', configEnv)
  
  return {
    plugins: [
      vituum(),
      handlebars({
          root: './src'
      })
    ],
    build: {
      sourcemap: configEnv.mode === 'development',
    }
  }
});