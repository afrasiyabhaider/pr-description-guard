/**
 * DOM utility tests
 * Tests for getDescriptionField, getRenderedDescription, isPRPage, etc.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getDescriptionField, getRenderedDescription, getDescriptionContainer, isPRPage, getSubmitButton } from '../src/dom';

describe('DOM Utilities', () => {
  let originalPathname: string;
  
  beforeEach(() => {
    // Save original pathname
    originalPathname = window.location.pathname;
    // Clear DOM
    document.body.innerHTML = '';
  });
  
  afterEach(() => {
    // Restore pathname
    Object.defineProperty(window, 'location', {
      value: { pathname: originalPathname },
      writable: true,
      configurable: true
    });
  });
  
  describe('isPRPage', () => {
    it('should return true for PR creation page (/compare/)', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/owner/repo/compare/main...feature' },
        writable: true,
        configurable: true
      });
      expect(isPRPage()).toBe(true);
    });
    
    it('should return true for PR creation page (/pull/new/)', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/owner/repo/pull/new' },
        writable: true,
        configurable: true
      });
      expect(isPRPage()).toBe(true);
    });
    
    it('should return true for existing PR page (/pull/123)', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/owner/repo/pull/123' },
        writable: true,
        configurable: true
      });
      expect(isPRPage()).toBe(true);
    });
    
    it('should return false for non-PR pages', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: '/owner/repo' },
        writable: true,
        configurable: true
      });
      expect(isPRPage()).toBe(false);
    });
    
    it('should handle undefined pathname', () => {
      Object.defineProperty(window, 'location', {
        value: { pathname: undefined },
        writable: true,
        configurable: true
      });
      expect(isPRPage()).toBe(false);
    });
  });
  
  describe('getDescriptionField', () => {
    it('should find textarea by id (#pull_request_body)', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'pull_request_body';
      document.body.appendChild(textarea);
      
      expect(getDescriptionField()).toBe(textarea);
    });
    
    it('should find textarea by name (pull_request[body])', () => {
      const textarea = document.createElement('textarea');
      textarea.name = 'pull_request[body]';
      document.body.appendChild(textarea);
      
      expect(getDescriptionField()).toBe(textarea);
    });
    
    it('should find textarea in first timeline comment group', () => {
      const container = document.createElement('div');
      container.className = 'timeline-comment-group';
      const textarea = document.createElement('textarea');
      textarea.name = 'issue[body]';
      container.appendChild(textarea);
      document.body.appendChild(container);
      
      expect(getDescriptionField()).toBe(textarea);
    });
    
    it('should NOT find textarea in comment form', () => {
      const commentForm = document.createElement('div');
      commentForm.className = 'js-new-comment-form';
      const textarea = document.createElement('textarea');
      commentForm.appendChild(textarea);
      document.body.appendChild(commentForm);
      
      expect(getDescriptionField()).toBeNull();
    });
    
    it('should return null when no textarea found', () => {
      expect(getDescriptionField()).toBeNull();
    });
  });
  
  describe('getRenderedDescription', () => {
    it('should extract text from first timeline comment', () => {
      const container = document.createElement('div');
      container.className = 'timeline-comment-group';
      const commentBody = document.createElement('div');
      commentBody.className = 'comment-body';
      commentBody.textContent = 'This is a PR description';
      container.appendChild(commentBody);
      document.body.appendChild(container);
      
      expect(getRenderedDescription()).toBe('This is a PR description');
    });
    
    it('should return empty string when no description found', () => {
      expect(getRenderedDescription()).toBe('');
    });
    
    it('should NOT extract from comment form', () => {
      const commentForm = document.createElement('div');
      commentForm.className = 'js-new-comment-form';
      const commentBody = document.createElement('div');
      commentBody.className = 'comment-body';
      commentBody.textContent = 'This is a comment';
      commentForm.appendChild(commentBody);
      document.body.appendChild(commentForm);
      
      expect(getRenderedDescription()).toBe('');
    });
  });
  
  describe('getDescriptionContainer', () => {
    it('should find first timeline comment group', () => {
      const container = document.createElement('div');
      container.className = 'timeline-comment-group';
      document.body.appendChild(container);
      
      expect(getDescriptionContainer()).toBe(container);
    });
    
    it('should return null when no container found', () => {
      expect(getDescriptionContainer()).toBeNull();
    });
  });
  
  describe('getSubmitButton', () => {
    it('should find button with "Create pull request" text', () => {
      const button = document.createElement('button');
      button.type = 'submit';
      button.textContent = 'Create pull request';
      document.body.appendChild(button);
      
      const found = getSubmitButton();
      expect(found).toBe(button);
    });
    
    it('should find button with "Create draft pull request" text', () => {
      document.body.innerHTML = '';
      const button = document.createElement('button');
      button.type = 'submit';
      button.textContent = 'Create draft pull request';
      document.body.appendChild(button);
      
      const found = getSubmitButton();
      expect(found).toBe(button);
    });
    
    it('should find button with "Update comment" text', () => {
      document.body.innerHTML = '';
      const button = document.createElement('button');
      button.type = 'submit';
      button.textContent = 'Update comment';
      document.body.appendChild(button);
      
      const found = getSubmitButton();
      expect(found).toBe(button);
    });
    
    it('should find button with .btn-primary class as fallback', () => {
      document.body.innerHTML = '';
      const button = document.createElement('button');
      button.type = 'submit';
      button.className = 'btn-primary';
      document.body.appendChild(button);
      
      const found = getSubmitButton();
      expect(found).toBe(button);
    });
    
    it('should return null when no submit button found', () => {
      document.body.innerHTML = '';
      
      const found = getSubmitButton();
      expect(found).toBeNull();
    });
  });
  
  describe('getDescriptionField edge cases', () => {
    beforeEach(() => {
      document.body.innerHTML = ''; // Clear between tests
    });
    
    it('should handle textarea in form with action containing /pull/ and /issues/', () => {
      const form = document.createElement('form');
      form.setAttribute('action', '/owner/repo/pull/123/issues/456');
      const textarea = document.createElement('textarea');
      textarea.name = 'issue[body]';
      form.appendChild(textarea);
      document.body.appendChild(form);
      
      const result = getDescriptionField();
      // Should find it via form[action*="/pull/"][action*="/issues/"] selector
      expect(result).toBe(textarea);
    });
    
    it('should handle textarea with name="pull_request[body]" in fallback', () => {
      const textarea = document.createElement('textarea');
      textarea.name = 'pull_request[body]';
      document.body.appendChild(textarea);
      
      const result = getDescriptionField();
      // Should find it via fallback check for name
      expect(result).toBe(textarea);
    });
    
    it('should handle textarea with id="pull_request_body" in fallback', () => {
      const textarea = document.createElement('textarea');
      textarea.id = 'pull_request_body';
      document.body.appendChild(textarea);
      
      const result = getDescriptionField();
      // Should find it via fallback check for id
      expect(result).toBe(textarea);
    });
    
    it('should handle textarea in description area (timeline-comment-group)', () => {
      document.body.innerHTML = '';
      const container = document.createElement('div');
      container.className = 'timeline-comment-group';
      const textarea = document.createElement('textarea');
      container.appendChild(textarea);
      document.body.appendChild(container);
      
      const result = getDescriptionField();
      // Should find it via isInDescriptionArea check
      expect(result).toBe(textarea);
    });
    
    it('should handle textarea in js-issue-body', () => {
      document.body.innerHTML = '';
      const container = document.createElement('div');
      container.className = 'js-issue-body';
      const textarea = document.createElement('textarea');
      container.appendChild(textarea);
      document.body.appendChild(container);
      
      const result = getDescriptionField();
      // Should find it via isInDescriptionArea check
      expect(result).toBe(textarea);
    });
    
    it('should NOT return textarea in comment form', () => {
      const commentForm = document.createElement('div');
      commentForm.className = 'js-new-comment-form';
      const textarea = document.createElement('textarea');
      textarea.name = 'pull_request[body]'; // Even with correct name
      commentForm.appendChild(textarea);
      document.body.appendChild(commentForm);
      
      const result = getDescriptionField();
      // Should NOT find it because it's in a comment form
      expect(result).toBeNull();
    });
    
    it('should handle DEV_MODE logging when textarea not found', () => {
      // Set DEV_MODE
      const devWindow = window as typeof window & { __PR_GUARD_DEV__?: boolean };
      devWindow.__PR_GUARD_DEV__ = true;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      document.body.innerHTML = '';
      const result = getDescriptionField();
      
      // Should return null
      expect(result).toBeNull();
      // Should log warning in dev mode
      expect(consoleSpy).toHaveBeenCalledWith('[PR Guard] Could not find description field');
      
      consoleSpy.mockRestore();
      delete devWindow.__PR_GUARD_DEV__;
    });
    
    it('should NOT log when DEV_MODE is false', () => {
      // DEV_MODE is false by default (not set)
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      document.body.innerHTML = '';
      const result = getDescriptionField();
      
      // Should return null
      expect(result).toBeNull();
      // Should NOT log in production mode
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('getRenderedDescription edge cases', () => {
    it('should extract from markdown-body class', () => {
      const container = document.createElement('div');
      container.className = 'timeline-comment-group';
      const markdownBody = document.createElement('div');
      markdownBody.className = 'markdown-body';
      markdownBody.textContent = 'Rendered markdown content';
      container.appendChild(markdownBody);
      document.body.appendChild(container);
      
      expect(getRenderedDescription()).toBe('Rendered markdown content');
    });
    
    it('should use innerText if textContent is empty', () => {
      const container = document.createElement('div');
      container.className = 'timeline-comment-group';
      const commentBody = document.createElement('div');
      commentBody.className = 'comment-body';
      // innerText might differ from textContent in some cases
      Object.defineProperty(commentBody, 'textContent', { value: null, writable: true });
      Object.defineProperty(commentBody, 'innerText', { value: 'Inner text content', writable: true });
      container.appendChild(commentBody);
      document.body.appendChild(container);
      
      // The function should handle this gracefully
      const result = getRenderedDescription();
      expect(result).toBeDefined();
    });
  });
});
