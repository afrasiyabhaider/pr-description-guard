#!/bin/bash
# Process screenshots for Chrome Web Store (1280x800)

cd "$(dirname "$0")/../screenshots" || exit 1

# Process each screenshot
magick "Screenshot 2026-01-04 at 1.37.10 PM.png" -resize '1280x800>' -gravity center -extent 1280x800 -quality 95 "screenshot-1-all-issues.png"
magick "Screenshot 2026-01-04 at 1.37.19 PM.png" -resize '1280x800>' -gravity center -extent 1280x800 -quality 95 "screenshot-2-two-issues.png"
magick "Screenshot 2026-01-04 at 1.37.43 PM.png" -resize '1280x800>' -gravity center -extent 1280x800 -quality 95 "screenshot-3-one-issue.png"
magick "Screenshot 2026-01-04 at 1.37.53 PM.png" -resize '1280x800>' -gravity center -extent 1280x800 -quality 95 "screenshot-4-no-issues.png"
magick "Screenshot 2026-01-04 at 1.41.22 PM.png" -resize '1280x800>' -gravity center -extent 1280x800 -quality 95 "screenshot-5-icon.png"

echo "✅ All screenshots processed"
