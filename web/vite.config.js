import { resolve } from "path";
import { defineConfig } from "vite";
import vituum from 'vituum'
import handlebars from '@vituum/vite-plugin-handlebars'

export default defineConfig((configEnv) => {
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