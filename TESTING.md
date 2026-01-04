# Testing Guide for PR Description Guard

## Test Scenarios

### 1. PR Creation Page (New PR)
**Steps:**
1. Navigate to a repository on GitHub
2. Click "New Pull Request" or go to `/compare` page
3. Select branches to compare
4. **Expected:** Warning should appear immediately if description is empty or missing sections

**Test Cases:**
- [ ] Empty description → Shows "Description must not be empty" error
- [ ] Description with only "## What" → Shows missing "What changed", "Why", "Tested"
- [ ] Description with "## What changed" only → Shows missing "Why" and "Tested"
- [ ] Description with all 3 sections → No warning (or warning removed)

---

### 2. SPA Navigation (Clicking "Create Pull Request")
**Steps:**
1. Navigate to a repository
2. Click "New Pull Request" or go to `/compare` page
3. Select branches
4. Click "Create pull request" button (without refreshing)
5. **Expected:** Warning should appear immediately on the new PR page

**Test Cases:**
- [ ] Navigate via SPA (no page refresh) → Extension initializes correctly
- [ ] Warning appears within 1-2 seconds of navigation
- [ ] Real-time validation works as you type
- [ ] Event listeners are attached correctly

**Known Issue (FIXED):**
- Previously: Extension only worked on page refresh, not SPA navigation
- Now: Extension detects SPA navigation via:
  - History API interception (pushState/replaceState)
  - Turbo/PJAX event listeners
  - Main content replacement detection
  - Faster interval checking (1s instead of 2s)

---

### 3. Existing PR View (Read-Only)
**Steps:**
1. Navigate to an existing PR (e.g., `/pull/123`)
2. **Expected:** Extension validates the rendered description

**Test Cases:**
- [ ] PR with no description → Shows all 3 missing sections
- [ ] PR with description but missing sections → Shows missing sections
- [ ] PR with all sections → No warning
- [ ] Warning appears near the description (not in comment area)

---

### 4. Existing PR Edit Mode
**Steps:**
1. Navigate to an existing PR
2. Click "Edit" on the PR description
3. **Expected:** Extension validates the textarea as you type

**Test Cases:**
- [ ] Click "Edit" → Textarea appears, extension initializes
- [ ] Type in textarea → Real-time validation works
- [ ] Warning updates as you type
- [ ] Only validates description, not comment fields

---

### 5. Real-Time Validation
**Steps:**
1. Open PR creation or edit page
2. Type in the description field
3. **Expected:** Warning updates in real-time (300ms debounce)

**Test Cases:**
- [ ] Type "## What" → Still shows missing sections (needs "What changed")
- [ ] Type "## What changed" → "What" error removed, "Why" and "Tested" still shown
- [ ] Type all 3 sections → Warning disappears
- [ ] Paste content → Validation triggers
- [ ] Delete content → Validation updates

---

### 6. Multiple Tabs
**Steps:**
1. Open PR page in Tab 1
2. Open different PR page in Tab 2
3. **Expected:** Each tab works independently

**Test Cases:**
- [ ] Tab 1 shows correct validation
- [ ] Tab 2 shows correct validation
- [ ] No interference between tabs

---

### 7. Navigation Between Pages
**Steps:**
1. Navigate from PR page to non-PR page
2. Navigate back to PR page
3. **Expected:** Extension cleans up and re-initializes correctly

**Test Cases:**
- [ ] Leave PR page → Extension cleans up (no warnings on other pages)
- [ ] Return to PR page → Extension re-initializes
- [ ] No memory leaks or duplicate listeners

---

### 8. GitHub Template Handling
**Steps:**
1. Open PR creation page with a template
2. Template contains HTML comments (`<!-- -->`)
3. **Expected:** HTML comments are cleaned before validation

**Test Cases:**
- [ ] Template with only HTML comments → Shows "empty" error
- [ ] Template with content outside comments → Validates content
- [ ] Template with sections in comments → Shows missing sections (comments ignored)

---

### 9. Edge Cases
**Test Cases:**
- [ ] Very long description → Validation still works
- [ ] Special characters in description → Validation works
- [ ] Markdown formatting → Validation works (looks for headers)
- [ ] Multiple sections of same type → Validation works (finds first match)
- [ ] Case variations ("What Changed" vs "what changed") → Validation works (case-insensitive)

---

### 10. Browser Console (Debug Mode)
**Steps:**
1. Open browser console (F12)
2. Navigate to PR page
3. Look for `[PR Guard]` messages

**Expected Logs:**
- `[PR Guard] Navigation detected: /old/path → /new/path`
- `[PR Guard] Initializing after SPA navigation to: /compare/...`
- `[PR Guard] Event listeners attached to textarea`
- `[PR Guard] Running initial validation, textarea value length: X`
- `[PR Guard] Validation result: INVALID (3 errors)`

**If logs show errors:**
- Check if textarea is found
- Check if event listeners are attached
- Check if validation is running

---

## Common Issues and Solutions

### Issue: Warning doesn't appear on SPA navigation
**Solution:** Fixed in latest version
- History API interception added
- Multiple SPA event listeners added
- Faster interval checking (1s)
- Main content replacement detection

### Issue: Real-time validation not working
**Solution:** 
- Check console for event listener attachment
- Verify textarea is found
- Check if GitHub replaced the textarea (re-initialization should handle this)

### Issue: Warning appears in wrong place
**Solution:**
- Extension should only target PR description, not comment fields
- Check selectors in `dom.ts`
- Verify exclusion of comment forms

---

## Automated Tests

The project includes comprehensive automated tests covering most scenarios:

### Running Tests

```bash
# Run all tests
npm test

# Run tests once (CI mode)
npm run test:run

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

### Test Coverage

**Test Files:**
- `tests/validator.test.ts` - Core validation logic (29 tests)
- `tests/dom.test.ts` - DOM utilities (15 tests)
- `tests/spa-navigation.test.ts` - SPA navigation detection (7 tests)
- `tests/realtime-validation.test.ts` - Real-time validation (12 tests)
- `tests/template-handling.test.ts` - GitHub template handling (6 tests)
- `tests/edge-cases.test.ts` - Edge cases and variations (25 tests)

**Total: 94 automated tests**

### What's Tested

✅ **Validation Logic:**
- Empty description detection
- Section detection (What, Why, Tested)
- Case insensitivity
- Punctuation variations
- Markdown format variations
- HTML comment cleaning

✅ **DOM Utilities:**
- Textarea selection
- Rendered description extraction
- PR page detection
- Comment form exclusion

✅ **SPA Navigation:**
- History API interception
- Event listener attachment
- Navigation detection

✅ **Real-Time Validation:**
- Event listener attachment
- Input/paste event handling
- Validation updates

✅ **Edge Cases:**
- Special characters
- Long descriptions
- Whitespace handling
- Multiple sections
- Negative cases

### Manual Testing Required

Some scenarios require manual testing on real GitHub:
- Full SPA navigation flow (clicking "Create pull request")
- Real GitHub DOM structure variations
- Multiple tabs behavior
- Dark/light mode
- Browser-specific behavior

---

## Test Checklist

Before submitting:
- [x] All automated tests pass (94/94)
- [ ] Manual SPA navigation test (clicking "Create pull request")
- [ ] Real-time validation works on real GitHub
- [ ] Works on both new PR and existing PR pages
- [ ] No console errors
- [ ] No memory leaks
- [ ] Works in dark mode
- [ ] Works in light mode
- [ ] Extension doesn't break GitHub functionality
