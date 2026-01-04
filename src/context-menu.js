/**
 * Context menu script for PR Description Guard
 * Creates right-click menu items
 */

/**
 * Create context menu items
 */
function createContextMenus() {
  // Remove existing menu items to avoid duplicates
  chrome.contextMenus.removeAll(() => {
    // Create main menu item
    chrome.contextMenus.create({
      id: 'pr-guard-main',
      title: 'PR Description Guard',
      contexts: ['page', 'editable'],
    });
    
    // Create submenu items
    chrome.contextMenus.create({
      id: 'pr-guard-settings',
      parentId: 'pr-guard-main',
      title: 'Settings',
      contexts: ['page', 'editable'],
    });
    
    chrome.contextMenus.create({
      id: 'pr-guard-separator',
      parentId: 'pr-guard-main',
      type: 'separator',
      contexts: ['page', 'editable'],
    });
    
    chrome.contextMenus.create({
      id: 'pr-guard-coffee',
      parentId: 'pr-guard-main',
      title: '☕ Buy me a coffee',
      contexts: ['page', 'editable'],
    });
  });
}

/**
 * Handle context menu clicks
 */
function handleMenuClick(info, tab) {
  switch (info.menuItemId) {
    case 'pr-guard-settings':
      // Open popup/settings page
      chrome.action.openPopup();
      break;
      
    case 'pr-guard-coffee':
      // Open Buy Me a Coffee page
      chrome.tabs.create({
        url: 'https://buymeacoffee.com/afrasiyabhaider',
      });
      break;
      
    default:
      break;
  }
}

// Create context menu items when extension is installed/updated
chrome.runtime.onInstalled.addListener(createContextMenus);

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(handleMenuClick);

// Export for testing (ES modules)
export { createContextMenus, handleMenuClick };
