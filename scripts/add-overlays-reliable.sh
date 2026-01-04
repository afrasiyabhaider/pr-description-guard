#!/bin/bash
# Add icon and description to screenshots - RELIABLE VERSION
# Uses simple, direct ImageMagick commands

cd "$(dirname "$0")/.." || exit 1

ICON="icons/icon128.png"
SCREENSHOTS_DIR="screenshots"
OUTPUT_DIR="screenshots/webstore"

mkdir -p "$OUTPUT_DIR"

echo "Processing screenshots with icon and text overlays..."

# Function to add icon and text - SIMPLE AND RELIABLE
add_overlay() {
    local input="$1"
    local output="$2"
    local title="$3"
    local subtitle="$4"
    
    echo "Processing: $output"
    
    # Step 1: Add icon to top-left (180x180, very visible with white background)
    magick "$input" \
        \( "$ICON" -resize 180x180 -background white -alpha remove -alpha off \) \
        -gravity northwest -geometry +50+50 -composite \
        /tmp/step1_$$.png
    
    # Step 2: Create text overlay as separate image with SOLID BLACK background
    magick -size 900x320 xc:'#000000' \
        -fill white -pointsize 52 \
        -gravity northwest -annotate +50+50 "$title" \
        -fill '#cccccc' -pointsize 36 \
        -gravity northwest -annotate +50+120 "$subtitle" \
        -bordercolor '#000000' -border 50 \
        /tmp/text_$$.png
    
    # Step 3: Composite text overlay to top-right
    magick /tmp/step1_$$.png \
        /tmp/text_$$.png \
        -gravity northeast -geometry +60+60 -composite \
        "$output"
    
    # Cleanup
    rm -f /tmp/step1_$$.png /tmp/text_$$.png
    
    echo "  ✓ Created: $output"
}

# Process all screenshots
add_overlay \
    "$SCREENSHOTS_DIR/screenshot-1-all-issues.png" \
    "$OUTPUT_DIR/screenshot-1-all-issues.png" \
    "PR Description Guard" \
    "3 Missing Sections: What, Why, How it was tested"

add_overlay \
    "$SCREENSHOTS_DIR/screenshot-2-two-issues.png" \
    "$OUTPUT_DIR/screenshot-2-two-issues.png" \
    "PR Description Guard" \
    "2 Missing Sections: Real-time validation"

add_overlay \
    "$SCREENSHOTS_DIR/screenshot-3-one-issue.png" \
    "$OUTPUT_DIR/screenshot-3-two-issues.png" \
    "PR Description Guard" \
    "2 Missing Sections: Non-intrusive warnings"

add_overlay \
    "$SCREENSHOTS_DIR/screenshot-4-no-issues.png" \
    "$OUTPUT_DIR/screenshot-4-one-issue.png" \
    "PR Description Guard" \
    "1 Missing Section: Almost there!"

add_overlay \
    "$SCREENSHOTS_DIR/screenshot-5-icon.png" \
    "$OUTPUT_DIR/screenshot-5-no-issues.png" \
    "PR Description Guard" \
    "All Sections Validated ✓ Ready to submit!"

echo ""
echo "✅ All screenshots processed!"
echo "📁 Output directory: $OUTPUT_DIR"
echo "📐 Size: 1280x800 (Chrome Web Store requirement)"
echo "🎨 Icon: 150x150 in top-left"
echo "📝 Text: Dark background with white text in top-right"
