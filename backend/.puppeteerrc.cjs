const { join } = require('path');

/**
 * Store Chromium inside the project (.cache/puppeteer) instead of the user
 * home dir. On Render the build and runtime share the project directory, so
 * this guarantees the browser downloaded at build time is found at runtime.
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
