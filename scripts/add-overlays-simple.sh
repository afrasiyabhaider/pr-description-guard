#!/bin/bash
# Simple, direct ImageMagick script for adding overlays
# Uses basic commands that are guaranteed to work

cd "$(dirname "$0")/.." || exit 1

ICON="icons/icon128.png"
SCREENSHOTS_DIR="screenshots"
OUTPUT_DIR="screenshots/webstore"

mkdir -p "$OUTPUT_DIR"

echo "Adding icon and text overlays to screenshots..."
echo ""

# Screenshot 1: All issues
magick "$SCREENSHOTS_DIR/screenshot-1-all-issues.png" \
  \( "$ICON" -resize 200x200 -background white -flatten \) \
  -gravity northwest -geometry +50+50 -composite \
  \( -size 1000x400 xc:black \
     -fill white -pointsize 60 -gravity northwest -annotate +50+50 "PR Description Guard" \
     -fill '#cccccc' -pointsize 40 -gravity northwest -annotate +50+150 "3 Missing Sections: What, Why, How it was tested" \
  \) -gravity northeast -geometry +50+50 -composite \
  "$OUTPUT_DIR/screenshot-1-all-issues.png"
echo "✓ screenshot-1-all-issues.png"

# Screenshot 2: Two issues
magick "$SCREENSHOTS_DIR/screenshot-2-two-issues.png" \
  \( "$ICON" -resize 200x200 -background white -flatten \) \
  -gravity northwest -geometry +50+50 -composite \
  \( -size 1000x400 xc:black \
     -fill white -pointsize 60 -gravity northwest -annotate +50+50 "PR Description Guard" \
     -fill '#cccccc' -pointsize 40 -gravity northwest -annotate +50+150 "2 Missing Sections: Real-time validation" \
  \) -gravity northeast -geometry +50+50 -composite \
  "$OUTPUT_DIR/screenshot-2-two-issues.png"
echo "✓ screenshot-2-two-issues.png"

# Screenshot 3: Two issues
magick "$SCREENSHOTS_DIR/screenshot-3-one-issue.png" \
  \( "$ICON" -resize 200x200 -background white -flatten \) \
  -gravity northwest -geometry +50+50 -composite \
  \( -size 1000x400 xc:black \
     -fill white -pointsize 60 -gravity northwest -annotate +50+50 "PR Description Guard" \
     -fill '#cccccc' -pointsize 40 -gravity northwest -annotate +50+150 "2 Missing Sections: Non-intrusive warnings" \
  \) -gravity northeast -geometry +50+50 -composite \
  "$OUTPUT_DIR/screenshot-3-two-issues.png"
echo "✓ screenshot-3-two-issues.png"

# Screenshot 4: One issue
magick "$SCREENSHOTS_DIR/screenshot-4-no-issues.png" \
  \( "$ICON" -resize 200x200 -background white -flatten \) \
  -gravity northwest -geometry +50+50 -composite \
  \( -size 1000x400 xc:black \
     -fill white -pointsize 60 -gravity northwest -annotate +50+50 "PR Description Guard" \
     -fill '#cccccc' -pointsize 40 -gravity northwest -annotate +50+150 "1 Missing Section: Almost there!" \
  \) -gravity northeast -geometry +50+50 -composite \
  "$OUTPUT_DIR/screenshot-4-one-issue.png"
echo "✓ screenshot-4-one-issue.png"

# Screenshot 5: No issues
magick "$SCREENSHOTS_DIR/screenshot-5-icon.png" \
  \( "$ICON" -resize 200x200 -background white -flatten \) \
  -gravity northwest -geometry +50+50 -composite \
  \( -size 1000x400 xc:black \
     -fill white -pointsize 60 -gravity northwest -annotate +50+50 "PR Description Guard" \
     -fill '#cccccc' -pointsize 40 -gravity northwest -annotate +50+150 "All Sections Validated ✓ Ready to submit!" \
  \) -gravity northeast -geometry +50+50 -composite \
  "$OUTPUT_DIR/screenshot-5-no-issues.png"
echo "✓ screenshot-5-no-issues.png"

echo ""
echo "✅ All screenshots processed!"
echo "📁 Location: $OUTPUT_DIR"
echo "📐 Size: 1280x800 pixels"
echo "🎨 Icon: 200x200 with white background (top-left)"
echo "📝 Text: Black box with white text (top-right)"
