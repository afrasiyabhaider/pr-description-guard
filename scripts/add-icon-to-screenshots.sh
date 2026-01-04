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
    
    # Create overlay with icon and text
    magick "$input" \
        \( "$ICON" -resize 96x96 -background none \) \
        -gravity northwest -geometry +30+30 -composite \
        \( -size 500x150 xc:'rgba(0,0,0,0.7)' \
           -font Arial-Bold -pointsize 28 -fill white \
           -gravity northwest -annotate +15+15 "$title" \
           -font Arial -pointsize 18 -fill '#E0E0E0' \
           -gravity northwest -annotate +15+50 "$subtitle" \
           -bordercolor none -border 10 \
        \) -gravity northeast -geometry +30+30 -composite \
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
