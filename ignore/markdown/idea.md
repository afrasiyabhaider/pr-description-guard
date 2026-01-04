# PR Description Guard — Idea Document

**Version:** 1.0.0  
**Type:** Chrome Extension (Manifest V3)  
**Target:** GitHub Pull Request Pages  
**Timeline:** 7–10 days MVP (realistic timeline accounting for setup, testing, and quality)

---

## Core Idea

PR Description Guard is a lightweight Chrome extension that validates GitHub pull request descriptions to ensure they contain essential information before submission. The extension provides **non-intrusive, inline guidance** to developers, helping teams maintain consistent PR documentation standards without blocking workflows.

### Problem Statement

Many pull requests are created with minimal or missing descriptions, making code reviews less effective. Reviewers lack context about:
- What changed
- Why the change was made
- How it was tested

This leads to slower reviews, more back-and-forth questions, and lower code quality.

### Solution Approach

The extension runs silently in the background on GitHub PR creation pages. It validates the description field against a simple set of rules and displays a **helpful warning** directly below the description textarea when sections are missing. The extension never blocks PR creation or merging—it only provides guidance.

---

## Tech Stack

### Core Technologies

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Extension Framework** | Chrome Extension Manifest V3 | Modern standard, required for Chrome Web Store |
| **Language** | TypeScript | Type safety, better IDE support, catches errors early |
| **Bundler** | Vite | Fast builds, zero-config TypeScript, minimal output |
| **Testing** | Vitest | Fast, native ESM, works seamlessly with Vite |
| **Validation** | Pure JavaScript/TypeScript | No external dependencies, fast regex-based validation |
| **Styling** | Vanilla CSS with CSS Variables | No framework overhead, scoped to extension elements |

### Development Tools

- **TypeScript** — Type checking and modern JavaScript features
- **Vite** — Build tool for bundling and development
- **Vitest** — Unit testing framework
- **Chrome DevTools** — Extension debugging and testing

### Why This Stack?

- **Minimal dependencies** — Only 3 dev dependencies (TypeScript, Vite, Vitest)
- **Fast development** — Vite provides instant feedback
- **Type safety** — TypeScript prevents common errors
- **No runtime overhead** — Pure JavaScript validation, no frameworks
- **Free and open source** — All tools are free to use
- **Timeline note:** Setup time is ~1–2 hours (one-time cost), which is reasonable for a 7–10 day project

---

## Workflow

### User Workflow

1. **Developer navigates to GitHub PR creation page**
   - Extension automatically loads (no user action required)
   - Extension detects PR description textarea

2. **Developer types in description field**
   - Extension validates in real-time (debounced at 300ms to balance responsiveness and performance)
   - If sections are missing, warning appears below textarea
   - Warning shows specific missing sections with helpful examples

3. **Developer adds required sections**
   - Warning updates in real-time as sections are added
   - Warning disappears when all sections are present
   - No blocking—developer can still create PR at any time

4. **Developer creates PR**
   - Extension does not interfere with PR creation
   - No API calls, no comments, no blocking

### Technical Workflow

#### Initialization Flow

1. **Content script loads** on GitHub PR pages
   - Matches URL patterns: `/compare/*`, `/pull/new/*`, `/pull/*`
   - Runs at `document_idle` to avoid blocking page load

2. **DOM detection**
   - Attempts to find description textarea using fallback selector chain
   - Retries up to 3 times (500ms intervals) if textarea not found
   - Gracefully fails if textarea never appears (logs warning, exits silently)

3. **Event binding**
   - Attaches input event listener to textarea (debounced at 300ms)
   - Marks textarea as initialized to prevent duplicate listeners
   - Performs initial validation

#### Validation Flow

1. **User types in description**
   - Input event fires (also handles paste events)
   - Debounce timer waits 300ms for typing to pause

2. **Validation runs**
   - Cleans template placeholders (HTML comments `<!-- comment -->`) from text
   - Checks for empty/whitespace-only content
   - Checks for required sections using precise regex patterns
   - Returns validation result with specific errors

3. **UI updates**
   - If errors exist: Show/update warning with missing sections
   - If valid: Hide warning
   - Update accessibility attributes appropriately

#### Navigation Handling

1. **GitHub SPA navigation detected**
   - Primary: Check URL pathname on interval (2–3 seconds) OR listen to Turbo events if available
   - Fallback: Lightweight MutationObserver watches for textarea appearance
   - URL pathname compared to previous pathname

