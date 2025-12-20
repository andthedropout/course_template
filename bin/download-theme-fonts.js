#!/usr/bin/env node

/**
 * Downloads Google Fonts for the selected frontend theme
 *
 * Usage: node bin/download-theme-fonts.js
 *
 * Reads VITE_FRONTEND_THEME env variable, parses theme JSON,
 * downloads fonts from Google Fonts API, and saves to /public/fonts/
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Get theme from environment variable
const themeName = process.env.VITE_FRONTEND_THEME || 'vercel';
const themeJsonPath = path.join(__dirname, '..', 'design-system', 'themes', `${themeName}.json`);

console.log(`📦 Downloading fonts for theme: ${themeName}`);

// Read theme JSON
if (!fs.existsSync(themeJsonPath)) {
  console.error(`❌ Theme file not found: ${themeJsonPath}`);
  process.exit(1);
}

const themeData = JSON.parse(fs.readFileSync(themeJsonPath, 'utf8'));
const fontSans = themeData.cssVars?.theme?.['font-sans'];
const fontMono = themeData.cssVars?.theme?.['font-mono'];

if (!fontSans && !fontMono) {
  console.log('ℹ️  No fonts specified in theme, skipping download');
  process.exit(0);
}

// Extract font family names (remove fallback fonts)
const extractFontName = (fontString) => {
  if (!fontString) return null;
  // "Geist, sans-serif" -> "Geist"
  // "Inter Variable, sans-serif" -> "Inter Variable"
  return fontString.split(',')[0].trim().replace(/['"]/g, '');
};

const fontsToDownload = [
  extractFontName(fontSans),
  extractFontName(fontMono)
].filter(Boolean);

console.log(`🔍 Found fonts: ${fontsToDownload.join(', ')}`);

// Create fonts directory
const fontsDir = path.join(__dirname, '..', 'public', 'fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// Download font from Google Fonts API
const downloadFont = (fontFamily) => {
  return new Promise((resolve, reject) => {
    const encodedFont = encodeURIComponent(fontFamily);
    const googleFontsUrl = `https://fonts.googleapis.com/css2?family=${encodedFont}:wght@400;500;600;700;800;900&display=swap`;

    console.log(`⬇️  Downloading ${fontFamily}...`);

    https.get(googleFontsUrl, (res) => {
      let cssData = '';

      res.on('data', (chunk) => {
        cssData += chunk;
      });

      res.on('end', () => {
        // Parse CSS to extract font URLs
        const fontUrlRegex = /url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g;
        const fontUrls = [...cssData.matchAll(fontUrlRegex)].map(match => match[1]);

        if (fontUrls.length === 0) {
          console.log(`⚠️  No font files found for ${fontFamily}`);
          resolve();
          return;
        }

        console.log(`   Found ${fontUrls.length} font files`);

        // Download each font file
        let downloadedCount = 0;
        const totalFiles = fontUrls.length;

        fontUrls.forEach((url, index) => {
          const fileName = path.basename(url.split('?')[0]);
          const fontFamilyDir = path.join(fontsDir, fontFamily.replace(/\s+/g, '-').toLowerCase());

          if (!fs.existsSync(fontFamilyDir)) {
            fs.mkdirSync(fontFamilyDir, { recursive: true });
          }

          const filePath = path.join(fontFamilyDir, fileName);

          https.get(url, (fontRes) => {
            const fileStream = fs.createWriteStream(filePath);
            fontRes.pipe(fileStream);

            fileStream.on('finish', () => {
              fileStream.close();
              downloadedCount++;

              if (downloadedCount === totalFiles) {
                // Generate CSS file
                const localCss = cssData.replace(
                  /url\(https:\/\/fonts\.gstatic\.com\/([^)]+)\)/g,
                  (match, fontPath) => {
                    const fileName = path.basename(fontPath.split('?')[0]);
                    return `url(/static/fonts/${fontFamily.replace(/\s+/g, '-').toLowerCase()}/${fileName})`;
                  }
                );

                const cssFilePath = path.join(fontFamilyDir, 'font.css');
                fs.writeFileSync(cssFilePath, localCss);

                console.log(`✅ ${fontFamily} downloaded (${totalFiles} files)`);
                resolve();
              }
            });
          }).on('error', (err) => {
            console.error(`❌ Error downloading font file: ${err.message}`);
            reject(err);
          });
        });
      });
    }).on('error', (err) => {
      console.error(`❌ Error fetching Google Fonts CSS: ${err.message}`);
      reject(err);
    });
  });
};

// Download all fonts
(async () => {
  try {
    for (const font of fontsToDownload) {
      await downloadFont(font);
    }
    console.log('✅ All fonts downloaded successfully');
  } catch (error) {
    console.error('❌ Font download failed:', error);
    process.exit(1);
  }
})();
