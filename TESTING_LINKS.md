# Testing Links for PR Description Guard

## 🧪 Quick Test Links

### Your Own Repository (Best for Testing)
Create a test PR in your own repository:
```
https://github.com/afrasiyabhaider/pr-description-guard/compare/main...v1.0.0
```

Or create a new PR:
```
https://github.com/afrasiyabhaider/pr-description-guard/pull/new/main
```

---

## 📋 Public GitHub Repositories with Open PRs

### Popular Open Source Projects

1. **VS Code**
   - PR List: https://github.com/microsoft/vscode/pulls
   - Create PR: https://github.com/microsoft/vscode/compare

2. **React**
   - PR List: https://github.com/facebook/react/pulls
   - Create PR: https://github.com/facebook/react/compare

3. **Next.js**
   - PR List: https://github.com/vercel/next.js/pulls
   - Create PR: https://github.com/vercel/next.js/compare

4. **Tailwind CSS**
   - PR List: https://github.com/tailwindlabs/tailwindcss/pulls
   - Create PR: https://github.com/tailwindlabs/tailwindcss/compare

5. **TypeScript**
   - PR List: https://github.com/microsoft/TypeScript/pulls
   - Create PR: https://github.com/microsoft/TypeScript/compare

6. **Node.js**
   - PR List: https://github.com/nodejs/node/pulls
   - Create PR: https://github.com/nodejs/node/compare

---

## 🎯 Testing Scenarios

### Scenario 1: Empty Description
1. Go to any PR creation page
2. Leave description empty
3. **Expected:** Warning shows "Description must not be empty" + 3 missing sections

### Scenario 2: Missing All Sections
1. Add some text but no sections
2. **Expected:** Warning shows all 3 missing sections

### Scenario 3: Missing Two Sections
1. Add "## What changed" section only
2. **Expected:** Warning shows 2 missing sections (Why, How it was tested)

### Scenario 4: Missing One Section
1. Add "## What changed" and "## Why" sections
2. **Expected:** Warning shows 1 missing section (How it was tested)

### Scenario 5: All Sections Present
1. Add all three sections:
   ```
   ## What changed
   ...
   
   ## Why
   ...
   
   ## How it was tested
   ...
   ```
2. **Expected:** No warning displayed

### Scenario 6: Case Variations
Test different case variations:
- `## What changed` ✅
- `## What's changed` ✅
- `## What Changed` ✅
- `## Why` ✅
- `## How it was tested` ✅
- `## How was it tested` ✅

### Scenario 7: With HTML Comments (Templates)
1. Add PR template with HTML comments
2. **Expected:** HTML comments are ignored, validation works correctly

### Scenario 8: Dark Mode
1. Switch GitHub to dark mode
2. **Expected:** Warning styling adapts to dark mode

### Scenario 9: SPA Navigation
1. Navigate between PR pages
2. **Expected:** Extension reinitializes correctly on navigation

---

## 🔧 How to Test

### Step 1: Load Extension
1. Open Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder

### Step 2: Test on GitHub
1. Go to any GitHub PR creation page
2. Open browser console (F12) to see any errors
3. Test different scenarios above

### Step 3: Verify Functionality
- ✅ Warning appears when sections are missing
- ✅ Warning disappears when all sections are present
- ✅ Real-time validation as you type
- ✅ Dark mode support works
- ✅ No console errors

---

## 📝 Test Checklist

- [ ] Extension loads without errors
- [ ] Warning appears for empty description
- [ ] Warning shows correct number of missing sections
- [ ] Warning disappears when all sections are present
- [ ] Real-time validation works (debounced)
- [ ] Dark mode styling works
- [ ] SPA navigation works (no duplicate warnings)
- [ ] No console errors
- [ ] Works on different GitHub PR pages
- [ ] HTML comments in templates are ignored

---

## 🐛 Debugging

If something doesn't work:

1. **Check Console:**
   - Open DevTools (F12)
   - Look for errors in Console tab
   - Check if content script is loaded

2. **Check Extension:**
   - Go to `chrome://extensions/`
   - Verify extension is enabled
   - Check for errors

3. **Check Page:**
   - Verify you're on a PR creation page
   - URL should match: `*://github.com/*/compare/*` or `*://github.com/*/pull/new/*`

4. **Reload:**
   - Reload the extension
   - Reload the GitHub page
   - Clear browser cache if needed

---

## 💡 Tips

- **Best Testing:** Use your own repository to create test PRs
- **Multiple Tabs:** Test with multiple GitHub tabs open
- **Different Browsers:** Test in Chrome, Edge (Chromium)
- **Different GitHub Pages:** Test on different repository PR pages
- **Edge Cases:** Test with very long descriptions, special characters, etc.

---

**Happy Testing! 🚀**
