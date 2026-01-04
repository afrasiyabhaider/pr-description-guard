#!/bin/bash
# Process original screenshots for Chrome Web Store
# Resize to 1280x800 and add icon + description overlays

cd "$(dirname "$0")/.." || exit 1

ICON="icons/icon128.png"
SCREENSHOTS_DIR="screenshots"
OUTPUT_DIR="screenshots/webstore"

mkdir -p "$OUTPUT_DIR"

echo "Processing screenshots for Chrome Web Store..."
echo "=============================================="
echo ""

# Function to process screenshot
process_screenshot() {
    local input="$1"
    local output="$2"
    local title="$3"
    local subtitle="$4"
    
    echo "Processing: $(basename $input)"
    
    # Step 1: Resize to 1280x800 (Chrome Web Store requirement)
    magick "$input" -resize '1280x800>' -gravity center -extent 1280x800 \
        -quality 95 /tmp/resized.png
    
    # Step 2: Create icon overlay (250x250 with white background)
    magick "$ICON" -resize 220x220 \
        -background white -gravity center -extent 250x250 \
        /tmp/icon_overlay.png
    
    # Step 3: Create text overlay (1100x500 black box with white text)
    magick -size 1100x500 xc:'#000000' \
        -pointsize 72 -fill white -gravity northwest \
        -annotate +70+70 "$title" \
        -pointsize 48 -fill '#E0E0E0' -gravity northwest \
        -annotate +70+180 "$subtitle" \
        /tmp/text_overlay.png
    
    # Step 4: Composite everything
    magick /tmp/resized.png \
        /tmp/icon_overlay.png -geometry +50+50 -composite \
        /tmp/text_overlay.png -geometry +130+50 -composite \
        -quality 95 "$output"
    
    # Cleanup
    rm -f /tmp/resized.png /tmp/icon_overlay.png /tmp/text_overlay.png
    
    echo "  ✓ Created: $output"
    echo ""
}

# Process screenshots based on user's description:
# 1 = All issues (3 missing)
# 2 = All issues (3 missing) - "named all issues"
# 3 = 2 issues
# 4 = 1 issue  
# 5 = No issues

# Use find to get exact filenames
SCREENSHOT1=$(find "$SCREENSHOTS_DIR" -name "*1.37.10*" -type f | head -1)
SCREENSHOT2=$(find "$SCREENSHOTS_DIR" -name "*1.37.19*" -type f | head -1)
SCREENSHOT3=$(find "$SCREENSHOTS_DIR" -name "*1.37.43*" -type f | head -1)
SCREENSHOT4=$(find "$SCREENSHOTS_DIR" -name "*1.37.53*" -type f | head -1)
SCREENSHOT5=$(find "$SCREENSHOTS_DIR" -name "*1.41.22*" -type f | head -1)

process_screenshot \
    "$SCREENSHOT1" \
    "$OUTPUT_DIR/screenshot-1-all-issues.png" \
    "PR Description Guard" \
    "3 Missing Sections: What changed, Why, How it was tested"

process_screenshot \
    "$SCREENSHOT2" \
    "$OUTPUT_DIR/screenshot-2-all-issues.png" \
    "PR Description Guard" \
    "3 Missing Sections: What changed, Why, How it was tested"

process_screenshot \
    "$SCREENSHOT3" \
    "$OUTPUT_DIR/screenshot-3-two-issues.png" \
    "PR Description Guard" \
    "2 Missing Sections: Real-time validation as you type"

process_screenshot \
    "$SCREENSHOT4" \
    "$OUTPUT_DIR/screenshot-4-one-issue.png" \
    "PR Description Guard" \
    "1 Missing Section: Almost there!"

process_screenshot \
    "$SCREENSHOT5" \
    "$OUTPUT_DIR/screenshot-5-no-issues.png" \
    "PR Description Guard" \
    "All Sections Validated ✓ Ready to submit!"

echo "=============================================="
echo "✅ All screenshots processed!"
echo ""
echo "📁 Output directory: $OUTPUT_DIR"
echo "📐 Size: 1280x800 pixels (Chrome Web Store requirement)"
echo "🎨 Icon: 250x250 with white background (top-left, 50px margin)"
echo "📝 Text: 1100x500 black box with white text (top-right, 130px from left)"
echo "✨ Quality: 95% (high quality)"
echo ""
echo "Screenshots ready for Chrome Web Store submission!"
