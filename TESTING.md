# Testing PR Description Guard in Chrome

## Quick Start Guide

### Step 1: Build the Extension

```bash
npm run build
```

This creates all necessary files in the `dist/` directory.

### Step 2: Load Extension in Chrome

1. **Open Chrome Extensions Page**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top-right corner

3. **Load Unpacked Extension**
   - Click "Load unpacked" button
   - Navigate to the project directory
   - **Select the `dist/` folder** (NOT the root project folder)
   - Click "Select Folder"

4. **Verify Extension Loaded**
   - You should see "PR Description Guard" in your extensions list
   - Status should show "Enabled"
   - No error messages should appear

### Step 3: Test on GitHub

1. **Navigate to GitHub PR Page**
   - Go to any GitHub repository
   - Create a new pull request or edit an existing one
   - URL should match: `github.com/*/compare/*` or `github.com/*/pull/*`

2. **Test Validation**
   - Type in the PR description textarea
   - Try an empty description → Should show warning
   - Try description without required sections → Should show warnings
   - Try description with all sections → Warnings should disappear

## Troubleshooting

### Error: "Could not load javascript 'content.js'"

**Possible Causes:**
1. **Wrong directory selected** - Make sure you selected the `dist/` folder, not the root project folder
2. **Build not run** - Run `npm run build` first
3. **File permissions** - Check that `dist/content.js` exists and is readable

**Solution:**
```bash
# Rebuild the extension
npm run build

# Verify files exist
ls -la dist/
# Should show: content.js, manifest.json, styles.css, icons/

# Verify content.js exists
ls -lh dist/content.js
# Should show file size (around 4-5 KB)
```

### Error: "Could not load manifest"

**Possible Causes:**
1. **Invalid JSON** - Manifest has syntax errors
2. **Missing required fields** - Manifest missing required properties
3. **Wrong directory** - Not loading from `dist/` folder

**Solution:**
```bash
# Validate manifest
cat dist/manifest.json | python3 -m json.tool

# Rebuild if needed
npm run build
```

### Extension Not Working on GitHub

**Check:**
1. **Extension is enabled** - Check `chrome://extensions/`
2. **On correct page** - Must be on PR creation/edit page
3. **Console errors** - Open DevTools (F12) → Console tab
4. **Page reload** - Refresh the GitHub page after loading extension

**Debug:**
1. Open Chrome DevTools (F12)
2. Go to Console tab
3. Look for `[PR Guard]` messages
4. Check for any JavaScript errors

### Extension Icon Not Showing

**Solution:**
```bash
# Verify icons exist
ls -la dist/icons/
# Should show: icon16.png, icon48.png, icon128.png

# Rebuild if icons missing
npm run build
```

## Development Workflow

### Watch Mode (Auto-rebuild)

```bash
npm run dev
```

This watches for file changes and automatically rebuilds.

### Manual Rebuild

```bash
npm run build
```

After rebuilding, reload the extension in Chrome:
1. Go to `chrome://extensions/`
2. Find "PR Description Guard"
3. Click the refresh icon (🔄)

## File Structure

```
dist/
├── content.js      # Main content script (required)
├── styles.css      # Warning styles (required)
├── manifest.json   # Extension manifest (required)
└── icons/
    ├── icon16.png  # 16x16 icon (required)
    ├── icon48.png  # 48x48 icon (required)
    └── icon128.png # 128x128 icon (required)
```

## Testing Checklist

- [ ] Extension loads without errors
- [ ] Icon appears in extensions list
- [ ] Extension works on GitHub PR pages
- [ ] Validation shows warnings for empty description
- [ ] Validation shows warnings for missing sections
- [ ] Warnings disappear when all sections present
- [ ] Dark mode styling works
- [ ] No console errors
- [ ] Extension doesn't break GitHub functionality

## Common Issues

### Issue: Extension loads but doesn't work

**Check:**
- Are you on a GitHub PR page? (URL must match patterns in manifest)
- Is the textarea present? (Extension waits for it to load)
- Check browser console for errors

### Issue: Warnings not showing

**Check:**
- Description field is found (check console for `[PR Guard]` messages)
- Validation is running (type in textarea, wait 300ms)
- CSS is loading (check if styles are applied)

### Issue: Multiple warnings appear

**Solution:**
- This is normal if multiple sections are missing
- Each missing section shows as a separate warning item

## Getting Help

If you encounter issues:
1. Check browser console for errors
2. Verify all files are in `dist/` directory
3. Ensure you're loading from `dist/` folder (not root)
4. Try rebuilding: `npm run build`
5. Reload extension in Chrome
