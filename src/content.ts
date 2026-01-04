import { validatePRDescription } from './validator';
import { getDescriptionField, isPRPage } from './dom';

/**
 * Debounce utility function
 * Returns a debounced version of the function that waits for inactivity
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

// State management
let validationHandler: ((event: Event) => void) | null = null;
let initTimeout: ReturnType<typeof setTimeout> | null = null;
let navigationInterval: ReturnType<typeof setInterval> | null = null;
let currentPath = location.pathname;
let hasAnnounced = false;

/**
 * Build warning HTML from validation errors
 */
function buildWarningHTML(errors: Array<{ rule: string; message: string }>): string {
  const errorList = errors
    .map(error => `<li>Missing section: <strong>${error.message}</strong></li>`)
    .join('');
  
  return `
    <div class="pr-guard-warning-header">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
      </svg>
      <span>PR Description Issues (${errors.length})</span>
    </div>
    <ul class="pr-guard-warning-list">
      ${errorList}
    </ul>
    <div class="pr-guard-warning-hint">
      Tip: Add sections like <code>## What changed</code>, <code>## Why</code>, and <code>## How it was tested</code>
    </div>
  `;
}

/**
 * Remove warning element from DOM
 */
function removeWarning(): void {
  const warning = document.querySelector('.pr-guard-warning');
  if (warning) {
    warning.remove();
  }
}

/**
 * Show warning with validation errors
 */
function showWarning(errors: Array<{ rule: string; message: string }>): void {
  removeWarning();
  
  const textarea = getDescriptionField();
  if (!textarea || errors.length === 0) {
    hasAnnounced = false;
    return;
  }
  
  const warning = document.createElement('div');
  warning.className = 'pr-guard-warning';
  // Use 'alert' role on first appearance, 'status' on updates
  warning.setAttribute('role', hasAnnounced ? 'status' : 'alert');
  warning.setAttribute('aria-live', 'polite');
  warning.innerHTML = buildWarningHTML(errors);
  
  // Insert warning after textarea
  textarea.parentNode?.insertBefore(warning, textarea.nextSibling);
  hasAnnounced = true;
}

/**
 * Validate and show warning if needed
 */
function validateAndShow(): void {
  const textarea = getDescriptionField();
  if (!textarea) {
    return;
  }
  
  const description = textarea.value;
  const result = validatePRDescription(description);
  
  if (result.isValid) {
    removeWarning();
    hasAnnounced = false;
  } else {
    showWarning(result.errors);
  }
}

/**
 * Initialize the guard on PR page
 * Includes retry mechanism for late-rendering textareas
 */
function initializeGuard(): void {
  // Prevent duplicate initialization
  if (document.body.classList.contains('pr-guard-initialized')) {
    return;
  }
  
  let retries = 0;
  const maxRetries = 3;
  
  const tryInit = () => {
    const textarea = getDescriptionField();
    
    if (textarea && textarea.dataset.prGuardInitialized !== 'true') {
      // Create debounced validation handler
      validationHandler = debounce(validateAndShow, 300);
      
      // Attach event listeners
      textarea.addEventListener('input', validationHandler);
      textarea.addEventListener('paste', validationHandler);
      
      // Mark as initialized
      textarea.dataset.prGuardInitialized = 'true';
      document.body.classList.add('pr-guard-initialized');
      
      // Run initial validation
      validateAndShow();
    } else if (!textarea && retries < maxRetries) {
      retries++;
      setTimeout(tryInit, 500);
    } else if (!textarea) {
      console.warn('[PR Guard] Could not find description field after retries');
    }
  };
  
  tryInit();
}

/**
 * Cleanup function - removes listeners and warnings
 */
function cleanup(): void {
  const textarea = getDescriptionField();
  
  if (textarea && validationHandler) {
    textarea.removeEventListener('input', validationHandler);
    textarea.removeEventListener('paste', validationHandler);
    textarea.dataset.prGuardInitialized = 'false';
  }
  
  removeWarning();
  
  if (initTimeout) {
    clearTimeout(initTimeout);
    initTimeout = null;
  }
  
  document.body.classList.remove('pr-guard-initialized');
  hasAnnounced = false;
  validationHandler = null;
}

/**
 * Handle navigation changes
 */
function handleNavigation(): void {
  const newPath = location.pathname;
  
  if (newPath !== currentPath) {
    currentPath = newPath;
    
    if (isPRPage(newPath)) {
      // Debounce initialization to avoid multiple rapid calls
      if (initTimeout) {
        clearTimeout(initTimeout);
      }
      initTimeout = setTimeout(initializeGuard, 500);
    } else {
      cleanup();
    }
  }
}

/**
 * Safe initialization wrapper
 */
function safeInit(): void {
  try {
    if (isPRPage()) {
      initializeGuard();
    }
    
    // Set up navigation detection
    // Primary: Check URL on interval (2-3 seconds)
    navigationInterval = setInterval(handleNavigation, 2000);
    
    // Secondary: Listen to browser navigation
    window.addEventListener('popstate', handleNavigation);
    
    // Optional: Listen to Turbo events if available
    document.addEventListener('turbo:load', handleNavigation);
    
    // Fallback: Lightweight MutationObserver for textarea appearance
    const observer = new MutationObserver(() => {
      if (isPRPage() && getDescriptionField() && !document.body.classList.contains('pr-guard-initialized')) {
        initializeGuard();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: false // Only watch direct children
    });
  } catch (error) {
    console.warn('[PR Guard] Initialization failed:', error);
    // Fail silently, don't break GitHub
  }
}

// Initialize when content script loads
safeInit();
