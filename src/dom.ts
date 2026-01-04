/**
 * Get the PR description textarea element
 * Uses fallback selector chain for resilience
 * 
 * @returns The textarea element or null if not found
 */
export function getDescriptionField(): HTMLTextAreaElement | null {
  const selectors = [
    '#pull_request_body',
    'textarea[name="pull_request[body]"]',
    '.comment-form-textarea',
    'textarea[aria-label*="body"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector<HTMLTextAreaElement>(selector);
    if (element) {
      return element;
    }
  }
  
  // Only log in development mode
  // In production, fail silently to avoid console noise
  if (typeof window !== 'undefined' && (window as any).__PR_GUARD_DEV__) {
    console.warn('[PR Guard] Could not find description field');
  }
  return null;
}

/**
 * Get the submit button element
 * Uses JavaScript text matching since CSS :has-text() doesn't exist
 * 
 * @returns The submit button element or null if not found
 */
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
 * Check if current page is a PR creation/edit page
 * 
 * @param pathname - The pathname to check (defaults to current location)
 * @returns True if page is a PR page
 */
export function isPRPage(pathname: string = location.pathname): boolean {
  // Handle edge case where pathname might be undefined
  if (!pathname) {
    return false;
  }
  return /\/compare\/|\/pull\/(new|\d+)/.test(pathname);
}
