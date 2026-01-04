/**
 * Context Menu tests
 * Tests for context menu creation and click handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    onInstalled: {
      addListener: vi.fn(),
    },
    getURL: vi.fn((path) => `chrome-extension://test-id/${path}`),
  },
  contextMenus: {
    create: vi.fn(),
    removeAll: vi.fn((callback) => {
      if (callback) callback();
    }),
    onClicked: {
      addListener: vi.fn(),
    },
  },
  action: {
    openPopup: vi.fn(),
  },
  tabs: {
    create: vi.fn(),
  },
};

global.chrome = mockChrome;

describe('Context Menu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  describe('Menu Creation', () => {
    it('should create all menu items', async () => {
      const contextMenuModule = await import('../src/context-menu.js');
      contextMenuModule.createContextMenus();
      
      expect(mockChrome.contextMenus.removeAll).toHaveBeenCalled();
      expect(mockChrome.contextMenus.create).toHaveBeenCalledTimes(5);
    });
    
    it('should create main menu item with correct properties', () => {
      const menuItem = {
        id: 'pr-guard-main',
        title: 'PR Description Guard',
        contexts: ['page', 'editable'],
      };
      
      mockChrome.contextMenus.create(menuItem);
      
      expect(mockChrome.contextMenus.create).toHaveBeenCalledWith(menuItem);
      expect(menuItem.id).toBe('pr-guard-main');
      expect(menuItem.title).toBe('PR Description Guard');
    });
    
    it('should create settings submenu item with correct properties', () => {
      const menuItem = {
        id: 'pr-guard-settings',
        parentId: 'pr-guard-main',
        title: 'Settings',
        contexts: ['page', 'editable'],
      };
      
      mockChrome.contextMenus.create(menuItem);
      
      expect(mockChrome.contextMenus.create).toHaveBeenCalledWith(menuItem);
      expect(menuItem.parentId).toBe('pr-guard-main');
      expect(menuItem.title).toBe('Settings');
    });
    
    it('should create about submenu item with correct properties', () => {
      const menuItem = {
        id: 'pr-guard-about',
        parentId: 'pr-guard-main',
        title: 'About',
        contexts: ['page', 'editable'],
      };
      
      mockChrome.contextMenus.create(menuItem);
      
      expect(mockChrome.contextMenus.create).toHaveBeenCalledWith(menuItem);
      expect(menuItem.parentId).toBe('pr-guard-main');
      expect(menuItem.title).toBe('About');
    });
    
    it('should create separator menu item', () => {
      const menuItem = {
        id: 'pr-guard-separator',
        parentId: 'pr-guard-main',
        type: 'separator',
        contexts: ['page', 'editable'],
      };
      
      mockChrome.contextMenus.create(menuItem);
      
      expect(mockChrome.contextMenus.create).toHaveBeenCalledWith(menuItem);
      expect(menuItem.type).toBe('separator');
    });
    
    it('should create buy me coffee submenu item with correct properties', () => {
      const menuItem = {
        id: 'pr-guard-coffee',
        parentId: 'pr-guard-main',
        title: '☕ Buy me a coffee',
        contexts: ['page', 'editable'],
      };
      
      mockChrome.contextMenus.create(menuItem);
      
      expect(mockChrome.contextMenus.create).toHaveBeenCalledWith(menuItem);
      expect(menuItem.parentId).toBe('pr-guard-main');
      expect(menuItem.title).toBe('☕ Buy me a coffee');
    });
  });
  
  describe('Menu Click Handling', () => {
    it('should handle settings menu click', async () => {
      const contextMenuModule = await import('../src/context-menu.js');
      const info = { menuItemId: 'pr-guard-settings' };
      const tab = { id: 1 };
      
      contextMenuModule.handleMenuClick(info, tab);
      
      expect(mockChrome.action.openPopup).toHaveBeenCalled();
    });
    
    it('should handle about menu click', async () => {
      const contextMenuModule = await import('../src/context-menu.js');
      const info = { menuItemId: 'pr-guard-about' };
      const tab = { id: 1 };
      
      contextMenuModule.handleMenuClick(info, tab);
      
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: 'chrome-extension://test-id/src/popup.html',
      });
    });
    
    it('should handle buy me coffee menu click', async () => {
      const contextMenuModule = await import('../src/context-menu.js');
      const info = { menuItemId: 'pr-guard-coffee' };
      const tab = { id: 1 };
      
      contextMenuModule.handleMenuClick(info, tab);
      
      expect(mockChrome.tabs.create).toHaveBeenCalledWith({
        url: 'https://buymeacoffee.com/afrasiyabhaider',
      });
    });
    
    it('should handle unknown menu item IDs', async () => {
      const contextMenuModule = await import('../src/context-menu.js');
      const info = { menuItemId: 'unknown-item' };
      const tab = { id: 1 };
      
      // Should not throw
      expect(() => {
        contextMenuModule.handleMenuClick(info, tab);
      }).not.toThrow();
    });
  });
  
  describe('Menu Registration Pattern', () => {
    it('should register onInstalled listener', () => {
      const listener = vi.fn();
      mockChrome.runtime.onInstalled.addListener(listener);
      
      expect(mockChrome.runtime.onInstalled.addListener).toHaveBeenCalledWith(listener);
    });
    
    it('should register onClicked listener', () => {
      const listener = vi.fn();
      mockChrome.contextMenus.onClicked.addListener(listener);
      
      expect(mockChrome.contextMenus.onClicked.addListener).toHaveBeenCalledWith(listener);
    });
    
    it('should call removeAll before creating menus', () => {
      const callback = vi.fn();
      mockChrome.contextMenus.removeAll(callback);
      
      expect(mockChrome.contextMenus.removeAll).toHaveBeenCalled();
      expect(callback).toHaveBeenCalled();
    });
  });
});
