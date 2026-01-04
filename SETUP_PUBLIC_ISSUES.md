# Setting Up Public Issues & Discussions for Private Repository

## Option 1: Enable Discussions on Private Repo (Recommended)

GitHub allows Discussions on private repositories. This is the simplest approach.

### Steps:

1. **Enable Discussions on your private repo:**
   - Go to your repository on GitHub
   - Click "Settings" → "General"
   - Scroll to "Features" section
   - Enable "Discussions"
   - Optionally enable "Issues" (if you want issue tracking too)

2. **Update README.md:**
   - Add a "Support" or "Feedback" section pointing to Discussions
   - Link to the Discussions tab

3. **Benefits:**
   - ✅ Code stays private
   - ✅ Users can report issues and discuss
   - ✅ All in one place
   - ✅ No need for separate repos

---

## Option 2: Separate Public Repository (More Control)

Create a public repository just for issues and discussions.

### Steps:

1. **Create a new public repository:**
   ```bash
   # Example: pr-description-guard-public
   # This will be public and only contain:
   # - README with links to extension
   # - Issues enabled
   # - Discussions enabled
   ```

2. **Structure the public repo:**
   ```
   pr-description-guard-public/
   ├── README.md          # Extension description, install instructions
   ├── ISSUES.md          # Issue templates
   ├── CONTRIBUTING.md    # How to report issues
   └── .github/
       └── ISSUE_TEMPLATE/
           ├── bug_report.md
           └── feature_request.md
   ```

3. **Update your private repo:**
   - Add link to public repo in README
   - Update manifest.json homepage_url to point to public repo

4. **Benefits:**
   - ✅ Complete separation of code and user-facing content
   - ✅ Can customize public repo completely
   - ✅ Better for marketing/landing page

---

## Option 3: GitHub Discussions Only (No Issues)

Use Discussions for everything (questions, bugs, features).

### Steps:

1. **Enable Discussions on private repo**
2. **Disable Issues** (if you prefer)
3. **Create Discussion Categories:**
   - 🐛 Bug Reports
   - 💡 Feature Requests
   - ❓ Questions
   - 💬 General Discussion

4. **Benefits:**
   - ✅ More flexible than issues
   - ✅ Better for community building
   - ✅ Code stays private

---

## Recommended Setup (Option 1 + Discussions)

**Best approach for your use case:**

1. **Keep code repository private**
2. **Enable Discussions on private repo**
3. **Enable Issues on private repo** (optional, but recommended)
4. **Update README with support links**

### Implementation:

1. **Update README.md:**
   ```markdown
   ## Support & Feedback
   
   - 🐛 **Found a bug?** [Open an issue](https://github.com/your-username/pr-description-guard/issues)
   - 💡 **Have a feature request?** [Start a discussion](https://github.com/your-username/pr-description-guard/discussions)
   - ❓ **Have a question?** [Ask in discussions](https://github.com/your-username/pr-description-guard/discussions)
   ```

2. **Create Discussion Templates:**
   - Bug Report template
   - Feature Request template
   - Question template

3. **Create Issue Templates:**
   - Bug report
   - Feature request

---

## Quick Start Guide

### For Option 1 (Recommended):

1. Go to your GitHub repository
2. Settings → General → Features
3. Enable "Discussions" ✅
4. Enable "Issues" ✅ (optional)
5. Update README.md with links
6. Done!

### For Option 2 (Separate Public Repo):

1. Create new public repository: `pr-description-guard-public`
2. Add README with extension info
3. Enable Issues and Discussions
4. Update private repo README to link to public repo
5. Update manifest.json homepage_url

---

## Example README Updates

### For Private Repo (Option 1):

```markdown
## Support

- 🐛 **Report a bug:** [Open an issue](https://github.com/your-username/pr-description-guard/issues/new)
- 💡 **Request a feature:** [Start a discussion](https://github.com/your-username/pr-description-guard/discussions/new)
- ❓ **Ask a question:** [Join discussions](https://github.com/your-username/pr-description-guard/discussions)

**Note:** This repository is private. Code is not publicly available, but we welcome your feedback and bug reports!
```

### For Public Repo (Option 2):

```markdown
# PR Description Guard

[Extension description...]

## Installation

[Install instructions...]

## Support

- 🐛 **Report a bug:** [Open an issue](../../issues/new)
- 💡 **Request a feature:** [Start a discussion](../../discussions/new)
- ❓ **Ask a question:** [Join discussions](../../discussions)

**Note:** The source code is maintained in a private repository. This repository is for user support and feedback.
```

---

## Recommendation

**Use Option 1** (Enable Discussions on private repo):
- Simplest setup
- No need to maintain two repos
- Users can still report issues and discuss
- Code stays completely private
- Less maintenance overhead
