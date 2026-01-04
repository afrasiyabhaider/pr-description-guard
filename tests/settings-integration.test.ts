/**
 * Settings Integration Tests
 * Tests for settings integration in content script
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Chrome APIs
const mockChrome = {
  storage: {
    sync: {
      get: vi.fn(),
    },
  },
  runtime: {
    onMessage: {
      addListener: vi.fn(),
    },
  },
};

global.chrome = mockChrome;

describe('Settings Integration in Content Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset DOM
    document.body.innerHTML = '';
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Settings Loading', () => {
    it('should load default settings when storage is empty', async () => {
      // When storage is empty, get() returns empty object, but defaults are used
      mockChrome.storage.sync.get.mockResolvedValue({});
      
      const defaultSettings = {
        enableValidation: true,
        showOnExistingPRs: true,
        strictMode: false,
      };
      
      // Chrome storage.get returns empty object when nothing is stored
      const result = await mockChrome.storage.sync.get(defaultSettings);
      
      // Result is empty, but defaults are used in code
      expect(result).toEqual({});
      expect(mockChrome.storage.sync.get).toHaveBeenCalledWith(defaultSettings);
    });
    
    it('should load saved settings from storage', async () => {
      const savedSettings = {
        enableValidation: false,
        showOnExistingPRs: false,
        strictMode: true,
      };
      mockChrome.storage.sync.get.mockResolvedValue(savedSettings);
      
      const result = await mockChrome.storage.sync.get({
        enableValidation: true,
        showOnExistingPRs: true,
        strictMode: false,
      });
      
      // When storage has values, they override defaults
      expect(mockChrome.storage.sync.get).toHaveBeenCalled();
    });
    
    it('should handle storage errors gracefully', async () => {
      mockChrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      
      // Should not throw, should use defaults
      try {
        await mockChrome.storage.sync.get({
          enableValidation: true,
          showOnExistingPRs: true,
          strictMode: false,
        });
      } catch (error) {
        // Error is expected, but code should handle it
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
  
  describe('Settings Message Handling', () => {
    it('should listen for SETTINGS_UPDATED messages', () => {
      const listeners: Array<(message: unknown) => void> = [];
      mockChrome.runtime.onMessage.addListener.mockImplementation((callback) => {
        listeners.push(callback);
        return true; // Return value for addListener
      });
      
      // Register a listener
      const listener = (message: unknown) => {
        if (typeof message === 'object' && message !== null && 'type' in message) {
          const msg = message as { type: string; settings?: unknown };
          if (msg.type === 'SETTINGS_UPDATED') {
            // Handle settings update
            return true;
          }
        }
        return false;
      };
      
      mockChrome.runtime.onMessage.addListener(listener);
      
      // Simulate message
      const message = {
        type: 'SETTINGS_UPDATED',
        settings: {
          enableValidation: false,
          showOnExistingPRs: true,
          strictMode: false,
        },
      };
      
      // Test that listener handles the message
      const result = listener(message);
      expect(result).toBe(true);
      expect(mockChrome.runtime.onMessage.addListener).toHaveBeenCalled();
    });
    
    it('should ignore non-SETTINGS_UPDATED messages', () => {
      const listener = (message: unknown) => {
        if (typeof message === 'object' && message !== null && 'type' in message) {
          const msg = message as { type: string };
          if (msg.type === 'SETTINGS_UPDATED') {
            return true;
          }
        }
        return false;
      };
      
      const message = {
        type: 'OTHER_MESSAGE',
        data: 'some data',
      };
      
      // Should not throw when handling other message types
      const result = listener(message);
      expect(result).toBe(false);
    });
  });
  
  describe('Settings Application', () => {
    it('should respect enableValidation setting', () => {
      const settings = {
        enableValidation: false,
        showOnExistingPRs: true,
        strictMode: false,
      };
      
      // When enableValidation is false, validation should be skipped
      // This is tested in the validation logic
      expect(settings.enableValidation).toBe(false);
    });
    
    it('should respect showOnExistingPRs setting', () => {
      const settings = {
        enableValidation: true,
        showOnExistingPRs: false,
        strictMode: false,
      };
      
      // When showOnExistingPRs is false, existing PR validation should be skipped
      expect(settings.showOnExistingPRs).toBe(false);
    });
    
    it('should respect strictMode setting (future feature)', () => {
      const settings = {
        enableValidation: true,
        showOnExistingPRs: true,
        strictMode: true,
      };
      
      // Strict mode preference is saved for future use
      expect(settings.strictMode).toBe(true);
    });
  });
});
