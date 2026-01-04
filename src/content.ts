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
let warningObserver: MutationObserver | null = null; // Watch for warning removal
let warningCheckInterval: ReturnType<typeof setInterval> | null = null; // Periodic check for warning presence
let popstateHandler: ((event: PopStateEvent) => void) | null = null;
let turboLoadHandler: ((event: Event) => void) | null = null;
let createPRButtonHandler: ((event: Event) => void) | null = null;
let initialLoadPollInterval: ReturnType<typeof setInterval> | null = null; // Continuous polling for initial load
let currentPath = location.pathname;
let hasAnnounced = false;
let lastValidationErrors: Array<{ rule: string; message: string }> | null = null; // Store last errors to re-insert if removed
let lastWarningInsertTime = 0; // Track when warning was last inserted to prevent spam
let warningReinsertionCount = 0; // Track re-insertion attempts to prevent infinite loops
const WARNING_REINSERTION_COOLDOWN = 2000; // Minimum 2 seconds between re-insertions
const MAX_WARNING_REINSERTIONS = 5; // Maximum re-insertions before giving up
let lastValidationTime = 0; // Track when validation was last run
let isValidationRunning = false; // Prevent concurrent validation runs
const VALIDATION_COOLDOWN = 100; // Minimum 100ms between validations

// Development mode flag (set to false in production)
// Check for dev mode via localStorage or URL parameter to avoid console spam
// By default, DEV_MODE is false to keep console clean
const DEV_MODE = false; // Set to true only for debugging
// To enable dev mode, run in console: localStorage.setItem('pr-guard-dev', 'true')
// Or add ?pr-guard-dev to URL

// Settings state
let settings = {
  enableValidation: true,
  showOnExistingPRs: true,
  strictMode: false,
};

// Load settings from storage
async function loadSettings(): Promise<void> {
  try {
    const result = await chrome.storage.sync.get({
      enableValidation: true,
      showOnExistingPRs: true,
      strictMode: false,
    });
    settings = result as typeof settings;
  } catch (error) {
    if (DEV_MODE) {
      console.warn('[PR Guard] Error loading settings:', error);
    }
    // Use defaults on error
  }
}

// Listen for settings updates
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'SETTINGS_UPDATED') {
    settings = message.settings;
    // Re-validate if on PR page
    if (isPRPage()) {
      validateAndShow();
    }
  }
});

// Initialize settings
loadSettings();

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
 * Start periodic check to ensure warning stays visible
 * Only checks occasionally and with throttling to prevent spam
 */
function startWarningCheckInterval(): void {
  // Clear existing interval
  if (warningCheckInterval) {
    clearInterval(warningCheckInterval);
  }
  
  // Check every 2 seconds if warning is still in DOM (less aggressive)
  warningCheckInterval = setInterval(() => {
    if (lastValidationErrors && lastValidationErrors.length > 0 && !document.querySelector('.pr-guard-warning')) {
      const now = Date.now();
      // Only re-insert if enough time has passed since last insertion
      if (now - lastWarningInsertTime > WARNING_REINSERTION_COOLDOWN) {
        if (warningReinsertionCount < MAX_WARNING_REINSERTIONS) {
          if (DEV_MODE) {
            console.warn('[PR Guard] ⚠️ Warning missing from DOM, re-inserting...');
          }
          warningReinsertionCount++;
          lastWarningInsertTime = now;
          // Re-insert warning
          showWarning(lastValidationErrors);
        } else {
          // Stop checking if we've exceeded max re-insertions
          stopWarningCheckInterval();
          if (DEV_MODE) {
            console.warn('[PR Guard] Stopped warning re-insertion after max attempts');
          }
        }
      }
    }
  }, 2000); // Check every 2 seconds instead of 500ms
}

/**
 * Stop periodic warning check
 */
function stopWarningCheckInterval(): void {
  if (warningCheckInterval) {
    clearInterval(warningCheckInterval);
    warningCheckInterval = null;
  }
}

/**
 * Setup observer to watch for warning removal and re-insert if needed
 * Uses throttling to prevent infinite re-insertion loops
 */