2. **Page type determination**
   - Checks if current page is a PR creation/edit page
   - If yes: Initialize guard (with debounce to avoid multiple initializations)
   - If no: Cleanup event listeners and remove warnings

3. **Error recovery**
   - If selectors fail: Log structured warning to console
   - Silent failure: Extension doesn't break GitHub
   - No user notification: Extension fails gracefully without disrupting workflow

#### Cleanup Flow

1. **User navigates away from PR page**
   - Cleanup function called
   - Event listeners removed from textarea
   - Warning element removed from DOM
   - Timers cleared
   - Initialization markers reset

---

## Project Structure

### Directory Layout

```
pr-description-guard/
├── src/
│   ├── content.ts          # Main content script entry point
│   ├── validator.ts         # Pure validation logic (no DOM)
│   ├── dom.ts              # DOM selectors and helpers
│   └── styles.css          # Warning UI styles
├── tests/
│   └── validator.test.ts   # Unit tests for validation logic
├── icons/
│   ├── icon16.png          # Extension icon (16x16)
│   ├── icon48.png          # Extension icon (48x48)
│   └── icon128.png         # Extension icon (128x128)
├── dist/                   # Build output (generated)
├── manifest.json           # Chrome extension manifest
├── vite.config.ts          # Vite build configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── .gitignore              # Git ignore rules
├── README.md               # User-facing documentation
├── PRIVACY.md              # Privacy policy (required for store)
└── idea.md                 # This file
```

### File Responsibilities

#### Source Files (`src/`)

- **content.ts** — Main orchestrator
  - Handles initialization and cleanup
  - Manages SPA navigation detection
  - Coordinates validation and UI updates
  - Binds event listeners

- **validator.ts** — Pure validation logic
  - No DOM dependencies
  - Exports validation functions
  - Handles precise regex pattern matching
  - Cleans template placeholders (HTML comments only)
  - Returns structured validation results

- **dom.ts** — DOM utilities
  - Selector functions with fallback chains
  - Helper functions for finding elements
  - DOM manipulation utilities
  - Error handling for missing elements

