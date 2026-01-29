/**
 * Simple .env.local loader for examples
 * Reads CONVEX_URL from .env.local if not set in environment
 */

const fs = require('fs');
const path = require('path');

function loadConvexUrl() {
  // If already set in environment, use that
  if (process.env.CONVEX_URL) {
    return process.env.CONVEX_URL;
  }

  // Try to read from .env.local
  const envPath = path.join(__dirname, '../../.env.local');

  try {
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/CONVEX_URL=(.+)/);

      if (match && match[1]) {
        const url = match[1].trim();
        console.log(`Loaded CONVEX_URL from .env.local: ${url}`);
        return url;
      }
    }
  } catch (error) {
    // Ignore errors reading .env.local
  }

  // Default fallback
  return 'http://127.0.0.1:3210';
}

module.exports = { loadConvexUrl };
