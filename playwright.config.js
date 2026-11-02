import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  forbidOnly: !!process.env.CI,
  expect: { timeout: 2000 },
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    browserName: "chromium",
    viewport: { width: 1280, height: 800 },
  },
});