- **styles.css** — Visual styling
  - Warning component styles
  - CSS variables for theming
  - Dark mode support (GitHub's `data-color-mode="dark"` and `.dark` class)
  - Responsive design considerations

#### Configuration Files

- **manifest.json** — Chrome extension configuration
  - Manifest V3 format
  - Content script matches (URL patterns)
  - Icons and metadata
  - Permissions (none required)

- **vite.config.ts** — Build configuration
  - TypeScript compilation
  - Output directory setup
  - Extension-specific build settings

- **tsconfig.json** — TypeScript settings
  - Strict mode enabled
  - ES module target
  - Type definitions

- **package.json** — Project metadata
  - Dependencies (TypeScript, Vite, Vitest)
  - Scripts (dev, build, test, package)
  - Project information

#### Test Files (`tests/`)

- **validator.test.ts** — Unit tests
  - Tests all validation rules
  - Tests edge cases (empty, whitespace, templates)
  - Tests precise regex pattern variations
  - Tests error message formatting
  - Target: >90% coverage (achievable with TDD approach)

---

## Key Features (v1.0.0)

### Core Validation Rules (Precise Specifications)

1. **Non-empty requirement**
   - Description must contain non-whitespace content
   - Template placeholders (HTML comments `<!-- comment -->`) are ignored
   - **Limitation:** Only handles HTML comments, not markdown comments `[//]: # (comment)`

2. **"What changed" section**
   - Must include section header with exact pattern matching:
     - Markdown headings: `## What changed`, `### What changed`, `#### What changed`
     - Bold text: `**What changed**`, `__What changed__`
     - Case-insensitive matching
     - Handles apostrophes: "What's changed", "What changed"
     - Handles punctuation: "What changed:", "What changed?"
   - **Does NOT match:** "Changes" alone (too generic)
   - **Alternative phrasings (optional):** "Summary", "Changes" (if explicitly configured)

3. **"Why" section**
   - Must include section header with exact pattern matching:
     - Markdown headings: `## Why`, `### Why`, `#### Why`
     - Bold text: `**Why**`, `__Why__`
     - Case-insensitive matching
     - Handles punctuation: "Why:", "Why?"
   - **Alternative phrasings (optional):** "Reason", "Rationale" (if explicitly configured)

4. **"How it was tested" section**
   - Must include section header with exact pattern matching:
     - Markdown headings: `## How it was tested`, `### How it was tested`
     - Bold text: `**How it was tested**`, `__How it was tested__`
     - Case-insensitive matching
     - Handles variations: "How it was tested", "How was it tested"
     - Handles punctuation: "How it was tested:", "How it was tested?"
   - **Alternative phrasings (optional):** "Testing", "Test plan" (if explicitly configured)

### User Experience Features

1. **Inline warnings**
   - Appears directly below description textarea
   - Non-intrusive yellow/amber styling
   - Matches GitHub's design language

2. **Real-time validation**
   - Updates as user types (debounced at 300ms)
   - Immediate feedback on section additions
   - No page refresh required
   - Handles paste events

3. **Helpful guidance**
   - Shows specific missing sections
   - Provides example markdown syntax: `## What changed`, `## Why`, `## How it was tested`
   - Clear, actionable error messages

4. **Accessibility**
   - ARIA roles: `role="alert"` on first appearance, `role="status"` on updates
   - `aria-live="polite"` for screen reader announcements
   - Screen reader friendly (tested with NVDA, JAWS, VoiceOver)
   - Keyboard navigable

### Technical Features

1. **Robust DOM detection**
   - Fallback selector chain (GitHub DOM is relatively stable, but fallbacks provide safety)
   - Retry mechanism for late-rendering elements (3 attempts max, 500ms intervals)
   - Graceful failure handling (silent failure, console warnings)

2. **SPA navigation support**
   - Primary: URL pathname checking on interval (2–3 seconds) OR Turbo event listeners
   - Fallback: Lightweight MutationObserver (watches direct children only)
   - Proper cleanup on navigation

3. **Performance optimized**
   - Debounced validation (300ms — chosen as balance between responsiveness and performance)
   - Lightweight observers
   - Minimal DOM queries
   - Fast regex validation

4. **Memory leak prevention**
   - Event listener cleanup on navigation
   - Timer cleanup
   - Proper initialization tracking

5. **Dark mode support**
   - Detects GitHub's dark mode: `[data-color-mode="dark"]` and `.dark` class
   - Fallback: `@media (prefers-color-scheme: dark)`
   - Adjusts warning colors accordingly

---

## Constraints & Scope

### In Scope (v1.0.0 MVP)

- ✅ Validation of PR descriptions on GitHub
- ✅ Inline warning display (simple, non-collapsible for MVP)
- ✅ Real-time validation feedback
- ✅ Support for PR creation and editing
- ✅ Template placeholder handling (HTML comments only)
- ✅ Dark mode support
- ✅ SPA navigation handling
- ✅ Graceful error handling
- ✅ Integration testing on real GitHub
- ✅ Unit tests with >90% coverage (achievable with TDD)

### Out of Scope (Post-MVP)

- ❌ AI or auto-writing of descriptions
- ❌ Backend services or analytics
- ❌ GitHub API integration
- ❌ Posting comments on PRs
- ❌ Blocking PR creation or merging
- ❌ Custom validation rules (user-defined) — fixed rules for MVP
- ❌ Settings UI or popup
- ❌ Collapsible warnings (simple warning for MVP)
- ❌ GitLab or Bitbucket support
- ❌ Organization-level features
- ❌ Template auto-insertion
- ❌ Extension badge indicators
- ❌ Keyboard shortcuts

### Technical Constraints

- **Manifest V3 only** — No Manifest V2 support
- **Content script only** — No background service worker
- **DOM-based only** — No GitHub API calls
- **Chrome only** — No Firefox/Edge support in MVP
- **GitHub.com only** — No enterprise GitHub support
- **No permissions required** — Extension runs without special permissions

---

## Success Criteria

### Functional Requirements

- Extension loads on GitHub PR creation pages
- Validates description against 4 core rules (precise patterns)
- Shows inline warning with missing sections
- Updates warning in real-time as user types
- Handles GitHub SPA navigation correctly
- Works with PR templates (ignores HTML comment placeholders)
- Fails gracefully if GitHub DOM changes (silent failure, console warnings)
- Supports both light and dark modes
- Handles edge cases: paste events, multiple tabs, AJAX-loaded content

### Non-Functional Requirements

- **Performance:** Validation is debounced and optimized (no specific timing claim without benchmarking)
- **Reliability:** Handles edge cases without breaking GitHub
- **Usability:** Warning is clear and actionable
- **Accessibility:** Works with screen readers (proper ARIA roles, tested)
- **Maintainability:** Code is well-structured and testable

### Quality Metrics

- Unit test coverage: >90% for validation logic (achievable with TDD approach in 7–10 day timeline)
- Zero console errors in normal operation
- No memory leaks after extended use
- Works on latest Chrome stable
- Handles GitHub UI changes gracefully

---

## Risk Mitigation

### Technical Risks

| Risk | Mitigation |
|------|------------|
| GitHub changes DOM structure | Fallback selector chain, structured logging to console |
| GitHub uses Shadow DOM | Monitor for changes, adapt if needed |
| Performance issues | Debouncing (300ms), lightweight observers |
| Memory leaks | Proper cleanup, event listener management |
| Extension conflicts | Namespaced CSS classes, careful DOM manipulation |
| Selector failures | Silent failure, console warnings, no user disruption |

### User Experience Risks

| Risk | Mitigation |
|------|------------|
| User annoyance | Non-intrusive warnings, clear messaging |
| False positives | Precise regex patterns, template handling |
| False negatives | Comprehensive pattern matching, alternative phrasings |
| Accessibility issues | Proper ARIA roles, keyboard navigation, screen reader testing |
| Dark mode issues | Multiple detection methods (GitHub classes + media query) |

### Edge Cases Handled

- Paste events (validation runs on paste)
- Markdown preview mode (validates textarea value)
- Pre-filled templates (validates after template loads)
- Multiple tabs (each tab has independent state)
- AJAX-loaded content (retry mechanism handles late-rendering)
- GitHub A/B tests (fallback selectors provide resilience)
- PR from fork (same validation)
- Draft PR creation (same validation)
- Browser navigation (back/forward buttons handled)

---

## Future Considerations (Post-MVP)

These features are explicitly **out of scope** for v1.0.0 but documented for future consideration:

1. **Custom rules** — Allow users to define their own required sections
2. **Settings popup** — Toggle strict mode, customize patterns
3. **Template auto-insert** — Inject template on empty description (opt-in)
4. **Collapsible warnings** — Allow users to minimize warnings
5. **Badge indicator** — Show validation status in extension icon
6. **Keyboard shortcuts** — Quick-focus on first missing section
7. **Firefox support** — Manifest V2/V3 compatibility
8. **Enterprise GitHub** — Support for `github.example.com` domains
9. **GitLab/Bitbucket** — Extend to other platforms
10. **Team presets** — Share validation rules across team
11. **Analytics dashboard** — Track PR description quality (opt-in)

---

## Development Workflow

### Phase 0: Setup (Day 1)
- Initialize project structure
- Configure TypeScript, Vite, Vitest (~1–2 hours setup time)
- Set up manifest.json
- Create basic file structure

### Phase 1: Validation Logic (Day 1–2)
- Implement pure validation functions using TDD approach
- Write unit tests first, then implement validation
- Handle edge cases (templates, variations, punctuation)
- Achieve >90% test coverage

### Phase 2: DOM Integration (Day 2–3)
- Implement DOM selectors with fallback chains
- Add simplified SPA navigation handling
- Set up event binding (input, paste events)
- Add retry mechanism (3 attempts max)

### Phase 3: UX Implementation (Day 3–4)
- Create simple warning UI component (non-collapsible for MVP)
- Implement styling (light/dark mode)
- Add accessibility features (ARIA roles, screen reader support)

### Phase 4: Hardening (Day 4–5)
- Handle edge cases (paste, multiple tabs, AJAX loading)
- Implement proper cleanup
- Add error recovery (silent failure, console warnings)
- Performance optimization

### Phase 5: Testing (Day 5–6)
- Complete unit tests (already done via TDD)
- Integration testing on real GitHub
- Manual testing checklist
- Browser compatibility testing
- Screen reader testing

### Phase 6: Polish & Documentation (Day 6–7)
- Fix any issues found in testing
- Write README (basic user documentation)
- Create privacy policy (simple statement)
- Prepare icons (simple placeholders acceptable for MVP)

### Phase 7: Web Store Preparation (Day 7–10)
- Final polish
- Screenshots (1280x800 or 640x400)
- Web Store listing (short description, detailed description)
- Submit for review (review takes 1–7 days, typically 3–5 days)
- Address review feedback if needed

**Total: 7–10 days** (includes Web Store submission, but review is separate)

---

## Design Principles

1. **Non-intrusive** — Guide, don't block
2. **Fail gracefully** — Never break GitHub (silent failure, console warnings)
3. **Performance first** — Minimal overhead (debouncing, lightweight observers)
4. **Accessibility** — Works for everyone (proper ARIA, screen reader support)
5. **Maintainable** — Clean, testable code (>90% coverage)
6. **User-friendly** — Clear, helpful messaging

---

*Document Version: 1.0.0*  
*Last Updated: 2026-01-04 (Updated with review fixes)*
