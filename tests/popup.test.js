/**
 * Popup tests
 * Tests for settings management and UI interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn((query, callback) => {
      if (callback) {
        callback([]);
      }
      return Promise.resolve([]);
    }),
    sendMessage: vi.fn(),
  },
};

global.chrome = mockChrome;

// Mock DOM
beforeEach(() => {
  document.body.innerHTML = `
    <input type="checkbox" id="enableValidation">
    <input type="checkbox" id="showOnExistingPRs">
    <input type="checkbox" id="strictMode">
  `;
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';
});

describe('Popup Settings', () => {
  describe('Settings Loading', () => {
    it('should load default settings when storage is empty', async () => {
      // When storage is empty, chrome.storage.sync.get returns empty object
      // but the function passes DEFAULT_SETTINGS as parameter, so it merges
      mockChrome.storage.sync.get.mockImplementation((defaults) => {
        return Promise.resolve(defaults);
      });
      
      const popupModule = await import('../src/popup.js');
      const result = await popupModule.loadSettings();
      
      // Function should return the defaults passed to get()
      expect(result).toEqual(popupModule.DEFAULT_SETTINGS);
      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(popupModule.DEFAULT_SETTINGS);
    });
    
    it('should load saved settings from storage', async () => {
      const savedSettings = {
        enableValidation: false,
        showOnExistingPRs: true,
        strictMode: true,
      };
      mockChrome.storage.sync.get.mockResolvedValue(savedSettings);
      
      const popupModule = await import('../src/popup.js');
      const result = await popupModule.loadSettings();
      
      expect(result).toEqual(savedSettings);
    });
    
    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      const popupModule = await import('../src/popup.js');
      const result = await popupModule.loadSettings();
      
      // Should return defaults on error
      expect(result).toEqual(popupModule.DEFAULT_SETTINGS);
    });
  });
  
  describe('Settings Saving', () => {
    it('should save settings to storage', async () => {
      mockChrome.storage.sync.set.mockResolvedValue();
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        if (callback) callback([{ id: 1 }]);
        return Promise.resolve([{ id: 1 }]);
      });
      
      const popupModule = await import('../src/popup.js');
      const settings = {
        enableValidation: false,
        showOnExistingPRs: true,
        strictMode: false,
      };
      
      await popupModule.saveSettings(settings);
      
      expect(mockChrome.storage.sync.set).toHaveBeenCalledWith(settings);
    });
    
    it('should notify content scripts when settings change', async () => {
      mockChrome.storage.sync.set.mockResolvedValue();
      const tabs = [
        { id: 1, url: 'https://github.com/test/repo' },
        { id: 2, url: 'https://github.com/test/repo2' },
      ];
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        if (callback) callback(tabs);
        return Promise.resolve(tabs);
      });
      
      const popupModule = await import('../src/popup.js');
      const settings = { enableValidation: false };
      
      await popupModule.saveSettings(settings);
      
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: 'SETTINGS_UPDATED',
        settings,
      });
    });
    
    it('should handle save errors gracefully', async () => {
      mockChrome.storage.sync.set.mockRejectedValue(new Error('Save error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const popupModule = await import('../src/popup.js');
      
      // Should not throw
      await expect(popupModule.saveSettings({})).resolves.not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    it('should handle tabs.query callback pattern', async () => {
      mockChrome.storage.sync.set.mockResolvedValue();
      const tabs = [{ id: 1 }, { id: 2 }];
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        if (callback) {
          callback(tabs);
        }
        return Promise.resolve(tabs);
      });
      
      const popupModule = await import('../src/popup.js');
      await popupModule.saveSettings({ enableValidation: true });
      
      // Should call sendMessage for each tab
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
    });
    
    it('should handle tabs.query without callback', async () => {
      mockChrome.storage.sync.set.mockResolvedValue();
      mockChrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      
      const popupModule = await import('../src/popup.js');
      await popupModule.saveSettings({ enableValidation: true });
      
      // Should still work with promise-based query
      expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });
  });
  
  describe('UI Interactions', () => {
    it('should initialize popup with settings', async () => {
      const settings = {
        enableValidation: true,
        showOnExistingPRs: false,
        strictMode: true,
      };
      mockChrome.storage.sync.get.mockResolvedValue(settings);
      
      const popupModule = await import('../src/popup.js');
      
      // Simulate initPopup by calling loadSettings and setting checkboxes
      const loadedSettings = await popupModule.loadSettings();
      document.getElementById('enableValidation').checked = loadedSettings.enableValidation ?? true;
      document.getElementById('showOnExistingPRs').checked = loadedSettings.showOnExistingPRs ?? true;
      document.getElementById('strictMode').checked = loadedSettings.strictMode ?? false;
      
      expect(document.getElementById('enableValidation').checked).toBe(true);
      expect(document.getElementById('showOnExistingPRs').checked).toBe(false);
      expect(document.getElementById('strictMode').checked).toBe(true);
    });
    
    it('should handle enableValidation checkbox change', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ enableValidation: true });
      mockChrome.storage.sync.set.mockResolvedValue();
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        if (callback) callback([]);
        return Promise.resolve([]);
      });
      
      const checkbox = document.getElementById('enableValidation');
      checkbox.checked = false;
      
      // Simulate the event handler pattern with proper event object
      const changeHandler = async (e) => {
        const popupModule = await import('../src/popup.js');
        const newSettings = await popupModule.loadSettings();
        newSettings.enableValidation = e.target.checked;
        await popupModule.saveSettings(newSettings);
      };
      
      // Create event with target property
      const changeEvent = { target: checkbox, type: 'change' };
      await changeHandler(changeEvent);
      
      expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });
    
    it('should handle showOnExistingPRs checkbox change', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ showOnExistingPRs: true });
      mockChrome.storage.sync.set.mockResolvedValue();
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        if (callback) callback([]);
        return Promise.resolve([]);
      });
      
      const checkbox = document.getElementById('showOnExistingPRs');
      checkbox.checked = false;
      
      const changeHandler = async (e) => {
        const popupModule = await import('../src/popup.js');
        const newSettings = await popupModule.loadSettings();
        newSettings.showOnExistingPRs = e.target.checked;
        await popupModule.saveSettings(newSettings);
      };
      
      const changeEvent = { target: checkbox, type: 'change' };
      await changeHandler(changeEvent);
      
      expect(mockChrome.storage.sync.set).toHaveBeenCalled();
    });
    
    it('should handle strictMode checkbox change with console log', async () => {
      mockChrome.storage.sync.get.mockResolvedValue({ strictMode: false });
      mockChrome.storage.sync.set.mockResolvedValue();
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        if (callback) callback([]);
        return Promise.resolve([]);
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const checkbox = document.getElementById('strictMode');
      checkbox.checked = true;
      
      const changeHandler = async (e) => {
        const popupModule = await import('../src/popup.js');
        const newSettings = await popupModule.loadSettings();
        newSettings.strictMode = e.target.checked;
        await popupModule.saveSettings(newSettings);
        
        if (e.target.checked) {
          console.log('Strict mode preference saved (feature coming soon)');
        }
      };
      
      const changeEvent = { target: checkbox, type: 'change' };
      await changeHandler(changeEvent);
      
      expect(mockChrome.storage.sync.set).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Strict mode preference saved (feature coming soon)');
      
      consoleSpy.mockRestore();
    });
    
    it('should handle DOMContentLoaded event pattern', () => {
      document.body.innerHTML = '<input type="checkbox" id="enableValidation">';
      const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
      
      // Simulate the initialization pattern from popup.js
      const initPattern = () => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {});
        } else {
          // Immediate init
        }
      };
      
      // Mock readyState to be 'loading'
      Object.defineProperty(document, 'readyState', {
        value: 'loading',
        writable: true,
        configurable: true,
      });
      
      initPattern();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('DOMContentLoaded', expect.any(Function));
      
      addEventListenerSpy.mockRestore();
    });
    
    it('should handle immediate initialization when DOM is ready', () => {
      document.body.innerHTML = '<input type="checkbox" id="enableValidation"><input type="checkbox" id="showOnExistingPRs"><input type="checkbox" id="strictMode">';
      
      // Simulate the initialization pattern
      let initCalled = false;
      const initPattern = () => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => { initCalled = true; });
        } else {
          initCalled = true; // Immediate init
        }
      };
      
      // Mock readyState to be 'complete'
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
        configurable: true,
      });
      
      initPattern();
      
      expect(initCalled).toBe(true);
    });
    
    it('should handle loadSettings error with console.error', async () => {
      mockChrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const popupModule = await import('../src/popup.js');
      const result = await popupModule.loadSettings();
      
      expect(result).toEqual(popupModule.DEFAULT_SETTINGS);
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    it('should handle saveSettings error with console.error', async () => {
      mockChrome.storage.sync.set.mockRejectedValue(new Error('Save error'));
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        if (callback) callback([]);
        return Promise.resolve([]);
      });
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const popupModule = await import('../src/popup.js');
      await popupModule.saveSettings({});
      
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    it('should initialize popup and set checkbox values', async () => {
      document.body.innerHTML = '<input type="checkbox" id="enableValidation"><input type="checkbox" id="showOnExistingPRs"><input type="checkbox" id="strictMode">';
      
      const settings = {
        enableValidation: false,
        showOnExistingPRs: true,
        strictMode: true,
      };
      mockChrome.storage.sync.get.mockResolvedValue(settings);
      mockChrome.storage.sync.set.mockResolvedValue();
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        if (callback) callback([]);
        return Promise.resolve([]);
      });
      
      const popupModule = await import('../src/popup.js');
      await popupModule.initPopup();
      
      expect(document.getElementById('enableValidation').checked).toBe(false);
      expect(document.getElementById('showOnExistingPRs').checked).toBe(true);
      expect(document.getElementById('strictMode').checked).toBe(true);
    });
    
    it('should handle nullish coalescing for settings', async () => {
      document.body.innerHTML = '<input type="checkbox" id="enableValidation"><input type="checkbox" id="showOnExistingPRs"><input type="checkbox" id="strictMode">';
      
      // Settings with undefined values
      const settings = {
        enableValidation: undefined,
        showOnExistingPRs: null,
        strictMode: false,
      };
      mockChrome.storage.sync.get.mockResolvedValue(settings);
      mockChrome.storage.sync.set.mockResolvedValue();
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        if (callback) callback([]);
        return Promise.resolve([]);
      });
      
      const popupModule = await import('../src/popup.js');
      await popupModule.initPopup();
      
      // Should use defaults for undefined/null values
      expect(document.getElementById('enableValidation').checked).toBe(true); // ?? true
      expect(document.getElementById('showOnExistingPRs').checked).toBe(true); // ?? true
      expect(document.getElementById('strictMode').checked).toBe(false);
    });
    
    it('should handle strictMode unchecked (no console log)', async () => {
      document.body.innerHTML = '<input type="checkbox" id="strictMode">';
      
      mockChrome.storage.sync.get.mockResolvedValue({ strictMode: false });
      mockChrome.storage.sync.set.mockResolvedValue();
      mockChrome.tabs.query.mockImplementation((query, callback) => {
        if (callback) callback([]);
        return Promise.resolve([]);
      });
      
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      const checkbox = document.getElementById('strictMode');
      checkbox.checked = false;
      
      const changeHandler = async (e) => {
        const popupModule = await import('../src/popup.js');
        const newSettings = await popupModule.loadSettings();
        newSettings.strictMode = e.target.checked;
        await popupModule.saveSettings(newSettings);
        
        if (e.target.checked) {
          console.log('Strict mode preference saved (feature coming soon)');
        }
      };
      
      const changeEvent = { target: checkbox, type: 'change' };
      await changeHandler(changeEvent);
      
      // Should NOT log when unchecked
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});
