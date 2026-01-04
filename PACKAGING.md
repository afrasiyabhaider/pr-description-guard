# Chrome Web Store Packaging Guide

## Required Files for Chrome Web Store

Chrome Web Store **ONLY** accepts these files in the extension package:

### ✅ Required Files

1. **manifest.json** - Extension manifest (required)
2. **content.js** - Content script (required)
3. **styles.css** - Stylesheet (required)
4. **icons/** directory with:
   - `icon16.png` (16x16 pixels)
   - `icon48.png` (48x48 pixels)
   - `icon128.png` (128x128 pixels)

### ❌ Files NOT Included

The following files are **NOT** included in the package (Chrome Web Store doesn't need them):

- Source files (`src/`)
- Test files (`tests/`)
- Configuration files (`vite.config.ts`, `tsconfig.json`, `package.json`)
- Documentation files (`.md` files)
- Build tools (`node_modules/`)
- Development files (`.git/`, `.gitignore`)

## Packaging

### Quick Package

```bash
npm run package
```

This will:
1. Build the extension (`npm run build`)
2. Create `pr-description-guard.zip` with only required files
3. Package size: ~6 KB

### Verify Package Contents

```bash
npm run package:verify
```

Or manually:
```bash
unzip -l pr-description-guard.zip
```

### Expected Package Contents

```
Archive:  pr-description-guard.zip
  Length      Date    Time    Name
---------  ---------- -----   ----
     1953  [date]     [time]  styles.css
        0  [date]     [time]  icons/
      323  [date]     [time]  icons/icon16.png
      324  [date]     [time]  icons/icon48.png
     1646  [date]     [time]  icons/icon128.png
      771  [date]     [time]  manifest.json
     4769  [date]     [time]  content.js
---------                     -------
     9786                     7 files
```

## Chrome Web Store Compliance

### ✅ Compliance Checklist

- [x] Only required files included
- [x] No source files
- [x] No test files
- [x] No config files
- [x] No node_modules
- [x] No documentation files
- [x] Valid manifest.json
- [x] All icons present (16, 48, 128)
- [x] Content script present
- [x] Stylesheet present

### Package Size

- **Current:** ~6 KB (compressed)
- **Chrome Web Store Limit:** 10 MB (we're well under)

## Manual Packaging (Alternative)

If you need to package manually:

```bash
# 1. Build the extension
npm run build

# 2. Create zip with only required files
cd dist
zip -r ../pr-description-guard.zip \
  manifest.json \
  content.js \
  styles.css \
  icons/
cd ..
```

## Troubleshooting

### Package Too Large

If package is unexpectedly large:
1. Check for unnecessary files: `unzip -l pr-description-guard.zip`
2. Verify no source files included
3. Verify no node_modules included

### Missing Files

If Chrome Web Store reports missing files:
1. Verify all required files exist in `dist/`
2. Check `manifest.json` references are correct
3. Verify icons are valid PNG files

### Invalid Manifest

If manifest errors occur:
1. Validate JSON: `cat dist/manifest.json | python3 -m json.tool`
2. Check manifest version (must be 3)
3. Verify content script paths match actual files

---

**Package is Chrome Web Store compliant and ready for submission.**
