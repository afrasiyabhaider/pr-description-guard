# Privacy Policy

**Last Updated:** January 4, 2026

## Overview

PR Description Guard ("we", "our", or "the extension") is committed to protecting your privacy. This privacy policy explains how the extension handles data and what information, if any, is collected, stored, or transmitted.

## Data Collection

**PR Description Guard does NOT collect, store, or transmit any personal data or user content.**

### What We Do NOT Collect

- ❌ **No PR descriptions** - We never read, store, or transmit your pull request descriptions
- ❌ **No user information** - We do not collect your name, email, GitHub username, or any identifying information
- ❌ **No repository data** - We do not access or store information about your repositories
- ❌ **No analytics or tracking** - We do not use Google Analytics, Mixpanel, or any tracking services
- ❌ **No network requests** - The extension does not make any HTTP/HTTPS requests to external servers
- ❌ **No cookies** - We do not set or use cookies
- ❌ **No third-party services** - We do not integrate with any external services or APIs

### What We DO Store (User Preferences Only)

The extension uses Chrome's `chrome.storage.sync` API to store only your extension preferences:

- **Enable validation** - Your preference to enable/disable validation (boolean)
- **Validate existing PRs** - Your preference to show warnings on existing PRs (boolean)
- **Strict mode** - Your preference for strict mode (boolean, future feature)

**Important:** These preferences are stored locally in your browser via Chrome's sync storage. They are:
- Stored only on your device
- Synced across your Chrome browsers (if you have sync enabled)
- Never transmitted to our servers (we have no servers)
- Never shared with third parties

## How It Works

All validation happens **locally in your browser**. The extension:

1. **Reads PR description text** - Only from the GitHub page you're viewing (never stored)
2. **Validates locally** - Uses pure JavaScript/TypeScript validation (no external calls)
3. **Displays warnings** - Shows inline guidance if sections are missing
4. **No data transmission** - All processing happens in your browser, no data leaves your device

### Permissions Used

The extension requests the following permissions:

- **`storage`** - Used only to store your extension preferences (enableValidation, showOnExistingPRs, strictMode). No user content or PR data is stored.

**No host permissions** - The extension does not request access to any websites beyond what's needed for the content script to run on GitHub PR pages.

## Data Security

- All validation happens **client-side** in your browser
- No data is transmitted over the network
- No data is stored on external servers
- Your preferences are stored using Chrome's secure storage API
- The extension has no backend infrastructure

## Third-Party Services

The extension does not use any third-party services, APIs, or external dependencies. All functionality is self-contained within the extension.

## Children's Privacy

The extension does not knowingly collect any information from children. Since we do not collect any personal information, this is not applicable.

## Changes to This Privacy Policy

We may update this privacy policy from time to time. The "Last Updated" date at the top of this page indicates when the policy was last revised. We encourage you to review this policy periodically.

## Your Rights

Since we do not collect, store, or transmit any personal data, there is no data to access, modify, or delete. Your extension preferences can be changed or cleared at any time through the extension's settings or by uninstalling the extension.

## Contact Us

If you have any questions about this privacy policy or the extension's data practices, please:

- **Open an issue:** [GitHub Issues](https://github.com/afrasiyabhaider/pr-description-guard/issues)
- **Start a discussion:** [GitHub Discussions](https://github.com/afrasiyabhaider/pr-description-guard/discussions)
- **Repository:** [PR Description Guard](https://github.com/afrasiyabhaider/pr-description-guard)

---

**Summary:** PR Description Guard is a privacy-first extension. We do not collect, store, or transmit any user data or content. All validation happens locally in your browser. Only your extension preferences (enableValidation, showOnExistingPRs, strictMode) are stored locally using Chrome's storage API.