function setupWarningObserver(warning: HTMLElement): void {
  // Disconnect existing observer
  if (warningObserver) {
    warningObserver.disconnect();
    warningObserver = null;
  }
  
  let lastCheckTime = 0;
  const CHECK_COOLDOWN = 1000; // Only check once per second
  
  // Watch for warning being removed from DOM
  warningObserver = new MutationObserver((mutations) => {
    const now = Date.now();
    // Throttle checks to prevent spam
    if (now - lastCheckTime < CHECK_COOLDOWN) {
      return;
    }
    lastCheckTime = now;
    
    // Check if warning is still in DOM
    const warningStillExists = document.contains(warning) || document.querySelector('.pr-guard-warning');
    
    if (!warningStillExists && lastValidationErrors && lastValidationErrors.length > 0) {
      // Only re-insert if enough time has passed and we haven't exceeded max attempts
      const timeSinceLastInsert = Date.now() - lastWarningInsertTime;
      if (timeSinceLastInsert > WARNING_REINSERTION_COOLDOWN && warningReinsertionCount < MAX_WARNING_REINSERTIONS) {
        if (DEV_MODE) {
          console.warn('[PR Guard] ⚠️ Warning was removed from DOM, re-inserting...');
        }
        warningReinsertionCount++;
        lastWarningInsertTime = Date.now();
        // Re-insert warning after a short delay
        setTimeout(() => {
          if (!document.querySelector('.pr-guard-warning') && lastValidationErrors && lastValidationErrors.length > 0) {
            showWarning(lastValidationErrors);
          }
        }, 200);
      } else if (warningReinsertionCount >= MAX_WARNING_REINSERTIONS) {
        // Stop observing if we've exceeded max attempts
        if (warningObserver) {
          warningObserver.disconnect();
          warningObserver = null;
        }
        stopWarningCheckInterval();
        if (DEV_MODE) {
          console.warn('[PR Guard] Stopped warning observer after max re-insertion attempts');
        }
      }
    }
  });
  
  // Only observe the parent, not the entire document (less aggressive)
  const parent = warning.parentNode;
  if (parent) {
    warningObserver.observe(parent, {
      childList: true,
      subtree: false // Don't watch subtree to reduce noise
    });
  }
}

/**
 * Remove warning element from DOM
 */
function removeWarning(): void {
  const warning = document.querySelector('.pr-guard-warning');
  if (warning) {
    warning.remove();
  }
  lastValidationErrors = null; // Clear stored errors when intentionally removing
  stopWarningCheckInterval(); // Stop checking when warning is intentionally removed
  warningReinsertionCount = 0; // Reset re-insertion counter
  lastWarningInsertTime = 0; // Reset insertion time
}

/**
 * Show warning with validation errors
 * Uses DOM methods to prevent XSS vulnerabilities
 * Handles both textarea (edit mode) and rendered description (read-only view)
 */
