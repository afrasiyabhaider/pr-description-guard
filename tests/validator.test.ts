import { describe, it, expect } from 'vitest';
import { validatePRDescription } from '../src/validator';

describe('validatePRDescription', () => {
  describe('EMPTY rule', () => {
    it('should fail for empty string', () => {
      const result = validatePRDescription('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ rule: 'EMPTY' })
      );
    });

    it('should fail for whitespace only', () => {
      const result = validatePRDescription('   \n\t  ');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ rule: 'EMPTY' })
      );
    });

    it('should pass for content with only HTML comments', () => {
      const result = validatePRDescription('<!-- comment -->');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual(
        expect.objectContaining({ rule: 'EMPTY' })
      );
    });

    it('should pass for non-empty content', () => {
      const result = validatePRDescription('Some content');
      expect(result.isValid).toBe(false); // Will fail other rules, but not EMPTY
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'EMPTY' })
      );
    });
  });

  describe('WHAT rule', () => {
    it('should pass for ## What changed', () => {
      const result = validatePRDescription('## What changed\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHAT' })
      );
    });

    it('should pass for ### What changed', () => {
      const result = validatePRDescription('### What changed\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHAT' })
      );
    });

    it('should pass for **What changed**', () => {
      const result = validatePRDescription('**What changed**\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHAT' })
      );
    });

    it('should pass for What\'s changed', () => {
      const result = validatePRDescription('## What\'s changed\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHAT' })
      );
    });

    it('should pass for What changed:', () => {
      const result = validatePRDescription('## What changed:\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHAT' })
      );
    });

    it('should pass for What changed?', () => {
      const result = validatePRDescription('## What changed?\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHAT' })
      );
    });

    it('should pass for case-insensitive matching', () => {
      const result = validatePRDescription('## WHAT CHANGED\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHAT' })
      );
    });

    it('should fail when "What changed" section is missing', () => {
      const result = validatePRDescription('Some content without sections');
      expect(result.errors).toContainEqual(
        expect.objectContaining({ rule: 'WHAT' })
      );
    });

    it('should NOT pass for "Changes" alone (too generic)', () => {
      const result = validatePRDescription('## Changes\nSome text');
      expect(result.errors).toContainEqual(
        expect.objectContaining({ rule: 'WHAT' })
      );
    });

    it('should ignore HTML comments in template', () => {
      const result = validatePRDescription('<!-- Describe your changes -->\n## What changed\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHAT' })
      );
    });
  });

  describe('WHY rule', () => {
    it('should pass for ## Why', () => {
      const result = validatePRDescription('## Why\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHY' })
      );
    });

    it('should pass for **Why**', () => {
      const result = validatePRDescription('**Why**\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHY' })
      );
    });

    it('should pass for Why:', () => {
      const result = validatePRDescription('## Why:\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHY' })
      );
    });

    it('should pass for Why?', () => {
      const result = validatePRDescription('## Why?\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHY' })
      );
    });

    it('should pass for case-insensitive matching', () => {
      const result = validatePRDescription('## WHY\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'WHY' })
      );
    });

    it('should fail when "Why" section is missing', () => {
      const result = validatePRDescription('## What changed\nSome text');
      expect(result.errors).toContainEqual(
        expect.objectContaining({ rule: 'WHY' })
      );
    });
  });

  describe('TESTED rule', () => {
    it('should pass for ## How it was tested', () => {
      const result = validatePRDescription('## How it was tested\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'TESTED' })
      );
    });

    it('should pass for ## How was it tested', () => {
      const result = validatePRDescription('## How was it tested\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'TESTED' })
      );
    });

    it('should pass for **How it was tested**', () => {
      const result = validatePRDescription('**How it was tested**\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'TESTED' })
      );
    });

    it('should pass for How it was tested:', () => {
      const result = validatePRDescription('## How it was tested:\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'TESTED' })
      );
    });

    it('should pass for case-insensitive matching', () => {
      const result = validatePRDescription('## HOW IT WAS TESTED\nSome text');
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ rule: 'TESTED' })
      );
    });

    it('should fail when "How it was tested" section is missing', () => {
      const result = validatePRDescription('## What changed\n## Why\nSome text');
      expect(result.errors).toContainEqual(
        expect.objectContaining({ rule: 'TESTED' })
      );
    });
  });

  describe('Complete validation', () => {
    it('should pass when all sections are present', () => {
      const description = `
## What changed
Fixed a bug

## Why
The bug was causing issues

## How it was tested
Manual testing
      `.trim();
      const result = validatePRDescription(description);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when multiple sections are missing', () => {
      const result = validatePRDescription('Some content without sections');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors.map(e => e.rule)).toContain('WHAT');
      expect(result.errors.map(e => e.rule)).toContain('WHY');
      expect(result.errors.map(e => e.rule)).toContain('TESTED');
    });

    it('should handle template with HTML comments', () => {
      const description = `
<!-- Describe your changes -->
## What changed
Fixed a bug

<!-- Explain why -->
## Why
The bug was causing issues

<!-- Describe testing -->
## How it was tested
Manual testing
      `.trim();
      const result = validatePRDescription(description);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
