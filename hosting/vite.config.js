import { resolve } from "path";
import { defineConfig } from "vite";
import vituum from 'vituum'
import handlebars from '@vituum/vite-plugin-handlebars'

export default defineConfig({
  plugins: [
    vituum(),
    handlebars({
        root: './src'
    })
  ],
  // build: {
  //   rollupOptions: {
  //     input: {
  //       main: resolve(__dirname, "/src/pages/index.hbs.html"),
  //       enduro: resolve(__dirname, "/src/pages/enduro.hbs.html")
  //     },
  //   },
  // },
});