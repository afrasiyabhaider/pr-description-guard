#!/usr/bin/env python3
"""
Add icon and text overlays to screenshots using Python PIL
More reliable than ImageMagick for text rendering
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys

def get_font(size):
    """Try to load a system font"""
    font_paths = [
        '/System/Library/Fonts/Helvetica.ttc',
        '/System/Library/Fonts/Arial.ttf',
        '/System/Library/Fonts/HelveticaNeue.ttc',
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except:
                continue
    return ImageFont.load_default()

def add_overlay(input_path, output_path, title, subtitle):
    """Add icon and text overlay to screenshot"""
    print(f"Processing: {output_path}")
    
    # Load base screenshot
    base = Image.open(input_path)
    if base.mode != 'RGB':
        base = base.convert('RGB')
    
    # Load and resize icon (200x200 with white background)
    icon = Image.open('icons/icon128.png')
    icon = icon.resize((200, 200), Image.Resampling.LANCZOS)
    
    # Create white background for icon
    icon_bg = Image.new('RGB', (200, 200), (255, 255, 255))
    if icon.mode == 'RGBA':
        icon_bg.paste(icon, mask=icon.split()[3])
    else:
        icon_bg.paste(icon)
    
    # Create text overlay (black background, white text)
    text_img = Image.new('RGB', (1000, 380), color='black')
    draw = ImageDraw.Draw(text_img)
    
    # Load fonts
    title_font = get_font(64)
    subtitle_font = get_font(42)
    
    # Draw text
    draw.text((60, 60), title, fill='white', font=title_font)
    draw.text((60, 180), subtitle, fill='#e0e0e0', font=subtitle_font)
    
    # Paste icon on base (top-left, 50px margin)
    base.paste(icon_bg, (50, 50))
    
    # Paste text overlay (top-right, 50px margin)
    text_x = base.width - text_img.width - 50
    base.paste(text_img, (text_x, 50))
    
    # Save
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    base.save(output_path, 'PNG', quality=95, optimize=True)
    print(f"  ✓ Created: {output_path}")

def main():
    screenshots = [
        ('screenshots/screenshot-1-all-issues.png', 'screenshots/webstore/screenshot-1-all-issues.png',
         'PR Description Guard', '3 Missing Sections: What, Why, How it was tested'),
        ('screenshots/screenshot-2-two-issues.png', 'screenshots/webstore/screenshot-2-two-issues.png',
         'PR Description Guard', '2 Missing Sections: Real-time validation'),
        ('screenshots/screenshot-3-one-issue.png', 'screenshots/webstore/screenshot-3-two-issues.png',
         'PR Description Guard', '2 Missing Sections: Non-intrusive warnings'),
        ('screenshots/screenshot-4-no-issues.png', 'screenshots/webstore/screenshot-4-one-issue.png',
         'PR Description Guard', '1 Missing Section: Almost there!'),
        ('screenshots/screenshot-5-icon.png', 'screenshots/webstore/screenshot-5-no-issues.png',
         'PR Description Guard', 'All Sections Validated ✓ Ready to submit!'),
    ]
    
    print("Processing screenshots with Python PIL...")
    print("=" * 60)
    
    for input_path, output_path, title, subtitle in screenshots:
        if os.path.exists(input_path):
            add_overlay(input_path, output_path, title, subtitle)
        else:
            print(f"⚠️  Skipping: {input_path} (not found)")
    
    print("=" * 60)
    print("✅ All screenshots processed!")
    print("📁 Output directory: screenshots/webstore")
    print("📐 Size: 1280x800 (Chrome Web Store requirement)")
    print("🎨 Icon: 200x200 with white background (top-left)")
    print("📝 Text: Black box with white text (top-right)")

if __name__ == '__main__':
    main()
