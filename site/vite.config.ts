import { defineConfig } from "vite";
import { siteContent } from "./site-content.ts";

export default defineConfig({
  plugins: [siteContent()],
});
