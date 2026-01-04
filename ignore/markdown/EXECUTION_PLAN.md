# PR Description Guard — Execution Plan

**Goal:** Ship a minimal Chrome extension that validates GitHub PR descriptions against structural rules.

**Timeline:** 7–10 days (realistic timeline accounting for setup, testing, and quality)  
**Scope:** MVP only. No AI, no backend, no API calls.

---

## Phase 0: Project Setup (Day 1 — 3–4 hours)

### Goal
Bootstrap Chrome Extension with Manifest V3 structure and development workflow.

### Files
```
pr-description-guard/
├── manifest.json
├── src/
│   ├── content.ts          # Main content script
│   ├── validator.ts         # Validation logic (pure functions)
│   ├── dom.ts              # DOM selectors and helpers
│   └── styles.css          # Inline warning styles
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── tests/
│   └── validator.test.ts   # Unit tests for validation rules
├── package.json
├── .gitignore
└── README.md
```

### Implementation Notes
- Use Manifest V3 (`manifest_version: 3`)
- Content script targets: `*://github.com/*/pull/*`, `*://github.com/*/compare/*`
- No background service worker needed (DOM-only)
- No popup UI for MVP
- TypeScript + Vite setup (~1–2 hours one-time cost)
- Use `web_accessible_resources` only if injecting styles via JS

### manifest.json Structure

Create manifest.json with:
- Manifest version 3
- Extension name: "PR Description Guard"
- Version: 1.0.0
- Description: "Validates GitHub PR descriptions for required sections"
- No permissions required (empty array)
- Content scripts matching GitHub PR URLs: `*://github.com/*/compare/*`, `*://github.com/*/pull/new/*`, `*://github.com/*/pull/*`
- Content script JS file: `src/content.js` (will be built from `content.ts` via Vite)
- Content script CSS file: `src/styles.css`
- Run at: `document_idle` (to avoid blocking page load)
- Icons: 16x16, 48x48, 128x128 PNG files in `icons/` directory

---

## Phase 1: Core Validation Logic (Day 1–2 — TDD Approach)

### Goal
Implement pure validation functions that check PR description against MVP rules.

### Files
- `src/validator.ts`
- `tests/validator.test.ts`

### MVP Validation Rules

| Rule ID | Rule | Check Logic |
|---------|------|-------------|
| `EMPTY` | Description must not be empty | `text.trim().length > 0` |
| `WHAT` | Must include "What changed" section | **Precise pattern:** `(?:^|\n)(?:#{1,3}|[\*_]{1,2})\s*what'?s?\s+changed[:\?]?` — Case-insensitive, handles apostrophes, colons, question marks. **Does NOT match:** "Changes" alone (too generic) |
| `WHY` | Must include "Why" section | **Precise pattern:** `(?:^|\n)(?:#{1,3}|[\*_]{1,2})\s*why[:\?]?` — Case-insensitive, handles colons, question marks |
| `TESTED` | Must include "How it was tested" section | **Precise pattern:** `(?:^|\n)(?:#{1,3}|[\*_]{1,2})\s*how\s+(?:it\s+)?was\s+tested[:\?]?` — Case-insensitive, handles variations, colons, question marks |

### Validation Function API

Create `validator.ts` with the following structure:

**Main export function:**
- `validatePRDescription(description: string): ValidationResult`
  - Takes raw PR description text as input
  - Returns validation result object with `isValid` boolean and `errors` array
  - Each error has `rule` (rule ID) and `message` (user-friendly message)

**Helper function:**
- `hasSection(text: string, pattern: RegExp): boolean`
  - Checks if text contains a section matching the regex pattern
  - Returns true if section found, false otherwise

**Type definition:**
- `ValidationResult` type with:
  - `isValid: boolean`
  - `errors: Array<{rule: string, message: string}>`

### Section Detection Strategy

**Template placeholder cleaning:**
- Create function `cleanTemplatePlaceholders(text: string): string`
- Remove HTML comments (`<!-- comment -->`) from text before validation
- Use regex pattern to match and remove all HTML comments
- This ensures template placeholders don't interfere with validation

