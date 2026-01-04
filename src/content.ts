import { validatePRDescription } from './validator';
import { getDescriptionField, isPRPage, getRenderedDescription, getDescriptionContainer } from './dom';

/**
 * Debounce utility function
 * Returns a debounced version of the function that waits for inactivity
 */
function debounce<T extends (...args: unknown[]) => unknown>(
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
let mutationObserver: MutationObserver | null = null;
let popstateHandler: ((event: PopStateEvent) => void) | null = null;
let turboLoadHandler: ((event: Event) => void) | null = null;
let currentPath = location.pathname;
let hasAnnounced = false;

// Development mode flag (set to false in production)
const DEV_MODE = false;

/**
 * Build warning DOM structure from validation errors
 * Uses DOM methods instead of innerHTML to prevent XSS vulnerabilities
 */
function buildWarningElement(errors: Array<{ rule: string; message: string }>): HTMLDivElement {
  const warning = document.createElement('div');
  warning.className = 'pr-guard-warning';
  
  // Header
  const header = document.createElement('div');
  header.className = 'pr-guard-warning-header';
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '16');
  svg.setAttribute('height', '16');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'currentColor');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z');
  svg.appendChild(path);
  
  const headerText = document.createElement('span');
  headerText.textContent = `PR Description Issues (${errors.length})`;
  header.appendChild(svg);
  header.appendChild(headerText);
  
  // Error list
  const errorList = document.createElement('ul');
  errorList.className = 'pr-guard-warning-list';
  errors.forEach(error => {
    const listItem = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = error.message;
    listItem.appendChild(document.createTextNode('Missing section: '));
    listItem.appendChild(strong);
    errorList.appendChild(listItem);
  });
  
  // Hint
  const hint = document.createElement('div');
  hint.className = 'pr-guard-warning-hint';
  hint.appendChild(document.createTextNode('Tip: Add sections like '));
  
  const code1 = document.createElement('code');
  code1.textContent = '## What changed';
  const code2 = document.createElement('code');
  code2.textContent = '## Why';
  const code3 = document.createElement('code');
  code3.textContent = '## How it was tested';
  
  hint.appendChild(code1);
  hint.appendChild(document.createTextNode(', '));
  hint.appendChild(code2);
  hint.appendChild(document.createTextNode(', and '));
  hint.appendChild(code3);
  
  // Assemble
  warning.appendChild(header);
  warning.appendChild(errorList);
  warning.appendChild(hint);
  
  return warning;
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
 * Uses DOM methods to prevent XSS vulnerabilities
 * Handles both textarea (edit mode) and rendered description (read-only view)
 */
function showWarning(errors: Array<{ rule: string; message: string }>): void {
  removeWarning();
  
  if (errors.length === 0) {
    hasAnnounced = false;
    return;
  }
  
  // Build warning element using DOM methods (XSS-safe)
  const warning = buildWarningElement(errors);
  
  // Use 'alert' role on first appearance, 'status' on updates
  warning.setAttribute('role', hasAnnounced ? 'status' : 'alert');
  warning.setAttribute('aria-live', 'polite');
  warning.setAttribute('aria-label', `PR Description Validation: ${errors.length} issue${errors.length === 1 ? '' : 's'} found`);
  
  // Try to insert after textarea (edit mode)
  const textarea = getDescriptionField();
  if (textarea) {
    textarea.parentNode?.insertBefore(warning, textarea.nextSibling);
    hasAnnounced = true;
    return;
  }
  
  // If no textarea, try to insert in description container (read-only view)
  const container = getDescriptionContainer();
  if (container) {
    // Insert at the beginning of the container or after the description content
    const descriptionContent = container.querySelector('.comment-body, .markdown-body');
    if (descriptionContent) {
      descriptionContent.parentNode?.insertBefore(warning, descriptionContent.nextSibling);
    } else {
      container.insertBefore(warning, container.firstChild);
    }
    hasAnnounced = true;
    return;
  }
  
  // If we can't find a place to insert, don't show warning
  hasAnnounced = false;
}

/**
 * Validate and show warning if needed
 * Handles both textarea (edit mode) and rendered description (read-only view)
 */
