# Chrome Web Store Submission Guide

## 📦 Package Information

**Zip File:** `pr-description-guard.zip`  
**Version:** 1.0.0  
**Created:** Ready for submission

### Package Contents
- `manifest.json` - Extension manifest (Manifest V3)
- `content.js` - Main content script
- `styles.css` - Extension styles
- `icons/` - Extension icons (16x16, 48x48, 128x128)

---

## 🎯 Chrome Web Store Listing Details

### Single Purpose Description (1000 characters max)

```
PR Description Guard has a single, narrow purpose: to validate GitHub pull request descriptions in real-time and provide inline guidance when required sections are missing. The extension monitors the PR description textarea on GitHub pull request pages and validates the content against three required sections: "What changed", "Why", and "How it was tested". When sections are missing, it displays a non-intrusive warning box below the textarea with specific guidance. The extension does not block PR creation or merging—it only provides helpful validation feedback. All validation happens locally in the browser using pure JavaScript/TypeScript. No data is collected, stored, or transmitted. The extension works exclusively on GitHub pull request pages (creation, editing, and viewing) and has no other functionality beyond this single validation purpose.
```

### Permission Justifications

#### Storage Permission Justification (1000 characters max)

```
The storage permission is required to save user preferences for the extension's settings. Specifically, it stores three boolean preferences: enableValidation (whether to show validation warnings), showOnExistingPRs (whether to validate existing PRs in read-only view), and strictMode (future feature preference). These preferences are stored locally using Chrome's chrome.storage.sync API and are synced across the user's Chrome browsers if they have sync enabled. No user content, PR descriptions, personal information, or any other data is stored. The storage permission is essential for the extension to remember user preferences between browser sessions. Without this permission, users would need to reconfigure the extension settings every time they use it, which would significantly degrade the user experience. The extension does not use localStorage, sessionStorage, cookies, or any other storage mechanisms—only Chrome's storage API for these minimal preference settings.
```

#### Context Menus Permission Justification (1000 characters max)

```
The contextMenus permission is used to provide a right-click context menu option that allows users to quickly access the extension's settings popup. When users right-click on a GitHub page, they can select "PR Description Guard" from the context menu to open the settings popup. This provides convenient access to toggle validation settings without needing to click the extension icon in the toolbar. The context menu only appears on GitHub pages (matching the content script matches) and provides a single action: opening the settings popup. No user data is accessed or collected through the context menu. This permission enhances user experience by providing an alternative way to access extension settings, but it is not strictly required for core functionality—the extension can still be accessed via the toolbar icon. However, it provides a more convenient user experience for developers who frequently need to adjust validation settings while working on pull requests.
```

#### Host Permission Justification

**Note:** This extension does NOT request host permissions. The content script matches are specified in the manifest.json under `content_scripts[].matches`, which does not require host permissions. The extension only runs on GitHub pull request pages (`*://github.com/*/compare/*`, `*://github.com/*/pull/new/*`, `*://github.com/*/pull/*`) as specified in the manifest, and this is sufficient for the extension's single purpose of validating PR descriptions. No additional host permissions are needed.

### Basic Information

**Extension Name:**
```
PR Description Guard
```

**Short Description (132 characters max):**
```
Validates GitHub PR descriptions to ensure they contain required sections: "What changed", "Why", and "How it was tested".
```

**Detailed Description:**
```
PR Description Guard is a Chrome Extension that helps maintain high-quality pull request descriptions. It validates PR descriptions in real-time as you type, showing helpful inline warnings when essential sections are missing.

✅ Key Features:
• Real-time Validation - Validates as you type (debounced for performance)
• Three Required Sections:
  - "What changed" - Describes the changes made
  - "Why" - Explains the reason for changes
  - "How it was tested" - Documents testing approach
• Non-intrusive Warnings - Inline guidance that doesn't block PR creation
• Works Everywhere - Compatible with GitHub, GitLab, Bitbucket, and all Git platforms
• Dark Mode Support - Automatically adapts to GitHub's dark theme
• Zero Data Collection - All validation happens locally in your browser
• Privacy First - No tracking, no analytics, no data transmission

How It Works:
The extension monitors the PR description textarea on pull request pages. As you type, it validates the content against the three required sections. If any sections are missing, a helpful warning appears below the textarea with specific guidance.

Privacy:
This extension does not collect, store, or transmit any user data. All validation happens locally in your browser. No network requests are made, no data is stored, and no analytics are used.
```

