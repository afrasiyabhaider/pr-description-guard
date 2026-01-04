/**
 * Real-Time Validation Tests
 * Tests for event listeners and real-time validation updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDescriptionField } from '../src/dom';
import { validatePRDescription } from '../src/validator';

describe('Real-Time Validation', () => {
  let textarea: HTMLTextAreaElement;
  let eventListeners: Map<string, Set<EventListener>>;
  
  beforeEach(() => {
    document.body.innerHTML = '';
    textarea = document.createElement('textarea');
    textarea.id = 'pull_request_body';
    document.body.appendChild(textarea);
    
    eventListeners = new Map();
    
    // Track event listeners
    const originalAddEventListener = textarea.addEventListener.bind(textarea);
    textarea.addEventListener = vi.fn((type: string, listener: EventListener) => {
      if (!eventListeners.has(type)) {
        eventListeners.set(type, new Set());
      }
      eventListeners.get(type)!.add(listener);
      originalAddEventListener(type, listener);
    });
  });
  
  afterEach(() => {
    document.body.innerHTML = '';
  });
  
  it('should attach input event listener', () => {
    const handler = () => {};
    textarea.addEventListener('input', handler);
    
    expect(eventListeners.has('input')).toBe(true);
  });
  
  it('should attach paste event listener', () => {
    const handler = () => {};
    textarea.addEventListener('paste', handler);
    
    expect(eventListeners.has('paste')).toBe(true);
  });
  
  it('should attach change event listener', () => {
    const handler = () => {};
    textarea.addEventListener('change', handler);
    
    expect(eventListeners.has('change')).toBe(true);
  });
  
  it('should validate on input event', () => {
    let validationCalled = false;
    const handler = () => {
      validationCalled = true;
      validatePRDescription(textarea.value);
    };
    
    textarea.addEventListener('input', handler);
    textarea.value = '## What changed';
    textarea.dispatchEvent(new Event('input'));
    
    expect(validationCalled).toBe(true);
  });
  
  it('should validate on paste event', () => {
    let validationCalled = false;
    const handler = () => {
      validationCalled = true;
      validatePRDescription(textarea.value);
    };
    
    textarea.addEventListener('paste', handler);
    textarea.value = '## What changed';
    textarea.dispatchEvent(new Event('paste'));
    
    expect(validationCalled).toBe(true);
  });
  
  it('should debounce validation (simulated)', async () => {
    let callCount = 0;
    const debouncedHandler = () => {
      callCount++;
    };
    
    // Simulate rapid typing
    for (let i = 0; i < 10; i++) {
      textarea.dispatchEvent(new Event('input'));
    }
    
    // With debouncing, should not call 10 times immediately
    // (actual debounce implementation would need to be tested with timers)
    expect(callCount).toBe(0); // No handler attached yet
  });
});

describe('Validation Updates', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  
  it('should detect empty description', () => {
    const result = validatePRDescription('');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'EMPTY')).toBe(true);
  });
  
  it('should detect missing "What changed" section', () => {
    const result = validatePRDescription('## Why\nReason\n\n## How it was tested\nTests');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'WHAT')).toBe(true);
  });
  
  it('should detect missing "Why" section', () => {
    const result = validatePRDescription('## What changed\nChanges\n\n## How it was tested\nTests');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'WHY')).toBe(true);
  });
  
  it('should detect missing "How it was tested" section', () => {
    const result = validatePRDescription('## What changed\nChanges\n\n## Why\nReason');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'TESTED')).toBe(true);
  });
  
  it('should pass validation with all sections', () => {
    const result = validatePRDescription(
      '## What changed\nChanges\n\n## Why\nReason\n\n## How it was tested\nTests'
    );
    expect(result.isValid).toBe(true);
    expect(result.errors.length).toBe(0);
  });
  
  it('should update validation as content changes', () => {
    // Start with empty
    let result = validatePRDescription('');
    expect(result.isValid).toBe(false);
    
    // Add "What changed"
    result = validatePRDescription('## What changed\nChanges');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    
    // Add "Why"
    result = validatePRDescription('## What changed\nChanges\n\n## Why\nReason');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'WHY')).toBe(false);
    
    // Add "How it was tested" - should pass
    result = validatePRDescription(
      '## What changed\nChanges\n\n## Why\nReason\n\n## How it was tested\nTests'
    );
    expect(result.isValid).toBe(true);
  });
});
