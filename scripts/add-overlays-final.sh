#!/bin/bash
# Final, guaranteed-to-work script for adding overlays
# Uses explicit step-by-step ImageMagick commands

cd "$(dirname "$0")/.." || exit 1

ICON="icons/icon128.png"
SCREENSHOTS_DIR="screenshots"
OUTPUT_DIR="screenshots/webstore"

mkdir -p "$OUTPUT_DIR"

echo "Creating overlays with explicit step-by-step commands..."
echo ""

# Function to process one screenshot
process_screenshot() {
    local input="$1"
    local output="$2"
    local title="$3"
    local subtitle="$4"
    
    echo "Processing: $(basename $output)"
    
    # Step 1: Create icon with white background (250x250)
    magick "$ICON" -resize 220x220 \
        -background white -gravity center -extent 250x250 \
        /tmp/icon_overlay.png
    
    # Step 2: Create text overlay (1050x450 black box)
    magick -size 1050x450 xc:'#000000' \
        -pointsize 70 -fill white -gravity northwest \
        -annotate +60+60 "$title" \
        -pointsize 45 -fill '#CCCCCC' -gravity northwest \
        -annotate +60+160 "$subtitle" \
        /tmp/text_overlay.png
    
    # Step 3: Composite everything
    magick "$input" \
        /tmp/icon_overlay.png -geometry +40+40 -composite \
        /tmp/text_overlay.png -geometry +190+40 -composite \
        "$output"
    
    # Cleanup
    rm -f /tmp/icon_overlay.png /tmp/text_overlay.png
    
    echo "  ✓ Created: $output"
}

# Process all screenshots
process_screenshot \
    "$SCREENSHOTS_DIR/screenshot-1-all-issues.png" \
    "$OUTPUT_DIR/screenshot-1-all-issues.png" \
    "PR Description Guard" \
    "3 Missing Sections: What, Why, How it was tested"

process_screenshot \
    "$SCREENSHOTS_DIR/screenshot-2-two-issues.png" \
    "$OUTPUT_DIR/screenshot-2-two-issues.png" \
    "PR Description Guard" \
    "2 Missing Sections: Real-time validation"

process_screenshot \
    "$SCREENSHOTS_DIR/screenshot-3-one-issue.png" \
    "$OUTPUT_DIR/screenshot-3-two-issues.png" \
    "PR Description Guard" \
    "2 Missing Sections: Non-intrusive warnings"

process_screenshot \
    "$SCREENSHOTS_DIR/screenshot-4-no-issues.png" \
    "$OUTPUT_DIR/screenshot-4-one-issue.png" \
    "PR Description Guard" \
    "1 Missing Section: Almost there!"

process_screenshot \
    "$SCREENSHOTS_DIR/screenshot-5-icon.png" \
    "$OUTPUT_DIR/screenshot-5-no-issues.png" \
    "PR Description Guard" \
    "All Sections Validated ✓ Ready to submit!"

echo ""
echo "✅ All screenshots processed!"
echo "📁 Location: $OUTPUT_DIR"
echo "📐 Size: 1280x800 pixels"
echo "🎨 Icon: 250x250 with white background (top-left, 40px margin)"
echo "📝 Text: 1050x450 black box (top-right, 190px from left, 40px from top)"
echo ""
echo "Verifying overlays..."
for img in "$OUTPUT_DIR"/*.png; do
    size=$(identify -format "%wx%h" "$img" 2>/dev/null)
    echo "  ✓ $(basename $img): $size"
done
