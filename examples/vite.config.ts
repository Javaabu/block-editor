import { resolve } from "node:path"
import { defineConfig } from "vite"

/** `pnpm examples` serves these pages; `pnpm examples:build` builds them (CI checks they build). */
export default defineConfig({
  root: __dirname,
  resolve: {
    alias: { "@javaabu/block-editor": resolve(__dirname, "../resources/js") },
  },
  server: { fs: { allow: [resolve(__dirname, "..")] } },
  build: {
    outDir: resolve(__dirname, "dist"),
    emptyOutDir: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        blade: resolve(__dirname, "index.html"),
        react: resolve(__dirname, "react.html"),
      },
      onwarn(warning, warn) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return
        warn(warning)
      },
    },
  },
})