function showWarning(errors: Array<{ rule: string; message: string }>): void {
  if (DEV_MODE) {
    console.log('[PR Guard] showWarning called with', errors.length, 'errors:', errors.map(e => e.rule).join(', '));
  }
  
  removeWarning();
  
  if (errors.length === 0) {
    hasAnnounced = false;
    return;
  }
  
  // Store errors for re-insertion if warning gets removed
  lastValidationErrors = errors;
  warningReinsertionCount = 0; // Reset counter when showing new warning
  lastWarningInsertTime = Date.now(); // Track when warning was inserted
  
  // Build warning element using DOM methods (XSS-safe)
  const warning = buildWarningElement(errors);
  
  // Ensure warning is visible
  warning.style.display = 'block';
  warning.style.visibility = 'visible';
  warning.style.opacity = '1';
  
  // Use 'alert' role on first appearance, 'status' on updates
  warning.setAttribute('role', hasAnnounced ? 'status' : 'alert');
  warning.setAttribute('aria-live', 'polite');
  warning.setAttribute('aria-label', `PR Description Validation: ${errors.length} issue${errors.length === 1 ? '' : 's'} found`);
  warning.setAttribute('data-pr-guard-warning', 'true'); // Marker for detection
  
  if (DEV_MODE) {
    console.log('[PR Guard] Warning element created:', warning);
    console.log('[PR Guard] Warning styles:', {
      display: warning.style.display,
      visibility: warning.style.visibility,
      opacity: warning.style.opacity,
      className: warning.className
    });
  }
  
  // Try to insert after textarea (edit mode)
  const textarea = getDescriptionField();
  if (textarea) {
    if (DEV_MODE) {
      console.log('[PR Guard] Textarea found:', textarea);
      console.log('[PR Guard] Textarea parentNode:', textarea.parentNode);
      console.log('[PR Guard] Textarea nextSibling:', textarea.nextSibling);
      console.log('[PR Guard] Textarea parentNode type:', textarea.parentNode?.nodeName);
      console.log('[PR Guard] Textarea parent classes:', textarea.parentElement?.className);
    }
    
    // Try multiple insertion strategies
    const parent = textarea.parentNode;
    if (parent) {
      try {
        // Strategy 1: Insert after textarea
        if (textarea.nextSibling) {
          parent.insertBefore(warning, textarea.nextSibling);
          if (DEV_MODE) {
            console.log('[PR Guard] Warning inserted after textarea (before nextSibling)');
          }
        } else {
          // Strategy 2: Append to parent if no next sibling
          parent.appendChild(warning);
          if (DEV_MODE) {
            console.log('[PR Guard] Warning appended to parent (no nextSibling)');
          }
        }
        
        // Verify insertion
        if (warning.parentNode) {
          if (DEV_MODE) {
            console.log('[PR Guard] ✅ Warning inserted successfully, parent:', warning.parentNode);
            console.log('[PR Guard] Warning in DOM:', document.querySelector('.pr-guard-warning') !== null);
            const computedStyle = window.getComputedStyle(warning);
            console.log('[PR Guard] Warning computed style:', {
              display: computedStyle.display,
              visibility: computedStyle.visibility,
              opacity: computedStyle.opacity,
              height: computedStyle.height,
              width: computedStyle.width
            });
          }
          
          // Watch for warning removal (GitHub SPA might remove it)
          setupWarningObserver(warning);
          startWarningCheckInterval();
          
          hasAnnounced = true;
          return;
        } else {
          if (DEV_MODE) {
            console.error('[PR Guard] ❌ Warning insertion failed - warning has no parentNode');
          }
        }
      } catch (error) {
        if (DEV_MODE) {
          console.error('[PR Guard] ❌ Error inserting warning:', error);
        }
      }
    } else {
      if (DEV_MODE) {
        console.warn('[PR Guard] Textarea has no parentNode, trying fallback');
      }
    }
  } else {
    // Only log once per page load to reduce console noise
    if (DEV_MODE && !document.body.dataset.prGuardTextareaWarningLogged) {
      console.warn('[PR Guard] No textarea found, trying container fallback');
      document.body.dataset.prGuardTextareaWarningLogged = 'true';
      // Debug: Log all textareas on the page to help diagnose (only once)
      const allTextareas = document.querySelectorAll('textarea');
      console.log('[PR Guard] Found textareas on page:', allTextareas.length);
      if (allTextareas.length > 0) {
        allTextareas.forEach((ta, index) => {
          const textarea = ta as HTMLTextAreaElement;
          console.log(`[PR Guard] Textarea ${index + 1}:`, {
            id: textarea.id,
            name: textarea.name,
            className: textarea.className,
            parentClasses: textarea.parentElement?.className,
            closestForm: textarea.closest('form')?.getAttribute('action'),
            inCommentForm: !!textarea.closest('.js-new-comment-form, .review-thread-reply-form'),
            inPRForm: !!textarea.closest('form[action*="/compare"], form[action*="/pull/new"]')
          });
        });
      }
    }
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
  
  // Fallback: Try to find the form or any container near the textarea
  if (textarea) {
    // Try to find the form containing the textarea
    const form = textarea.closest('form');
    if (form) {
      if (DEV_MODE) {
        console.log('[PR Guard] Found form, inserting warning at end');
      }
      form.appendChild(warning);
      setupWarningObserver(warning);
      startWarningCheckInterval();
      hasAnnounced = true;
      return;
    }
    
    // Try to find any parent container
    const container = textarea.closest('.form-group, .form-actions, .js-comment-form, .comment-form, .js-issue-body');
    if (container) {
      if (DEV_MODE) {
        console.log('[PR Guard] Found container, inserting warning');
      }
      container.appendChild(warning);
      setupWarningObserver(warning);
      startWarningCheckInterval();
      hasAnnounced = true;
      return;
    }
  }
  
  // Last resort: Try to find the main content area
  const mainContent = document.querySelector('main, .repository-content, .js-navigation-container');
  if (mainContent) {
    if (DEV_MODE) {
      console.log('[PR Guard] Using main content as fallback, inserting warning');
    }
    mainContent.insertBefore(warning, mainContent.firstChild);
    setupWarningObserver(warning);
    startWarningCheckInterval();
    hasAnnounced = true;
    return;
  }
  
  // If we can't find a place to insert, log and don't show warning
  if (DEV_MODE) {
    console.error('[PR Guard] Could not find any suitable container to insert warning');
    console.error('[PR Guard] Textarea:', textarea);
    console.error('[PR Guard] Container:', container);
    console.error('[PR Guard] Main content:', mainContent);
  }
  hasAnnounced = false;
}

/**
 * Validate and show warning if needed
 * Handles both textarea (edit mode) and rendered description (read-only view)
 * Includes throttling to prevent excessive validation runs
 */
function validateAndShow(): void {
  // Prevent concurrent validation runs
  if (isValidationRunning) {
    return;
  }
  
  // Throttle validation to prevent excessive calls
  const now = Date.now();
  if (now - lastValidationTime < VALIDATION_COOLDOWN) {
    return;
  }
  lastValidationTime = now;
  
  isValidationRunning = true;
  
  try {
    // Check if validation is enabled
    if (!settings.enableValidation) {
      removeWarning();
      return;
    }
    
    let description = '';
    
    // First, try to get description from textarea (edit mode)
    const textarea = getDescriptionField();
    if (textarea) {
      description = textarea.value;
    } else {
      // If no textarea, check if we should validate existing PRs
      if (!settings.showOnExistingPRs) {
        removeWarning();
        return;
      }
      
      // Try to get rendered description (read-only view)
      description = getRenderedDescription();
    }
    
    // If we have a textarea, always validate (even if empty - will show EMPTY error)
    // Only skip if we have neither textarea nor description
    if (!textarea && !description) {
      return;
    }
    
    // Always validate if we have a textarea (even if empty)
    // This ensures we show EMPTY error when textarea is empty
    const result = validatePRDescription(description);
    
    if (result.isValid) {
      removeWarning();
      hasAnnounced = false;
      lastValidationErrors = null;
    } else {
      // Only show warning if errors changed (to prevent duplicate warnings)
      const errorsChanged = !lastValidationErrors || 
        lastValidationErrors.length !== result.errors.length ||
        lastValidationErrors.some((e, i) => e.rule !== result.errors[i].rule);
      
      if (errorsChanged) {
        showWarning(result.errors);
      }
    }
  } finally {
    isValidationRunning = false;
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
  const isCreationPage = /\/compare\/|\/pull\/new/.test(location.pathname);
  
  const tryInit = () => {
    try {
      const textarea = getDescriptionField();
      
      if (textarea) {
        if (DEV_MODE) {
          console.log('[PR Guard] Textarea found! ID:', textarea.id, 'Name:', textarea.name, 'Value length:', textarea.value.length);
        }
        // Stop the initial load polling if it's running
        if (initialLoadPollInterval) {
          clearInterval(initialLoadPollInterval);
          initialLoadPollInterval = null;
          if (DEV_MODE) {
            console.log('[PR Guard] Textarea found, stopping initial load polling');
          }
        }
        // Check if already initialized - if so, just run validation (page might have reloaded)
        const isAlreadyInitialized = textarea.dataset.prGuardInitialized === 'true';
        
        if (!isAlreadyInitialized) {
          // Clean up any existing handler for this textarea
          if (validationHandler) {
            textarea.removeEventListener('input', validationHandler);
            textarea.removeEventListener('paste', validationHandler);
          }
          
          // Create debounced validation handler
          validationHandler = debounce(validateAndShow, 300);
          
          // Attach event listeners with error handling
          try {
            textarea.addEventListener('input', validationHandler, { passive: true });
            textarea.addEventListener('paste', validationHandler, { passive: true });
            // Also listen to 'change' event as a fallback
            textarea.addEventListener('change', validationHandler, { passive: true });
            
            if (DEV_MODE) {
              console.log('[PR Guard] Event listeners attached to textarea');
            }
          } catch (error) {
            if (DEV_MODE) {
              console.warn('[PR Guard] Failed to attach event listeners:', error);
            }
            return; // Don't mark as initialized if listeners failed
          }
          
          // Mark as initialized for this specific textarea
          textarea.dataset.prGuardInitialized = 'true';
          document.body.classList.add('pr-guard-initialized');
        } else {
          // If already initialized, verify listeners are still attached
          // Sometimes GitHub replaces the textarea, breaking listeners
          if (DEV_MODE) {
            console.log('[PR Guard] Textarea already initialized, verifying listeners');
          }
        }
        
        // Always run initial validation (even if already initialized, content might have changed)
        // Run immediately and also after a small delay to ensure DOM is ready for insertion
        if (DEV_MODE) {
          console.log('[PR Guard] Running initial validation, textarea value length:', textarea.value.length);
        }
        
        // Run validation immediately
        validateAndShow();
        
        // Run once more after a short delay to ensure DOM is ready for warning insertion
        // Only one delayed check to prevent excessive validation
        setTimeout(() => {
          if (isPRPage() && getDescriptionField() === textarea && !isValidationRunning) {
            validateAndShow();
          }
        }, 200);
      } else if (!textarea && retries < maxRetries) {
        retries++;
        if (DEV_MODE) {
          console.log(`[PR Guard] Textarea not found, retry ${retries}/${maxRetries}`);
          // On PR creation pages, log more details
          const isCreationPage = /\/compare\/|\/pull\/new/.test(location.pathname);
          if (isCreationPage && retries % 3 === 0) {
            const allTextareas = document.querySelectorAll('textarea');
            console.log(`[PR Guard] Retry ${retries}: Found ${allTextareas.length} textarea(s) on page`);
            if (allTextareas.length > 0) {
              allTextareas.forEach((ta, idx) => {
                const textarea = ta as HTMLTextAreaElement;
                console.log(`[PR Guard]   Textarea ${idx + 1}: id="${textarea.id}", name="${textarea.name}", parent="${textarea.parentElement?.tagName}"`);
              });
            }
          }
        }
        setTimeout(tryInit, 500);
      } else if (!textarea) {
        // Don't warn if we're on an existing PR page (description might be read-only)
        // Only warn if we're on a PR creation page
        const isCreationPage = /\/compare\/|\/pull\/new/.test(location.pathname);
        if (DEV_MODE) {
          if (isCreationPage) {
            console.warn('[PR Guard] Could not find description field after retries');
            console.warn('[PR Guard] Current pathname:', location.pathname);
            const allTextareas = document.querySelectorAll('textarea');
            console.warn('[PR Guard] Available textareas:', allTextareas.length);
            if (allTextareas.length > 0) {
              console.warn('[PR Guard] Textarea details:');
              allTextareas.forEach((ta, idx) => {
                const textarea = ta as HTMLTextAreaElement;
                console.warn(`[PR Guard]   ${idx + 1}. id="${textarea.id}", name="${textarea.name}", classes="${textarea.className}"`);
                console.warn(`[PR Guard]      parent: ${textarea.parentElement?.tagName}.${textarea.parentElement?.className}`);
                console.warn(`[PR Guard]      form action: ${textarea.closest('form')?.getAttribute('action') || 'none'}`);
              });
            }
          } else {
            console.log('[PR Guard] On existing PR page, no textarea found (expected for read-only view)');
          }
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
 * Start continuous polling for textarea on PR creation pages
 * This is separate from initializeGuard to avoid recursion
 */
function startInitialLoadPolling(): void {
  const isCreationPage = /\/compare\/|\/pull\/new/.test(location.pathname);
  
  // Only start polling on PR creation pages and if not already polling
  if (isCreationPage && !initialLoadPollInterval) {
    if (DEV_MODE) {
      console.log('[PR Guard] Starting continuous polling for textarea on PR creation page');
    }
    let pollAttempts = 0;
    const maxPollAttempts = 150; // 30 seconds at 200ms intervals
    
    initialLoadPollInterval = setInterval(() => {
      pollAttempts++;
      const textarea = getDescriptionField();
      
      if (textarea && !textarea.dataset.prGuardInitialized) {
        if (DEV_MODE) {
          console.log(`[PR Guard] Textarea found via continuous polling (attempt ${pollAttempts}), initializing...`);
        }
        // Stop polling
        if (initialLoadPollInterval) {
          clearInterval(initialLoadPollInterval);
          initialLoadPollInterval = null;
        }
        // Initialize the guard (this will set up listeners and validate)
        initializeGuard();
      } else if (pollAttempts >= maxPollAttempts) {
        // Stop polling after max attempts
        if (initialLoadPollInterval) {
          clearInterval(initialLoadPollInterval);
          initialLoadPollInterval = null;
          if (DEV_MODE) {
            console.log('[PR Guard] Stopped continuous polling after max attempts');
          }
        }
      }
    }, 200); // Check every 200ms
  }
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
    
    // Disconnect warning observer
    if (warningObserver) {
      warningObserver.disconnect();
      warningObserver = null;
    }
    
    // Stop warning check interval
    stopWarningCheckInterval();
    
    // Stop initial load polling
    if (initialLoadPollInterval) {
      clearInterval(initialLoadPollInterval);
      initialLoadPollInterval = null;
    }
    
    // Remove event listeners
    if (popstateHandler) {
      window.removeEventListener('popstate', popstateHandler);
      popstateHandler = null;
    }
    
    if (turboLoadHandler) {
      document.removeEventListener('turbo:load', turboLoadHandler);
      document.removeEventListener('turbo:render', turboLoadHandler);
      document.removeEventListener('pjax:end', turboLoadHandler);
      document.removeEventListener('page:load', turboLoadHandler);
      turboLoadHandler = null;
    }
    
    if (createPRButtonHandler) {
      document.removeEventListener('click', createPRButtonHandler, true);
      createPRButtonHandler = null;
    }
    
    // Restore original history methods if we intercepted them
    // Note: We can't fully restore, but this is okay as we're cleaning up
    
    document.body.classList.remove('pr-guard-initialized');
    document.body.classList.remove('pr-guard-rendered-validated');
    delete document.body.dataset.prGuardTextareaWarningLogged; // Reset warning log flag
    delete document.body.dataset.prGuardContentReplacementWarningLogged; // Reset content replacement warning flag
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
    // Check more frequently for SPA navigation (1 second instead of 2)
    navigationInterval = setInterval(() => {
      handleNavigation();
      if (!isPRPage()) {
        if (navigationInterval) {
          clearInterval(navigationInterval);
          navigationInterval = null;
        }
      }
    }, 1000); // Reduced from 2000ms to 1000ms for faster SPA detection
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
      if (DEV_MODE) {
        console.log('[PR Guard] Navigation detected:', currentPath, '→', newPath);
      }
      
      // Cleanup first before navigating to new page
      cleanup();
      
      currentPath = newPath;
      
      if (isPRPage(newPath)) {
        // Start navigation interval if not already running
        manageNavigationInterval();
        
        // Initialize immediately (no debounce) for SPA navigation
        // The cleanup above ensures we start fresh
        if (initTimeout) {
          clearTimeout(initTimeout);
        }
        initTimeout = setTimeout(() => {
          if (DEV_MODE) {
            console.log('[PR Guard] Initializing after SPA navigation to:', newPath);
          }
          // Use retry logic for SPA navigation as DOM might not be ready
          // More aggressive retries for better detection
          let retries = 0;
          const maxRetries = 15; // Increased from 10
          const retryInterval = 150; // Faster retries (150ms instead of 200ms)
          
          const tryInit = () => {
            const textarea = getDescriptionField();
            if (textarea) {
              initializeGuard();
              if (DEV_MODE && retries > 0) {
                console.log(`[PR Guard] Initialized after ${retries} retries`);
              }
            } else if (retries < maxRetries) {
              retries++;
              if (DEV_MODE && retries % 3 === 0) { // Log every 3rd retry to reduce noise
                console.log(`[PR Guard] Retry ${retries}/${maxRetries} - waiting for textarea...`);
              }
              setTimeout(tryInit, retryInterval);
            } else {
              if (DEV_MODE) {
                console.warn('[PR Guard] Failed to find textarea after navigation');
              }
            }
          };
          
          tryInit();
        }, 0); // No delay - start immediately
      } else {
        // Not on PR page, cleanup already done above
        if (navigationInterval) {
          clearInterval(navigationInterval);
          navigationInterval = null;
        }
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
    if (DEV_MODE) {
      console.log('[PR Guard] safeInit called, isPRPage:', isPRPage());
    }
    if (isPRPage()) {
      if (DEV_MODE) {
        console.log('[PR Guard] On PR page, initializing guard...');
      }
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
    
    // Listen to various SPA navigation events
    // GitHub uses different frameworks, so we listen to multiple events
    document.addEventListener('turbo:load', turboLoadHandler);
    document.addEventListener('turbo:render', turboLoadHandler);
    document.addEventListener('pjax:end', turboLoadHandler); // GitHub's old PJAX
    document.addEventListener('page:load', turboLoadHandler); // Some GitHub pages
    
    // Also intercept pushState/replaceState for immediate detection
    // Use debouncing to prevent rapid re-initialization loops
    // Wrap in try-catch to prevent interfering with GitHub's code
    let navigationDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedHandleNavigation = () => {
      if (navigationDebounceTimeout) {
        clearTimeout(navigationDebounceTimeout);
      }
      navigationDebounceTimeout = setTimeout(() => {
        try {
          handleNavigation();
        } catch (error) {
          // Silently fail to avoid interfering with GitHub
          if (DEV_MODE) {
            console.warn('[PR Guard] Navigation handling error:', error);
          }
        }
      }, 300); // Debounce navigation handling
    };
    
    try {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      history.pushState = function(...args: Parameters<typeof history.pushState>) {
        try {
          originalPushState.apply(history, args);
          if (DEV_MODE) {
            console.log('[PR Guard] pushState intercepted:', args[2]);
          }
          // Use debounced handler to prevent loops
          debouncedHandleNavigation();
        } catch (error) {
          // If our interception fails, still call original to not break GitHub
          if (DEV_MODE) {
            console.warn('[PR Guard] pushState interception error:', error);
          }
          originalPushState.apply(history, args);
        }
      };
      
      history.replaceState = function(...args: Parameters<typeof history.replaceState>) {
        try {
          originalReplaceState.apply(history, args);
          if (DEV_MODE) {
            console.log('[PR Guard] replaceState intercepted:', args[2]);
          }
          // Use debounced handler to prevent loops
          debouncedHandleNavigation();
        } catch (error) {
          // If our interception fails, still call original to not break GitHub
          if (DEV_MODE) {
            console.warn('[PR Guard] replaceState interception error:', error);
          }
          originalReplaceState.apply(history, args);
        }
      };
    } catch (error) {
      // If we can't intercept history API, that's okay - we have other detection methods
      if (DEV_MODE) {
        console.warn('[PR Guard] Could not intercept history API:', error);
      }
    }
    
    // Fallback: MutationObserver for textarea appearance and rendered description changes
    // Also detects SPA navigation when main content is replaced
    // Use debouncing to prevent excessive checks
    let mutationDebounceTimeout: ReturnType<typeof setTimeout> | null = null;
    mutationObserver = new MutationObserver((mutations) => {
      if (!isPRPage()) {
        return; // Not on PR page, ignore mutations
      }
      
      // Debounce mutation handling to prevent excessive checks
      if (mutationDebounceTimeout) {
        clearTimeout(mutationDebounceTimeout);
      }
      mutationDebounceTimeout = setTimeout(() => {
        const textarea = getDescriptionField();
        const hasRenderedDescription = getRenderedDescription().length > 0 || getDescriptionContainer() !== null;
        
        // Check if textarea was added or replaced (GitHub might replace it dynamically)
        // Also check if main content area was replaced (SPA navigation)
        let textareaAdded = false;
        let mainContentReplaced = false;
        
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            for (const node of Array.from(mutation.addedNodes)) {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const element = node as Element;
                // Check if a textarea was added or if it's within the added node
                if (element.tagName === 'TEXTAREA' || element.querySelector('textarea')) {
                  textareaAdded = true;
                }
                // Check if main content area was replaced (common in SPA navigation)
                // GitHub uses classes like 'js-navigation-container', 'repository-content', etc.
                if (element.matches && (
                  element.matches('main, .js-navigation-container, .repository-content, [role="main"]') ||
                  element.querySelector('main, .js-navigation-container, .repository-content, [role="main"]')
                )) {
                  mainContentReplaced = true;
                  if (DEV_MODE) {
                    console.log('[PR Guard] Main content replaced (SPA navigation detected)');
                  }
                }
              }
            }
          }
        }
        
        // If main content was replaced, re-initialize everything
        if (mainContentReplaced) {
          if (DEV_MODE) {
            console.log('[PR Guard] Re-initializing due to main content replacement');
          }
          cleanup();
          // Use retry logic for content replacement - more aggressive
          let retries = 0;
          const maxRetries = 15; // Increased retries
          const retryInterval = 150; // Faster retries
          
          const tryInit = () => {
            if (!isPRPage()) {
              return; // No longer on PR page
            }
            const textarea = getDescriptionField();
            if (textarea) {
              initializeGuard();
              if (DEV_MODE && retries > 0) {
                console.log(`[PR Guard] Initialized after content replacement (${retries} retries)`);
              }
            } else if (retries < maxRetries) {
              retries++;
              if (DEV_MODE && retries % 3 === 0) { // Log every 3rd retry to reduce noise
                console.log(`[PR Guard] Content replacement retry ${retries}/${maxRetries} - waiting for textarea...`);
              }
              setTimeout(tryInit, retryInterval);
            } else {
              // Only log once per content replacement to reduce noise
              if (DEV_MODE && !document.body.dataset.prGuardContentReplacementWarningLogged) {
                console.warn('[PR Guard] Failed to find textarea after content replacement');
                document.body.dataset.prGuardContentReplacementWarningLogged = 'true';
              }
            }
          };
          
          // Start immediately, don't wait
          tryInit();
          return;
        }
        
        // If we have a textarea and it's not initialized, initialize it
        // Also re-initialize if textarea was just added (might be a replacement)
        if (textarea && (!textarea.dataset.prGuardInitialized || textareaAdded)) {
          if (DEV_MODE) {
            console.log('[PR Guard] Textarea detected in MutationObserver, initializing...');
          }
          // Reset initialization state if textarea changed (e.g., edit mode activated or replaced)
          if (document.body.classList.contains('pr-guard-initialized')) {
            document.body.classList.remove('pr-guard-initialized');
          }
          // Clear the initialization flag so it can be re-initialized
          textarea.dataset.prGuardInitialized = 'false';
          // Small delay to ensure textarea is fully ready
          setTimeout(() => {
            initializeGuard();
          }, 50);
        }
        // If we have a rendered description (read-only view), validate it
        else if (!textarea && hasRenderedDescription && !document.body.classList.contains('pr-guard-rendered-validated')) {
          // Validate rendered description (read-only view)
          validateAndShow();
          document.body.classList.add('pr-guard-rendered-validated');
        }
      }, 500); // Debounce mutation handling by 500ms to prevent excessive checks
    });
    
    // Watch for changes in the document (including when edit button is clicked)
    // Observe the main content area, not entire document to reduce noise
    const mainContent = document.querySelector('main, .repository-content, .js-navigation-container, #js-repo-pjax-container');
    if (mainContent) {
      mutationObserver.observe(mainContent, {
        childList: true,
        subtree: true // Need subtree: true to catch edit form appearance and description changes
      });
    } else {
      // Fallback to body if main content not found, but with limited subtree
      mutationObserver.observe(document.body, {
        childList: true,
        subtree: false // Only direct children to reduce noise
      });
    }
    
    // Immediately check if textarea already exists (for initial page load)
    // This ensures we don't miss textareas that are already in the DOM
    setTimeout(() => {
      if (isPRPage()) {
        const textarea = getDescriptionField();
        if (textarea && !textarea.dataset.prGuardInitialized) {
          if (DEV_MODE) {
            console.log('[PR Guard] Textarea found in immediate MutationObserver check, initializing...');
          }
          initializeGuard();
        } else if (!textarea) {
          // Check for rendered description (read-only view)
          const description = getRenderedDescription();
          const container = getDescriptionContainer();
          if ((description || container) && !document.body.classList.contains('pr-guard-rendered-validated')) {
            if (DEV_MODE) {
              console.log('[PR Guard] Rendered description found in immediate check, validating...');
            }
            validateAndShow();
            document.body.classList.add('pr-guard-rendered-validated');
          }
        }
      }
    }, 0);
    
    // CRITICAL: Also listen for clicks on "Create pull request" button
    // This catches navigation that might not trigger URL changes immediately
    createPRButtonHandler = (event: Event) => {
      const target = event.target as HTMLElement;
      if (!target) return;
      
      // Check if clicked element or its parent is a "Create pull request" button
      const button = target.closest('button[type="submit"], button.btn-primary, [data-testid*="create"], [aria-label*="Create pull request"]');
      if (button) {
        const buttonText = button.textContent?.toLowerCase() || '';
        if (buttonText.includes('create pull request') || buttonText.includes('create draft pull request')) {
          if (DEV_MODE) {
            console.log('[PR Guard] Create PR button clicked, watching for form...');
          }
          
          // Immediately check if we're on a PR page
          // Then aggressively watch for textarea to appear
          const checkForForm = () => {
            if (isPRPage()) {
              const textarea = getDescriptionField();
              if (textarea) {
                if (DEV_MODE) {
                  console.log('[PR Guard] PR form detected after button click, initializing...');
                }
                cleanup();
                setTimeout(() => {
                  initializeGuard();
                }, 100);
              } else {
                // Retry checking for form (GitHub might load it asynchronously)
                setTimeout(checkForForm, 200);
              }
            }
          };
          
          // Start checking immediately and continue for up to 3 seconds
          checkForForm();
          setTimeout(checkForForm, 300);
          setTimeout(checkForForm, 600);
          setTimeout(checkForForm, 1000);
          setTimeout(checkForForm, 2000);
          setTimeout(checkForForm, 3000);
        }
      }
    };
    
    document.addEventListener('click', createPRButtonHandler, true); // Use capture phase to catch events early
    
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

/**
 * Initialize immediately and also on DOM ready events
 * This ensures the extension works on initial page load without refresh
 */
function startInitialization(): void {
  // Try immediate initialization (for pages that are already loaded)
  safeInit();
  
  // Also initialize when DOM is ready (for pages still loading)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (DEV_MODE) {
        console.log('[PR Guard] DOMContentLoaded - initializing...');
      }
      safeInit();
    });
  }
  
  // Also initialize on window load (for pages with async content)
  if (document.readyState !== 'complete') {
    window.addEventListener('load', () => {
      if (DEV_MODE) {
        console.log('[PR Guard] Window load - initializing...');
      }
      // Small delay to ensure all GitHub scripts have run
      setTimeout(() => {
        safeInit();
      }, 100);
    });
  }
  
  // Additional immediate check after a short delay
  // This catches cases where GitHub loads content asynchronously
  setTimeout(() => {
    if (isPRPage()) {
      const textarea = getDescriptionField();
      if (!textarea && !document.body.classList.contains('pr-guard-initialized')) {
        if (DEV_MODE) {
          console.log('[PR Guard] Delayed initialization check - textarea not found yet...');
        }
        safeInit();
      }
    }
  }, 500);
  
  // One more check after a longer delay for slow-loading pages
  setTimeout(() => {
    if (isPRPage()) {
      const textarea = getDescriptionField();
      if (!textarea && !document.body.classList.contains('pr-guard-initialized')) {
        if (DEV_MODE) {
          console.log('[PR Guard] Final delayed initialization check - textarea not found yet...');
        }
        safeInit();
      }
    }
  }, 2000);
  
  // For PR creation pages, ensure continuous polling starts even if textarea not found initially
  const isCreationPage = /\/compare\/|\/pull\/new/.test(location.pathname);
  if (isCreationPage) {
    setTimeout(() => {
      const textarea = getDescriptionField();
      if (!textarea && !initialLoadPollInterval) {
        if (DEV_MODE) {
          console.log('[PR Guard] Starting continuous polling for PR creation page (textarea not found initially)');
        }
        // Start polling directly
        startInitialLoadPolling();
      }
    }, 1000);
  }
}

// Log extension startup only in dev mode
if (DEV_MODE) {
  console.log('[PR Guard] Extension loaded, starting initialization...');
}

// Start initialization
startInitialization();
