import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  base: "/many-maps/", // Set base for GitHub Pages
  plugins: [react()],
});
