/**
 * Popup script for PR Description Guard
 * Handles settings and UI interactions
 */

// Default settings
const DEFAULT_SETTINGS = {
  enableValidation: true,
  showOnExistingPRs: true,
  strictMode: false,
};

/**
 * Load settings from storage
 */
async function loadSettings() {
  try {
    const result = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    return result;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save settings to storage
 */
async function saveSettings(settings) {
  try {
    await chrome.storage.sync.set(settings);
    // Notify content script of settings change
    chrome.tabs.query({ url: '*://github.com/*' }, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_UPDATED', settings });
      });
    });
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Initialize popup
 */
async function initPopup() {
  // Load and apply settings
  const settings = await loadSettings();
  
  document.getElementById('enableValidation').checked = settings.enableValidation ?? true;
  document.getElementById('showOnExistingPRs').checked = settings.showOnExistingPRs ?? true;
  document.getElementById('strictMode').checked = settings.strictMode ?? false;
  
  // Add event listeners
  document.getElementById('enableValidation').addEventListener('change', async (e) => {
    const newSettings = await loadSettings();
    newSettings.enableValidation = e.target.checked;
    await saveSettings(newSettings);
  });
  
  document.getElementById('showOnExistingPRs').addEventListener('change', async (e) => {
    const newSettings = await loadSettings();
    newSettings.showOnExistingPRs = e.target.checked;
    await saveSettings(newSettings);
  });
  
  document.getElementById('strictMode').addEventListener('change', async (e) => {
    const newSettings = await loadSettings();
    newSettings.strictMode = e.target.checked;
    await saveSettings(newSettings);
    
    // Show info message for future feature
    if (e.target.checked) {
      // This is a future feature, so we'll just save the preference
      console.log('Strict mode preference saved (feature coming soon)');
    }
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPopup);
} else {
  initPopup();
}
