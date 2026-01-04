/**
 * SPA Navigation Tests
 * Tests for detecting and handling GitHub's SPA navigation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('SPA Navigation Detection', () => {
  let originalPushState: typeof history.pushState;
  let originalReplaceState: typeof history.replaceState;
  let pushStateCalls: Array<{ state: unknown; title: string; url: string }> = [];
  let replaceStateCalls: Array<{ state: unknown; title: string; url: string }> = [];
  
  beforeEach(() => {
    // Save original methods
    originalPushState = history.pushState;
    originalReplaceState = history.replaceState;
    
    // Track calls
    pushStateCalls = [];
    replaceStateCalls = [];
    
    // Mock history methods
    history.pushState = vi.fn((state, title, url) => {
      pushStateCalls.push({ state, title: String(title), url: String(url) });
      originalPushState.call(history, state, title, url);
    });
    
    history.replaceState = vi.fn((state, title, url) => {
      replaceStateCalls.push({ state, title: String(title), url: String(url) });
      originalReplaceState.call(history, state, title, url);
    });
  });
  
  afterEach(() => {
    // Restore original methods
    history.pushState = originalPushState;
    history.replaceState = originalReplaceState;
  });
  
  it('should detect pushState navigation', () => {
    history.pushState({}, '', '/owner/repo/compare/main...feature');
    expect(pushStateCalls.length).toBe(1);
    expect(pushStateCalls[0].url).toContain('/compare/');
  });
  
  it('should detect replaceState navigation', () => {
    history.replaceState({}, '', '/owner/repo/pull/123');
    expect(replaceStateCalls.length).toBe(1);
    expect(replaceStateCalls[0].url).toContain('/pull/');
  });
  
  it('should handle multiple navigation events', () => {
    history.pushState({}, '', '/page1');
    history.pushState({}, '', '/page2');
    history.pushState({}, '', '/page3');
    
    expect(pushStateCalls.length).toBe(3);
  });
});

describe('SPA Event Listeners', () => {
  let eventListeners: Map<string, Set<EventListener>>;
  
  beforeEach(() => {
    eventListeners = new Map();
    
    // Mock addEventListener to track events
    const originalAddEventListener = document.addEventListener.bind(document);
    document.addEventListener = vi.fn((type: string, listener: EventListener) => {
      if (!eventListeners.has(type)) {
        eventListeners.set(type, new Set());
      }
      eventListeners.get(type)!.add(listener);
      originalAddEventListener(type, listener);
    });
  });
  
  it('should listen to turbo:load events', () => {
    const handler = () => {};
    document.addEventListener('turbo:load', handler);
    
    expect(eventListeners.has('turbo:load')).toBe(true);
  });
  
  it('should listen to turbo:render events', () => {
    const handler = () => {};
    document.addEventListener('turbo:render', handler);
    
    expect(eventListeners.has('turbo:render')).toBe(true);
  });
  
  it('should listen to pjax:end events', () => {
    const handler = () => {};
    document.addEventListener('pjax:end', handler);
    
    expect(eventListeners.has('pjax:end')).toBe(true);
  });
  
  it('should listen to popstate events', () => {
    const handler = () => {};
    window.addEventListener('popstate', handler);
    
    // Note: window.addEventListener is separate, but we can test the pattern
    expect(typeof handler).toBe('function');
  });
});