function validateAndShow(): void {
  let description = '';
  
  // First, try to get description from textarea (edit mode)
  const textarea = getDescriptionField();
  if (textarea) {
    description = textarea.value;
  } else {
    // If no textarea, try to get rendered description (read-only view)
    description = getRenderedDescription();
  }
  
  // If we still don't have a description, can't validate
  if (!description && !textarea) {
    return;
  }
  
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
 * Wraps event listeners in try-catch for error safety
 * Handles both PR creation and existing PR edit modes
 */
function initializeGuard(): void {
  let retries = 0;
  const maxRetries = 5; // Increased retries for edit mode
  
  const tryInit = () => {
    try {
      const textarea = getDescriptionField();
      
      if (textarea && textarea.dataset.prGuardInitialized !== 'true') {
        // Clean up any existing handler for this textarea
        if (validationHandler) {
          textarea.removeEventListener('input', validationHandler);
          textarea.removeEventListener('paste', validationHandler);
        }
        
        // Create debounced validation handler
        validationHandler = debounce(validateAndShow, 300);
        
        // Attach event listeners with error handling
        try {
          textarea.addEventListener('input', validationHandler);
          textarea.addEventListener('paste', validationHandler);
        } catch (error) {
          if (DEV_MODE) {
            console.warn('[PR Guard] Failed to attach event listeners:', error);
          }
          return; // Don't mark as initialized if listeners failed
        }
        
        // Mark as initialized for this specific textarea
        textarea.dataset.prGuardInitialized = 'true';
        document.body.classList.add('pr-guard-initialized');
        
        // Run initial validation
        validateAndShow();
      } else if (!textarea && retries < maxRetries) {
        retries++;
        setTimeout(tryInit, 500);
      } else if (!textarea) {
        // Don't warn if we're on an existing PR page (description might be read-only)
        // Only warn if we're on a PR creation page
        const isCreationPage = /\/compare\/|\/pull\/new/.test(location.pathname);
        if (DEV_MODE && isCreationPage) {
          console.warn('[PR Guard] Could not find description field after retries');
        }
      }
    } catch (error) {
      if (DEV_MODE) {
        console.warn('[PR Guard] Initialization error:', error);
      }
      // Fail silently, don't break GitHub
    }
  };
  
  tryInit();
}

/**
 * Cleanup function - removes listeners, warnings, and observers
 * Prevents memory leaks by cleaning up all resources
 */
function cleanup(): void {
  try {
    const textarea = getDescriptionField();
    
    if (textarea && validationHandler) {
      textarea.removeEventListener('input', validationHandler);
      textarea.removeEventListener('paste', validationHandler);
      textarea.dataset.prGuardInitialized = 'false';
    }
    
    removeWarning();
    
    // Clear all timers
    if (initTimeout) {
      clearTimeout(initTimeout);
      initTimeout = null;
    }
    
    if (navigationInterval) {
      clearInterval(navigationInterval);
      navigationInterval = null;
    }
    
    // Disconnect MutationObserver
    if (mutationObserver) {
      mutationObserver.disconnect();
      mutationObserver = null;
    }
    
    // Remove event listeners
    if (popstateHandler) {
      window.removeEventListener('popstate', popstateHandler);
      popstateHandler = null;
    }
    
    if (turboLoadHandler) {
      document.removeEventListener('turbo:load', turboLoadHandler);
      turboLoadHandler = null;
    }
    
    document.body.classList.remove('pr-guard-initialized');
    document.body.classList.remove('pr-guard-rendered-validated');
    hasAnnounced = false;
    validationHandler = null;
  } catch (error) {
    if (DEV_MODE) {
      console.warn('[PR Guard] Cleanup error:', error);
    }
    // Continue cleanup even if errors occur
  }
}

/**
 * Handle navigation changes
 * Wrapped in try-catch for error safety
 */
/**
 * Start or stop navigation interval based on current page
 * DRY helper to avoid code duplication
 */
function manageNavigationInterval(): void {
  if (isPRPage() && !navigationInterval) {
    navigationInterval = setInterval(() => {
      handleNavigation();
      if (!isPRPage()) {
        if (navigationInterval) {
          clearInterval(navigationInterval);
          navigationInterval = null;
        }
      }
    }, 2000);
  } else if (!isPRPage() && navigationInterval) {
    clearInterval(navigationInterval);
    navigationInterval = null;
  }
}

/**
 * Handle navigation changes
 * Wrapped in try-catch for error safety
 */
function handleNavigation(): void {
  try {
    const newPath = location.pathname;
    
    if (newPath !== currentPath) {
      currentPath = newPath;
      
      if (isPRPage(newPath)) {
        // Start navigation interval if not already running
        manageNavigationInterval();
        
        // Debounce initialization to avoid multiple rapid calls
        if (initTimeout) {
          clearTimeout(initTimeout);
        }
        initTimeout = setTimeout(initializeGuard, 500);
      } else {
        cleanup();
      }
    }
  } catch (error) {
    if (DEV_MODE) {
      console.warn('[PR Guard] Navigation handling error:', error);
    }
    // Fail silently, don't break GitHub
  }
}

/**
 * Safe initialization wrapper
 */
function safeInit(): void {
  try {
    if (isPRPage()) {
      // Try to initialize for textarea (edit mode)
      initializeGuard();
      
      // Also validate rendered description if no textarea (read-only view)
      const textarea = getDescriptionField();
      if (!textarea) {
        // Check if there's a rendered description
        const description = getRenderedDescription();
        const container = getDescriptionContainer();
        if (description || container) {
          // Validate the rendered description
          validateAndShow();
          document.body.classList.add('pr-guard-rendered-validated');
        }
      }
    }
    
    // Set up navigation detection
    // Store handler references for cleanup
    popstateHandler = handleNavigation;
    turboLoadHandler = handleNavigation;
    
    // Primary: Check URL on interval (only when on PR page)
    // Use helper function to avoid duplication
    if (isPRPage()) {
      manageNavigationInterval();
    }
    
    // Secondary: Listen to browser navigation
    window.addEventListener('popstate', popstateHandler);
    
    // Optional: Listen to Turbo events if available
    document.addEventListener('turbo:load', turboLoadHandler);
    
    // Fallback: MutationObserver for textarea appearance and rendered description changes
    mutationObserver = new MutationObserver(() => {
      if (isPRPage()) {
        const textarea = getDescriptionField();
        const hasRenderedDescription = getRenderedDescription().length > 0 || getDescriptionContainer() !== null;
        
        // If we have a textarea and it's not initialized, initialize it
        if (textarea && !textarea.dataset.prGuardInitialized) {
          // Reset initialization state if textarea changed (e.g., edit mode activated)
          if (document.body.classList.contains('pr-guard-initialized')) {
            document.body.classList.remove('pr-guard-initialized');
          }
          initializeGuard();
        }
        // If we have a rendered description (read-only view), validate it
        else if (!textarea && hasRenderedDescription && !document.body.classList.contains('pr-guard-rendered-validated')) {
          // Validate rendered description (read-only view)
          validateAndShow();
          document.body.classList.add('pr-guard-rendered-validated');
        }
      }
    });
    
    // Watch for changes in the document (including when edit button is clicked)
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true // Need subtree: true to catch edit form appearance and description changes
    });
    
    // Also listen for click events on edit buttons to catch edit mode activation
    // IMPORTANT: Only target description edit, not comment edit
    const editButtonHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Find the edit button
      const editButton = target.matches('button[aria-label*="Edit" i], .js-comment-edit-button, button[data-action="edit"]') 
        ? target 
        : target.closest('button[aria-label*="Edit" i], .js-comment-edit-button, button[data-action="edit"]') as HTMLElement;
      
      if (!editButton) return;
      
      // CRITICAL: Only handle if it's the PR description edit, NOT a comment edit
      // The description edit is in the first timeline comment group
      const isDescriptionEdit = editButton.closest('.timeline-comment-group:first-child, .js-issue-body, .timeline-comment:first-of-type');
      const isCommentEdit = editButton.closest('.js-new-comment-form, .review-thread-reply-form, .inline-comment-form, .timeline-comment:not(:first-of-type)');
      
      // Only proceed if it's description edit, not comment edit
      if (isDescriptionEdit && !isCommentEdit) {
        // Reset initialization state to allow re-initialization
        document.body.classList.remove('pr-guard-initialized');
        
        // Clear any existing initialization markers
        const allTextareas = document.querySelectorAll<HTMLTextAreaElement>('textarea');
        allTextareas.forEach(t => {
          if (t.dataset.prGuardInitialized === 'true') {
            t.dataset.prGuardInitialized = 'false';
          }
        });
        
        // Wait for the edit form to appear, then try to initialize
        setTimeout(() => {
          if (isPRPage()) {
            initializeGuard();
          }
        }, 500); // Increased delay to ensure form is rendered
      }
    };
    
    document.addEventListener('click', editButtonHandler, true); // Use capture phase to catch events early
  } catch (error) {
    if (DEV_MODE) {
      console.warn('[PR Guard] Initialization failed:', error);
    }
    // Fail silently, don't break GitHub
  }
}

// Initialize when content script loads
safeInit();
