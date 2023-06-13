import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/tour": {
        target: "http://komoot.de/tour/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tour/, ""),
      },
    },
  },
});
