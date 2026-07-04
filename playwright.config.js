// Playwright configuration — serves the static app and runs the e2e smoke suite.
// @ts-check
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:8080',
    headless: true
  },
  webServer: {
    // Any static server works; python3 ships on the CI runner.
    command: 'python3 -m http.server 8080 --directory software-architect-academy',
    url: 'http://localhost:8080',
    reuseExistingServer: true,
    timeout: 30000
  }
});
