/**
 * GitHub Template Handling Tests
 * Tests for cleaning HTML comments and validating templates
 */

import { describe, it, expect } from 'vitest';
import { validatePRDescription } from '../src/validator';

describe('Template Handling', () => {
  it('should clean HTML comments from template', () => {
    const template = `<!--
Thank you for submitting a pull request!
Please verify that:
- [] There is an associated issue
- [] Code is up-to-date
-->
## What changed
Changes here`;
    
    const result = validatePRDescription(template);
    // After cleaning comments, should have "What changed" but missing others
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false); // Present
    expect(result.errors.some(e => e.rule === 'WHY')).toBe(true); // Missing
  });
  
  it('should treat template with only HTML comments as empty', () => {
    const template = `<!--
Thank you for submitting a pull request!
Please verify that:
- [] There is an associated issue
-->`;
    
    const result = validatePRDescription(template);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'EMPTY')).toBe(true);
  });
  
  it('should validate content outside HTML comments', () => {
    const template = `<!-- Template comment -->
## What changed
Changes

## Why
Reason

## How it was tested
Tests`;
    
    const result = validatePRDescription(template);
    expect(result.isValid).toBe(true);
  });
  
  it('should ignore sections inside HTML comments', () => {
    const template = `<!--
## What changed
## Why
## How it was tested
-->`;
    
    const result = validatePRDescription(template);
    // All sections are in comments, so they're ignored
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'EMPTY')).toBe(true);
  });
  
  it('should handle multiple HTML comment blocks', () => {
    const template = `<!-- First comment -->
## What changed
Changes
<!-- Second comment -->
## Why
Reason
<!-- Third comment -->
## How it was tested
Tests`;
    
    const result = validatePRDescription(template);
    expect(result.isValid).toBe(true);
  });
  
  it('should handle nested or malformed HTML comments', () => {
    const template = `<!-- Comment <!-- nested --> -->
## What changed
Changes`;
    
    const result = validatePRDescription(template);
    // Should still extract "What changed" even with malformed comments
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.rule === 'WHAT')).toBe(false);
  });
});