**Category:**
```
Developer Tools
```

**Language:**
```
English (United States)
```

---

## 🖼️ Images

### Extension Icon
- **File:** `icons/icon128.png`
- **Size:** 128x128 pixels
- **Format:** PNG
- **Status:** ✅ Ready

### Screenshots (5 screenshots)
All screenshots are 1280x800 pixels, PNG format:

1. **screenshot-1-all-issues.png**
   - Shows 3 missing sections (What, Why, How it was tested)
   - Description: "3 Missing Sections: What, Why, How it was tested"

2. **screenshot-2-all-issues.png**
   - Shows 3 missing sections
   - Description: "3 Missing Sections: What, Why, How it was tested"

3. **screenshot-3-two-issues.png**
   - Shows 2 missing sections
   - Description: "2 Missing Sections: Real-time validation"

4. **screenshot-4-one-issue.png**
   - Shows 1 missing section
   - Description: "1 Missing Section: Almost there!"

5. **screenshot-5-no-issues.png**
   - Shows all sections validated
   - Description: "All Validated ✓ Ready!"

**Screenshot Location:** `screenshots/webstore/`

---

## 🔗 URLs

### Privacy Policy
```
https://github.com/afrasiyabhaider/pr-description-guard/blob/main/PRIVACY.md
```

### Support URL (GitHub Discussions)
```
https://github.com/afrasiyabhaider/pr-description-guard/discussions
```

### Homepage URL
```
https://github.com/afrasiyabhaider/pr-description-guard
```

---

## 🏷️ Tags

Suggested tags (comma-separated):
```
GitHub, Git, Pull Request, Code Review, Developer Tools, Productivity, Quality Assurance, PR Validation
```

---

## ✅ Compliance Checklist

### Privacy & Data
- [x] Privacy policy created and accessible
- [x] No data collection (all processing is local)
- [x] No analytics or tracking
- [x] No network requests
- [x] No data storage (localStorage, cookies, etc.)

### Manifest V3
- [x] Uses Manifest V3
- [x] No deprecated APIs
- [x] Content script only (no background service worker)
- [x] No permissions required

### Content
- [x] No deceptive practices
- [x] No malware or harmful code
- [x] Accurate description
- [x] All screenshots show actual functionality

### Images
- [x] Icon: 128x128 PNG
- [x] Screenshots: 1280x800 PNG (5 screenshots)
- [x] All images are high quality
- [x] Screenshots show extension in action

---

## 📋 Submission Steps

1. **Go to Chrome Web Store Developer Dashboard**
   - Visit: https://chrome.google.com/webstore/devconsole
   - Sign in with your Google account

2. **Create New Item**
   - Click "New Item"
   - Upload `pr-description-guard.zip`

3. **Fill in Store Listing**
   - **Name:** PR Description Guard
   - **Summary:** (Use short description above)
   - **Description:** (Use detailed description above)
   - **Category:** Developer Tools
   - **Language:** English (United States)

4. **Upload Images**
   - **Icon:** Upload `icons/icon128.png`
   - **Screenshots:** Upload all 5 screenshots from `screenshots/webstore/`

5. **Add URLs**
   - **Privacy Policy:** https://github.com/afrasiyabhaider/pr-description-guard/blob/main/PRIVACY.md
   - **Support URL:** https://github.com/afrasiyabhaider/pr-description-guard/discussions
   - **Homepage URL:** https://github.com/afrasiyabhaider/pr-description-guard

6. **Add Tags**
   - GitHub, Git, Pull Request, Code Review, Developer Tools, Productivity, Quality Assurance, PR Validation

7. **Review & Submit**
   - Review all information
   - Submit for review

---

## 📝 Additional Notes

### Version Information
- **Current Version:** 1.0.0
- **Manifest Version:** 3
- **Minimum Chrome Version:** 88+ (for Manifest V3 support)

### Permissions
- **No permissions required** - Extension works without any special permissions

### Testing
- Tested on Chrome 88+
- Tested on real GitHub PR pages
- Tested with dark mode
- Tested with SPA navigation

### Support
- **Issues:** GitHub Issues (if repository is public)
- **Discussions:** GitHub Discussions
- **Email:** (Add your support email if needed)

---

## 🚀 Post-Submission

After submission:
1. Review typically takes 1-3 business days
2. You'll receive email notifications about status
3. If rejected, address feedback and resubmit
4. Once approved, extension will be live in Chrome Web Store

---

**Good luck with your submission! 🎉**
