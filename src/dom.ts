/**
 * Get the PR description textarea element (for editing)
 * Uses fallback selector chain for resilience
 * Handles both PR creation pages and existing PR edit pages
 * IMPORTANT: Excludes comment textareas - only targets PR description
 * 
 * @returns The textarea element or null if not found
 */
export function getDescriptionField(): HTMLTextAreaElement | null {
  // First, try to find PR description edit form (when editing existing PR description)
  // This appears when you click "Edit" on the PR description (not comments)
  const descriptionEditSelectors = [
    // PR creation pages - primary selectors
    '#pull_request_body',
    'textarea[name="pull_request[body]"]',
    'textarea[id="pull_request_body"]',
    
    // PR creation pages - alternative selectors
    'form[action*="/compare"] textarea',
    'form[action*="/pull/new"] textarea',
    '.js-new-pr-form textarea',
    '.pull-request-form textarea',
    '.js-comment-form textarea',
    '.comment-form-textarea',
    
    // PR creation pages - aria-label based
    'textarea[aria-label*="description" i]',
    'textarea[aria-label*="body" i]',
    'textarea[placeholder*="description" i]',
    
    // Existing PR description edit form (when clicking Edit on description)
    // These are in the first comment/timeline item, not in the comment form
    '.timeline-comment-group:first-child textarea[name="issue[body]"]',
    '.js-issue-body textarea[name="issue[body]"]',
    'form[action*="/pull/"][action*="/issues/"] textarea[name="issue[body]"]',
    '.timeline-comment:first-of-type textarea[name="issue[body]"]',
    
    // More specific selectors for description edit
    '.js-comment-body:first-of-type textarea',
    '.js-issue-body:first-of-type textarea'
  ];
  
  for (const selector of descriptionEditSelectors) {
    const element = document.querySelector<HTMLTextAreaElement>(selector);
    if (element) {
      // Make absolutely sure it's NOT in the comment form
      const isInCommentForm = element.closest('.js-new-comment-form, .review-thread-reply-form, .inline-comment-form');
      const isInDescriptionEdit = element.closest('.timeline-comment-group:first-child, .js-issue-body, form[action*="/issues/"]');
      
      // Only accept if it's clearly a description field, not a comment field
      if (isInDescriptionEdit && !isInCommentForm) {
        return element;
      }
      // Also accept PR creation fields
      if (selector.includes('pull_request') && !isInCommentForm) {
        return element;
      }
    }
  }
  
  // Fallback: Look for any textarea but exclude comment forms
  const allTextareas = document.querySelectorAll<HTMLTextAreaElement>('textarea');
  for (const textarea of allTextareas) {
    // Skip comment forms
    const isInCommentForm = textarea.closest('.js-new-comment-form, .review-thread-reply-form, .inline-comment-form, .js-new-comment-field');
    
    // Check if it's in a PR creation form
    const isInPRForm = textarea.closest('form[action*="/compare"], form[action*="/pull/new"], .js-new-pr-form, .pull-request-form');
    
    // Check if it's in description edit area
    const isInDescriptionArea = textarea.closest('.timeline-comment-group:first-child, .js-issue-body, form[action*="/issues/"]');
    
    // Check for PR description identifiers
    const isPRDescriptionField = 
      textarea.name === 'pull_request[body]' || 
      textarea.id === 'pull_request_body' ||
      textarea.getAttribute('name')?.includes('pull_request') ||
      textarea.getAttribute('id')?.includes('pull_request');
    
    // Only accept description areas, never comment forms
    // Accept if: (1) in PR form, (2) in description area, or (3) has PR description identifiers
    if (!isInCommentForm && (isInPRForm || isInDescriptionArea || isPRDescriptionField)) {
      return textarea;
    }
  }
  
  // Last resort: On PR creation pages, accept any textarea that's not clearly a comment field
  // This is more permissive but necessary if GitHub changes their DOM structure
  const isCreationPage = /\/compare\/|\/pull\/new/.test(location.pathname);
  if (isCreationPage) {
    const allTextareas = document.querySelectorAll<HTMLTextAreaElement>('textarea');
    for (const textarea of allTextareas) {
      // Only exclude if it's clearly in a comment form
      const isInCommentForm = textarea.closest('.js-new-comment-form, .review-thread-reply-form, .inline-comment-form, .js-new-comment-field');
      // Exclude if it's in a review comment thread
      const isInReviewThread = textarea.closest('.review-thread, .inline-comment-form-container');
      // Exclude if it has comment-specific attributes
      const isCommentField = textarea.getAttribute('placeholder')?.toLowerCase().includes('leave a comment') ||
                            textarea.getAttribute('aria-label')?.toLowerCase().includes('comment');
      
      if (!isInCommentForm && !isInReviewThread && !isCommentField) {
        // This is likely the PR description field on a creation page
        return textarea;
      }
    }
  }
  
  // Only log in development mode
  // In production, fail silently to avoid console noise
  if (typeof window !== 'undefined') {
    const devWindow = window as typeof window & { __PR_GUARD_DEV__?: boolean };
    if (devWindow.__PR_GUARD_DEV__) {
      console.warn('[PR Guard] Could not find description field');
    }
  }
  return null;
}