**Primary section patterns:**
- Define regex patterns for each required section:
  - "What changed": Pattern matches markdown headings (`##`, `###`, `####`) or bold text (`**`, `__`), followed by "what" (optional apostrophe), "changed", optional punctuation
  - "Why": Pattern matches markdown headings or bold text, followed by "why", optional punctuation
  - "How it was tested": Pattern matches markdown headings or bold text, followed by "how" (optional "it"), "was tested", optional punctuation
- All patterns should be case-insensitive
- Patterns should match at start of line or after newline

**Alternative phrasings (optional for MVP):**
- Consider supporting alternative section names:
  - "What changed" alternatives: "Changes", "Summary"
  - "Why" alternatives: "Reason", "Rationale"
  - "How it was tested" alternatives: "Testing", "Test plan"
- These can be implemented as additional patterns that are checked if primary patterns fail

### Testing Approach (TDD)
Write tests first to achieve >90% coverage:
- Empty string → fails `EMPTY`
- Whitespace only → fails `EMPTY`
- Has content but no sections → fails `WHAT`, `WHY`, `TESTED`
- Has `## What changed` → passes `WHAT`
- Has `**Why**` → passes `WHY`
- Case variations work
- Apostrophes: "What's changed" → passes `WHAT`
- Punctuation: "Why:" → passes `WHY`
- Template placeholders (HTML comments) are ignored
- "Changes" alone does NOT pass `WHAT` (too generic)
- Full valid description → `isValid: true`

---

## Phase 2: DOM Integration (Day 2–3)

### Goal
Connect validation logic to GitHub's PR form via content script.

### Files
- `src/content.ts`
- `src/dom.ts` (DOM utilities)

### DOM Selector Strategy

GitHub's DOM is relatively stable, but use defensive selectors with fallbacks for resilience.

#### Primary Targets

| Element | Selector Strategy | Fallback |
|---------|-------------------|----------|
| Description textarea | `#pull_request_body` | `textarea[name="pull_request[body]"]` |
| Submit button | JavaScript text matching (see `getSubmitButton()`) | `.btn-primary[type="submit"]` |
| Form container | `form.js-new-pr-form` | `.pull-request-form` |

#### Selector Resilience Pattern

**Description field selector:**
- Create function `getDescriptionField(): HTMLTextAreaElement | null` in `dom.ts`
- Try selectors in order (fallback chain):
  1. `#pull_request_body` (primary selector)
  2. `textarea[name="pull_request[body]"]` (fallback)
  3. `.comment-form-textarea` (fallback)
  4. `textarea[aria-label*="body"]` (fallback)
- Return first matching element found
- If none found, log warning to console and return null
- This provides resilience if GitHub changes DOM structure

**Submit button selector:**
- Create function `getSubmitButton(): HTMLButtonElement | null` in `dom.ts`
- Note: CSS `:has-text()` doesn't exist, so use JavaScript text matching
- Find all submit buttons on page
- Check button text content (case-insensitive) for:
  - "create pull request"
  - "create draft pull request"
  - "update comment"
- Return first matching button
- Fallback: Try `.btn-primary[type="submit"]` selector
- Return null if no button found

### SPA Navigation Handling (Simplified)

GitHub uses Turbo (formerly PJAX) for navigation. Content script must re-initialize on navigation.

