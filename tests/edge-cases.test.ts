/**
 * Edge Cases Tests
 * Tests for various edge cases and boundary conditions
 */

import { describe, it, expect } from 'vitest';
import { validatePRDescription } from '../src/validator';

describe('Edge Cases', () => {
  describe('Case Insensitivity', () => {
    it('should match "What Changed" (capitalized)', () => {
      const result = validatePRDescription('## What Changed\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
    
    it('should match "WHAT CHANGED" (all caps)', () => {
      const result = validatePRDescription('## WHAT CHANGED\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
    
    it('should match "what changed" (lowercase)', () => {
      const result = validatePRDescription('## what changed\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
  });
  
  describe('Punctuation Variations', () => {
    it('should match "What changed:" (with colon)', () => {
      const result = validatePRDescription('## What changed:\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
    
    it('should match "What changed?" (with question mark)', () => {
      const result = validatePRDescription('## What changed?\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
    
    it('should match "Why:" (with colon)', () => {
      const result = validatePRDescription('## Why:\nReason');
      expect(result.errors.some(e => e.rule === 'WHY')).toBe(false);
    });
  });
  
  describe('Apostrophe Variations', () => {
    it('should match "What\'s changed" (with apostrophe)', () => {
      const result = validatePRDescription("## What's changed\nChanges");
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
    
    it('should match "What changed" (without apostrophe)', () => {
      const result = validatePRDescription('## What changed\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
  });
  
  describe('Markdown Format Variations', () => {
    it('should match "# What changed" (h1)', () => {
      const result = validatePRDescription('# What changed\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
    
    it('should match "### What changed" (h3)', () => {
      const result = validatePRDescription('### What changed\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
    
    it('should match "* What changed" (list item)', () => {
      const result = validatePRDescription('* What changed\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
    
    it('should match "** What changed" (bold list)', () => {
      const result = validatePRDescription('** What changed\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
  });
  
  describe('Whitespace Handling', () => {
    it('should handle extra whitespace', () => {
      const result = validatePRDescription('##   What   changed  \nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
    
    it('should handle tabs and newlines', () => {
      const result = validatePRDescription('##\tWhat\tchanged\n\nChanges');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
    });
    
    it('should treat whitespace-only as empty', () => {
      const result = validatePRDescription('   \n\t  \n  ');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.rule === 'EMPTY')).toBe(true);
    });
  });
  
  describe('Special Characters', () => {
    it('should handle special characters in content', () => {
      const result = validatePRDescription(
        '## What changed\nChanges with <>&"\' characters\n\n## Why\nReason\n\n## How it was tested\nTests'
      );
      expect(result.isValid).toBe(true);
    });
    
    it('should handle unicode characters', () => {
      const result = validatePRDescription(
        '## What changed\nChanges with émojis 🎉\n\n## Why\nReason\n\n## How it was tested\nTests'
      );
      expect(result.isValid).toBe(true);
    });
  });
  
  describe('Long Descriptions', () => {
    it('should handle very long descriptions', () => {
      const longContent = 'A'.repeat(10000);
      const result = validatePRDescription(
        `## What changed\n${longContent}\n\n## Why\nReason\n\n## How it was tested\nTests`
      );
      expect(result.isValid).toBe(true);
    });
  });
  
  describe('Multiple Sections', () => {
    it('should find first matching section', () => {
      const result = validatePRDescription(
        '## What changed\nFirst\n\n## What changed\nSecond\n\n## Why\nReason\n\n## How it was tested\nTests'
      );
      expect(result.isValid).toBe(true);
    });
    
    it('should handle sections in different order', () => {
      const result = validatePRDescription(
        '## Why\nReason\n\n## How it was tested\nTests\n\n## What changed\nChanges'
      );
      expect(result.isValid).toBe(true);
    });
  });
  
  describe('Negative Cases', () => {
    it('should NOT match "Changes" alone (too generic)', () => {
      const result = validatePRDescription('## Changes\nContent');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(true);
    });
    
    it('should NOT match "What" alone (needs "changed")', () => {
      const result = validatePRDescription('## What\nContent');
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(true);
    });
    
    it('should NOT match partial matches', () => {
      const result = validatePRDescription('## What was changed\nContent');
      // "What was changed" doesn't match the pattern
      expect(result.errors.some(e => e.rule === 'WHAT')).toBe(true);
    });
  });
  
  describe('How it was tested Variations', () => {
    it('should match "How it was tested"', () => {
      const result = validatePRDescription('## How it was tested\nTests');
      expect(result.errors.some(e => e.rule === 'TESTED')).toBe(false);
    });
    
    it('should match "How was it tested"', () => {
      const result = validatePRDescription('## How was it tested\nTests');
      expect(result.errors.some(e => e.rule === 'TESTED')).toBe(false);
    });
  });
});
