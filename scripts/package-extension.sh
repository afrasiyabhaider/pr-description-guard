#!/bin/bash
# Package extension for Chrome Web Store submission
# Only includes files required by Chrome Web Store

set -e

echo "📦 Packaging extension for Chrome Web Store..."

# Build the extension
npm run build

# Verify required files exist
REQUIRED_FILES=(
  "dist/manifest.json"
  "dist/content.js"
  "dist/styles.css"
  "dist/icons/icon16.png"
  "dist/icons/icon48.png"
  "dist/icons/icon128.png"
)

echo "✅ Verifying required files..."
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ Error: Required file missing: $file"
    exit 1
  fi
done

# Remove old zip if exists
if [ -f "pr-description-guard.zip" ]; then
  rm pr-description-guard.zip
  echo "🗑️  Removed old package"
fi

# Create zip with only necessary files
cd dist
zip -r ../pr-description-guard.zip \
  manifest.json \
  content.js \
  styles.css \
  icons/

cd ..

# Verify zip contents
echo ""
echo "📋 Package contents:"
unzip -l pr-description-guard.zip | grep -E "\.(js|json|css|png)$|manifest|icons"

echo ""
echo "✅ Package created: pr-description-guard.zip"
echo "📊 Package size: $(du -h pr-description-guard.zip | cut -f1)"
echo ""
echo "✅ Chrome Web Store compliant - only necessary files included"
