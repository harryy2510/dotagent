import { defineConfig } from "vite-plus";
import { siteContent } from "./site-content.ts";

export default defineConfig({
  plugins: [siteContent()],
  fmt: {
    ignorePatterns: ["dist/**", "node_modules/**"],
  },
  lint: {
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    include: ["tests/**/*.test.ts", "delivery.test.ts"],
  },
  staged: {
    "*.{ts,css,html,json,md,yml}": "vp check --fix",
  },
});