/**
 * Get the rendered PR description content (for read-only view)
 * Extracts text from the first timeline comment which contains the PR description
 * 
 * @returns The description text or empty string if not found
 */
export function getRenderedDescription(): string {
  // Try to find the rendered description in the first timeline comment
  const descriptionSelectors = [
    // First timeline comment (PR description)
    '.timeline-comment-group:first-child .comment-body',
    '.timeline-comment:first-of-type .comment-body',
    '.js-issue-body .comment-body',
    '.js-comment-body:first-of-type',
    
    // Alternative selectors
    '.timeline-comment-group:first-child .markdown-body',
    '.timeline-comment:first-of-type .markdown-body',
    '.js-issue-body .markdown-body'
  ];
  
  for (const selector of descriptionSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Make sure it's not in a comment form
      const isInCommentForm = element.closest('.js-new-comment-form, .review-thread-reply-form');
      if (!isInCommentForm) {
        // Extract text content (this gets the rendered markdown as text)
        return element.textContent || element.innerText || '';
      }
    }
  }
  
  return '';
}

/**
 * Get the container element where we should show the warning for rendered descriptions
 * This is the first timeline comment group (PR description area)
 * 
 * @returns The container element or null if not found
 */
export function getDescriptionContainer(): HTMLElement | null {
  const selectors = [
    '.timeline-comment-group:first-child',
    '.timeline-comment:first-of-type',
    '.js-issue-body'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      // Make sure it's not in a comment form
      const isInCommentForm = element.closest('.js-new-comment-form, .review-thread-reply-form');
      if (!isInCommentForm) {
        return element;
      }
    }
  }
  
  return null;
}

/**
 * Get the submit button element
 * Uses JavaScript text matching since CSS :has-text() doesn't exist
 * 
 * Note: Currently unused but kept for potential future use (e.g., disabling submit button)
 * 
 * @returns The submit button element or null if not found
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function getSubmitButton(): HTMLButtonElement | null {
  // Find all submit buttons
  const buttons = document.querySelectorAll<HTMLButtonElement>('button[type="submit"]');
  
  for (const button of buttons) {
    const text = button.textContent?.trim().toLowerCase() || '';
    if (
      text.includes('create pull request') ||
      text.includes('create draft pull request') ||
      text.includes('update comment')
    ) {
      return button;
    }
  }
  
  // Fallback: Try common submit button selector
  const fallback = document.querySelector<HTMLButtonElement>('.btn-primary[type="submit"]');
  if (fallback) {
    return fallback;
  }
  
  return null;
}

/**
 * Check if current page is a PR creation/edit/view page
 * Handles both new PR creation and existing PR pages
 * 
 * @param pathname - The pathname to check (defaults to current location)
 * @returns True if page is a PR page
 */
export function isPRPage(pathname: string = location.pathname): boolean {
  // Handle edge case where pathname might be undefined
  if (!pathname) {
    return false;
  }
  // Match:
  // - /compare/* (PR creation)
  // - /pull/new/* (PR creation)
  // - /pull/{number} (existing PR view/edit)
  // - /pull/{number}/files (PR files view)
  return /\/compare\/|\/pull\/(new|\d+)/.test(pathname);
}
