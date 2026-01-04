#!/bin/bash
# Add icon and description to screenshots for Chrome Web Store

cd "$(dirname "$0")/.." || exit 1

ICON="icons/icon128.png"
SCREENSHOTS_DIR="screenshots"
OUTPUT_DIR="screenshots/webstore"

mkdir -p "$OUTPUT_DIR"

# Function to add icon and text to screenshot
add_overlay() {
    local input="$1"
    local output="$2"
    local title="$3"
    local subtitle="$4"
    
    # Create overlay with icon and text - using more visible settings
    magick "$input" \
        \( "$ICON" -resize 120x120 \) \
        -gravity northwest -geometry +40+40 -composite \
        \( -size 650x200 xc:'rgba(0,0,0,0.9)' \
           -font Helvetica-Bold -pointsize 40 -fill white \
           -gravity northwest -annotate +25+25 "$title" \
           -font Helvetica -pointsize 24 -fill '#F5F5F5' \
           -gravity northwest -annotate +25+80 "$subtitle" \
           -bordercolor 'rgba(0,0,0,0.9)' -border 20 \
        \) -gravity northeast -geometry +40+40 -composite \
        "$output"
}

# Screenshot 1: All issues (3 missing sections)
add_overlay \
    "$SCREENSHOTS_DIR/screenshot-1-all-issues.png" \
    "$OUTPUT_DIR/screenshot-1-all-issues.png" \
    "PR Description Guard" \
    "3 Missing Sections: What, Why, How it was tested"

# Screenshot 2: Two issues (renamed from "all issues")
add_overlay \
    "$SCREENSHOTS_DIR/screenshot-2-two-issues.png" \
    "$OUTPUT_DIR/screenshot-2-two-issues.png" \
    "PR Description Guard" \
    "2 Missing Sections: Real-time validation"

# Screenshot 3: Two issues
add_overlay \
    "$SCREENSHOTS_DIR/screenshot-3-one-issue.png" \
    "$OUTPUT_DIR/screenshot-3-two-issues.png" \
    "PR Description Guard" \
    "2 Missing Sections: Non-intrusive warnings"

# Screenshot 4: One issue
add_overlay \
    "$SCREENSHOTS_DIR/screenshot-4-no-issues.png" \
    "$OUTPUT_DIR/screenshot-4-one-issue.png" \
    "PR Description Guard" \
    "1 Missing Section: Almost there!"

# Screenshot 5: No issues
add_overlay \
    "$SCREENSHOTS_DIR/screenshot-5-icon.png" \
    "$OUTPUT_DIR/screenshot-5-no-issues.png" \
    "PR Description Guard" \
    "All Sections Validated ✓ Ready to submit!"

echo "✅ All screenshots processed with icon and description"
