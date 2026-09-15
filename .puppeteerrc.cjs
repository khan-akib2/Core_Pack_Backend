const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache directory for Puppeteer.
  // By placing this inside the backend directory, Render will include the downloaded
  // Chromium browser in the deployment slug instead of discarding it after the build.
  cacheDirectory: join(__dirname, '.cache', 'puppeteer'),
};
