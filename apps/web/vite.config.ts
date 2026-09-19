import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { TanStackRouterVite } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "@workspace/ui/globals.css": path.resolve(
        import.meta.dirname,
        "../../packages/ui/src/styles/globals.css"
      ),
      "@workspace/ui": path.resolve(import.meta.dirname, "../../packages/ui/src"),
      "cn": path.resolve(
        import.meta.dirname,
        "../../packages/ui/src/lib/utils.ts"
      ),
    },
    dedupe: ["react", "react-dom"],
  },
})
