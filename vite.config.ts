
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Make sure environment variables are properly handed to the client
  define: {
    'import.meta.env.VITE_DB_HOST': JSON.stringify(process.env.VITE_DB_HOST || 'localhost'),
    'import.meta.env.VITE_DB_USER': JSON.stringify(process.env.VITE_DB_USER || 'root'),
    'import.meta.env.VITE_DB_PASSWORD': JSON.stringify(process.env.VITE_DB_PASSWORD || 'Karthikeya#2005'),
    'import.meta.env.VITE_DB_DATABASE': JSON.stringify(process.env.VITE_DB_DATABASE || 'attentrack'),
  }
}));