**Simplified approach:** Check URL on interval OR listen to Turbo events. Avoid History API interception (too fragile and might break GitHub's navigation).

**Implementation strategy:**

1. **URL pathname tracking:**
   - Store current pathname in variable
   - Create function `isPRPage(pathname: string): boolean` that checks if pathname matches PR page patterns (`/compare/` or `/pull/new` or `/pull/{number}`)
   - Create function `handleNavigation()` that:
     - Compares current pathname to stored pathname
     - If changed and is PR page: Initialize guard (with debounce timeout to avoid multiple initializations)
     - If changed and not PR page: Call cleanup function

2. **Navigation detection methods:**
   - **Primary:** Set up interval (every 2–3 seconds) to check URL pathname
   - **Secondary:** Listen to browser `popstate` event (back/forward buttons)
   - **Optional:** Listen to Turbo `turbo:load` event if available (GitHub uses Turbo)

3. **Fallback observer:**
   - Create lightweight MutationObserver that watches for textarea appearance
   - Only observe direct children of body (not entire subtree for performance)
   - Check if page is PR page and textarea exists before initializing
   - Prevent duplicate initializations by checking for initialization marker

**Key points:**
- Use debounce timeout (500ms) when initializing to avoid multiple rapid initializations
- Clear timeout if navigation happens again before initialization completes
- Don't intercept `history.pushState` or `history.replaceState` (too fragile)

### Event Binding

**Debounce utility:**
- Create `debounce(func: Function, wait: number): Function` utility
- Returns a debounced version of the function
- Waits for `wait` milliseconds of inactivity before calling the function
- Clears previous timeout if function is called again before wait period completes
- This prevents excessive validation calls during rapid typing

**Initialization function:**
- Create `initializeGuard()` function that:
  1. **Retry mechanism:** Attempts to find textarea up to 3 times (500ms intervals)
     - If textarea found and not already initialized:
       - Create debounced validation handler (300ms delay)
       - Attach `input` event listener to textarea with debounced handler
       - Mark textarea as initialized (using data attribute)
       - Mark page as initialized (using body class)
       - Run initial validation
     - If textarea not found and retries remaining: Retry after 500ms
     - If textarea not found after all retries: Log warning and exit
  2. **Handler storage:** Store validation handler reference for cleanup
  3. **Initialization tracking:** Use data attributes and classes to prevent duplicate initialization

**Key points:**
- Debounce delay: 300ms (balance between responsiveness and performance)
- Max retries: 3 attempts (reduced from 10 for MVP)
- Retry interval: 500ms between attempts
- Store handler reference for proper cleanup later

---

## Phase 3: UX — Warning Display (Day 3–4)

### Goal
Show clear, non-hostile inline warnings when validation fails.

### Files
- `src/content.ts` (warning injection)
- `src/styles.css`

### UX Enforcement Approach

**Philosophy:** Guide, don't block. Annoying ≠ effective.

| Behavior | Implementation |
|----------|----------------|
| Warning visibility | Insert warning box directly below textarea (simple, non-collapsible for MVP) |
| Warning persistence | Update on every input (debounced at 300ms) |
| Paste events | Validation runs on paste |
| Button disabling | ❌ Not in MVP (show warning only) |
| Blocking merges | ❌ Never |
| Posting comments | ❌ Never |

### Warning UI Structure

**HTML structure:**
- Create warning div with class `pr-guard-warning`
- Set ARIA attributes: `role="alert"` (or `role="status"` after first appearance) and `aria-live="polite"`
- Warning header section with:
  - Warning icon (SVG)
  - Text showing count of issues: "PR Description Issues (N)"
- Unordered list of missing sections:
  - Each item: "Missing section: **SectionName**"
- Helpful hint section:
  - Tip text with example markdown syntax: `## What changed`, `## Why`, `## How it was tested`

**Insertion location:**
- Insert warning div directly after the description textarea
- Use `insertBefore` or `insertAdjacentElement` to place it in the DOM

### CSS Design Principles

**CSS variables (scoped to extension element):**
- Define CSS variables for theming:
  - Background color: Light yellow/amber (`#fff8e6`)
  - Border color: Amber (`#f0c36d`)
  - Text color: Dark amber (`#735c0f`)
  - Border radius: 6px
- Use variables for easy theming and dark mode support

**Warning component styles:**
- Margin top: 8px (spacing from textarea)
- Padding: 12px 16px
- Background: Use CSS variable
- Border: 1px solid, use CSS variable
- Border radius: Use CSS variable
- Font size: 14px
- Color: Use CSS variable

**Header styles:**
- Display: flex
- Align items: center
- Margin bottom: 8px
- Gap: 8px (space between icon and text)

**Hint styles:**
- Margin top: 8px
- Font size: 12px
- Opacity: 0.8 (slightly faded)

**Dark mode support:**
- Primary: Target GitHub's dark mode classes: `[data-color-mode="dark"]` and `.dark`
- Fallback: Use `@media (prefers-color-scheme: dark)` for system preference
- Dark mode colors:
  - Background: Dark brown (`#3d2e00`)
  - Border: Dark amber (`#7a5a00`)
  - Text: Light amber (`#f0c36d`)

### Warning Injection Logic

**Build warning HTML:**
- Create function `buildWarningHTML(errors: ValidationError[]): string`
- Generate HTML string with:
  - Warning header with icon SVG and issue count
  - List of missing sections (map errors to list items)
  - Helpful hint with example markdown syntax
- Use template literals or DOM creation (avoid innerHTML if possible for security)

**Show warning:**
- Create function `showWarning(errors: ValidationError[])`
- Track announcement state (use `role="alert"` only on first appearance, then `role="status"`)
- Remove any existing warning first
- Check if textarea exists and errors array is not empty
- If no errors: Reset announcement state and return
- Create warning div element
- Set class name: `pr-guard-warning`
- Set ARIA role: `alert` on first appearance, `status` on updates
- Set `aria-live="polite"` for screen reader announcements
- Set innerHTML or build DOM structure
- Insert warning after textarea (use `insertBefore` or `insertAdjacentElement`)
- Mark as announced

**Remove warning:**
- Create function `removeWarning()`
- Find existing warning element by class name
- Remove from DOM if found
- Use optional chaining for safety

---

## Phase 4: Submit Button Behavior (Day 4 — 1 hour)

### Goal
Optionally disable the "Create Pull Request" button when validation fails.

### Implementation

**Default behavior for MVP:** Show warning only. Button remains enabled.

**Rationale:**
- Users may have valid reasons to skip sections
- Extension should inform, not enforce
- Hostile UX leads to uninstalls

**Future option:** Add popup toggle for "Strict Mode" that disables button.

### Soft Enforcement (MVP)

**Note:** This phase is optional for MVP. Button remains enabled by default.

**If implementing visual feedback:**
- Create function `updateButtonState(isValid: boolean)`
- Get submit button using `getSubmitButton()`
- If validation fails: Add CSS class `pr-guard-warn-active` to button
- If validation passes: Remove CSS class from button
- CSS class should add visual indicator (e.g., box-shadow with warning border color)
- This provides subtle visual feedback without blocking submission

---

## Phase 5: Hardening & Edge Cases (Day 4–5)

### Goal
Handle edge cases, GitHub DOM changes, and graceful failures.

### Edge Cases to Handle

| Case | Handling |
|------|----------|
| Textarea not found | Log warning, exit silently |
| GitHub DOM restructure | Selector fallback chain |
| User navigates away mid-edit | Cleanup observers |
| PR edit page vs. new PR page | Both use same textarea selector |
| Draft PR creation | Same validation |
| Template pre-filled | Clean HTML comments before validation (only `<!-- comment -->` format) |
| Rapid typing | Debounce (300ms — balance between responsiveness and performance) |
| Paste events | Validation runs on paste event |
| Multiple tabs | Each tab has independent state (no conflicts) |
| AJAX-loaded content | Retry mechanism (3 attempts max, 500ms intervals) |
| Markdown preview | Validates textarea value (not preview) |
| GitHub A/B tests | Fallback selectors provide resilience |
| Very long descriptions | No performance issue (regex is fast) |
| Textarea not rendered on load | Retry mechanism (3 attempts max, 500ms intervals) |
| Event listener leaks | Proper cleanup on navigation |
| Memory leaks | Remove event listeners, clear timers |

### Graceful Failure Pattern

**Safe initialization:**
- Wrap initialization in try-catch block
- Create `safeInit()` function that calls `initializeGuard()`
- On error: Log warning to console with error details
- Never show user-facing error messages (fail silently)
- Never break GitHub's functionality
- Extension should degrade gracefully if initialization fails

**DOM change detection:**
- Create `logSelectorFailure(selectorName: string)` function
- Log structured warning to console when selector fails
- Include selector name in log message
- Message should indicate GitHub may have updated their DOM
- This helps with debugging if extension stops working

### Cleanup on Navigation

**Cleanup function:**
- Create `cleanup()` function called when navigating away from PR page
- Remove event listeners:
  - Get textarea and validation handler
  - Remove `input` event listener from textarea
  - Reset textarea initialization marker (data attribute)
- Remove warning element from DOM
- Clear any debounce timers
- Remove initialization markers (body class)
- Reset announcement state
- This prevents memory leaks and ensures clean state on navigation

---

## Phase 6: Testing & QA (Day 5–6)

### Goal
Ensure extension works reliably across GitHub PR workflows.

### Unit Tests (validator.ts)

Run with Vitest (TDD approach, >90% coverage target).

**Command:** `npm test` (runs Vitest in watch mode) or `npm run test:run` (single run)

Test cases:
- [ ] Empty description fails
- [ ] Whitespace-only fails
- [ ] Missing "What changed" detected
- [ ] Missing "Why" detected
- [ ] Missing "How it was tested" detected
- [ ] All sections present = valid
- [ ] Case insensitivity works
- [ ] Markdown heading variations work (`##`, `###`, `**bold**`)
- [ ] Handles apostrophes ("What's changed")
- [ ] Handles punctuation (colons, question marks)
- [ ] Template placeholders (HTML comments) are ignored
- [ ] Whitespace-only sections are detected as missing

### Integration Testing (Real GitHub)

Test on actual GitHub (not local):
- [ ] Test with personal GitHub account
- [ ] Test with organization account
- [ ] Test with different PR types (new, edit, draft)
- [ ] Test with PR templates (HTML comments)
- [ ] Test with multiple Chrome versions
- [ ] Test with other extensions installed (conflict detection)

### Manual Testing Checklist

| Scenario | Expected |
|----------|----------|
| New PR with empty description | Warning shown |
| New PR with partial sections | Warning lists missing sections |
| New PR with all sections | No warning |
| Edit existing PR | Validation runs |
| Navigate away and back | Re-initializes |
| GitHub dark mode | Warning styled correctly |
| Draft PR | Validation runs (button says "Create draft pull request") |
| PR from fork | Validation runs |
| PR with template | Template placeholders (HTML comments) ignored, validates user content |
| Navigate via browser back/forward | Re-initializes correctly |
| Navigate via GitHub links | Re-initializes correctly |
| Paste content | Validation runs on paste |
| Multiple tabs open | Each tab has independent state |
| Screen reader | Proper ARIA announcements (NVDA, JAWS, VoiceOver) |

### Browser Testing

- [ ] Chrome stable (latest)
- [ ] Chrome beta (optional)

---

## Phase 7: Polish & Documentation (Day 6–7)

### Goal
Final polish, documentation, and preparation.

### Files
- `README.md` — Basic user-facing documentation
- `PRIVACY.md` — Simple privacy policy (required for store)

---

## Phase 8: Web Store Preparation (Day 7–10)

### Goal
Package extension and submit to Chrome Web Store.

### Goal
Package extension for Chrome Web Store submission.

### Files
- `store-assets/` — Screenshots (1280x800 or 640x400), promotional images

### Privacy Policy (Simple Statement)

Create `PRIVACY.md` file with simple privacy policy stating:
- Extension does not collect, store, or transmit any user data
- All validation happens locally in browser
- No data sent to any server
- No analytics used

**Note:** Simple statement is sufficient for MVP. No legal review needed for basic privacy policy.

### Chrome Web Store Requirements

- [ ] Manifest V3 compliant
- [ ] Icons: 16x16, 48x48, 128x128 (simple placeholders acceptable for MVP)
- [ ] Screenshots (1280x800 or 640x400)
- [ ] Short description (132 chars max)
- [ ] Detailed description
- [ ] Privacy policy URL

**Timeline Note:** Web Store review takes 1–7 days (typically 3–5 days). Submission is Day 7–10, but review is separate.

### Build Script

**package.json scripts:**
- `dev`: Vite build in watch mode (for development)
- `build`: Vite build (production)
- `test`: Run Vitest in watch mode
- `test:run`: Run Vitest once (for CI)
- `package`: Build extension and create zip file for Chrome Web Store

**Dependencies:**
- `typescript`: ^5.3.0 (TypeScript compiler)
- `vite`: ^5.0.0 (Build tool)
- `vitest`: ^2.0.0 (Testing framework)
- `@types/chrome`: ^0.0.0 (Chrome extension type definitions)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| GitHub changes DOM selectors | High | Medium | Fallback selector chain, structured logging |
| GitHub uses Shadow DOM | Low | High | Currently not used for PR forms — monitor |
| Extension conflicts with other GitHub extensions | Medium | Low | Use namespaced CSS classes |
| Performance issues on large PRs | Low | Low | Validation is O(n) on description length |
| User annoyance from warnings | Medium | Medium | Non-hostile UX, clear messaging |

---

## Post-MVP Ideas (Out of Scope for MVP)

**DO NOT IMPLEMENT THESE IN MVP**

These are documented for future consideration only:

1. **Custom rules** — Let users define their own required sections
2. **Popup settings** — Toggle strict mode, customize patterns
3. **Template auto-insert** — Inject template on empty description (opt-in)
4. **Badge indicator** — Show validation status in extension icon
5. **Keyboard shortcut** — Quick-focus on first missing section
6. **Firefox support** — Manifest V2/V3 compatibility
7. **Enterprise GitHub (github.example.com)** — Additional URL patterns

---

## File Checklist

| File | Status | Notes |
|------|--------|-------|
| `manifest.json` | Pending | MV3 config |
| `src/content.ts` | Pending | Main entry |
| `src/validator.ts` | Pending | Pure validation |
| `src/dom.ts` | Pending | DOM utilities |
| `src/styles.css` | Pending | Warning styles |
| `tests/validator.test.ts` | Pending | Unit tests (>90% coverage) |
| `icons/*` | Pending | PNG icons (simple placeholders OK) |
| `README.md` | Pending | Basic user docs |
| `PRIVACY.md` | Pending | Simple privacy policy |
| `package.json` | Pending | Dev tooling (TypeScript, Vite, Vitest) |

---

## Definition of Done (MVP)

- [ ] Extension loads on GitHub PR creation pages
- [ ] Validates description against 4 rules
- [ ] Shows inline warning with missing sections
- [ ] Handles SPA navigation
- [ ] Fails gracefully on DOM changes
- [ ] Works in dark mode
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration testing on real GitHub complete
- [ ] Manual QA complete
- [ ] Screen reader testing complete
- [ ] Packaged for Chrome Web Store
- [ ] Submitted for review (review takes 1–7 days)

---

---

## ⚠️ Updates Applied

This plan has been reviewed and updated with the following changes:

1. **Timeline extended** — 7–10 days (realistic for quality MVP)
2. **Precise validation rules** — Exact regex patterns specified
3. **Simplified SPA navigation** — URL checking on interval (removed fragile History API interception)
4. **Reduced retry attempts** — 3 attempts max (not 10)
5. **Removed collapsible UI** — Simple warning for MVP (collapsible moved to post-MVP)
6. **Added edge cases** — Paste events, multiple tabs, AJAX loading, markdown preview
7. **Error recovery specified** — Silent failure with console warnings
8. **Integration testing** — Real GitHub testing strategy
9. **Accessibility specified** — ARIA roles, screen reader testing
10. **Template handling clarified** — Only HTML comments, not markdown comments
11. **Dark mode simplified** — GitHub classes + media query fallback
12. **Tech stack kept** — TypeScript + Vite + Vitest (reasonable with extended timeline)
13. **Test coverage kept** — >90% (achievable with TDD in extended timeline)
14. **Web Store timeline** — Realistic review timeline (1–7 days after submission)

---

*Last updated: 2026-01-04 (Updated with review fixes)*
