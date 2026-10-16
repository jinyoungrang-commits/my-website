import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/pages",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3113/my-website/",
    headless: true,
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run preview:pages -- --port 3113 --strictPort",
    port: 3113,
    reuseExistingServer: false,
  },
});
