/**
 * Validation error with rule ID and user-friendly message
 */
export interface ValidationError {
  rule: string;
  message: string;
}

/**
 * Validation result containing validity status and errors
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Clean template placeholders (HTML comments) from text
 * Only handles HTML comments: <!-- comment -->
 * Does NOT handle markdown comments: [//]: # (comment)
 */
function cleanTemplatePlaceholders(text: string): string {
  return text.replace(/<!--[\s\S]*?-->/g, '');
}

/**
 * Section patterns (precise regex patterns)
 * Compiled once at module level for performance
 */
const SECTION_PATTERNS = {
  WHAT: /(?:^|\n)(?:#{1,3}|[\*_]{1,2})\s*what'?s?\s+changed[:\?]?/i,
  WHY: /(?:^|\n)(?:#{1,3}|[\*_]{1,2})\s*why[:\?]?/i,
  // Handles both "How it was tested" and "How was it tested"
  TESTED: /(?:^|\n)(?:#{1,3}|[\*_]{1,2})\s*how\s+(?:it\s+was|was\s+it)\s+tested[:\?]?/i
} as const;

/**
 * Check if text contains a section matching the regex pattern
 * Uses String.search() instead of RegExp.test() to avoid potential state issues
 */
function hasSection(text: string, pattern: RegExp): boolean {
  return text.search(pattern) !== -1;
}

/**
 * Create a validation error object
 * DRY helper to avoid repetition
 */
function createError(rule: string, message: string): ValidationError {
  return { rule, message };
}

/**
 * Validate PR description against required sections
 * 
 * Rules:
 * - EMPTY: Description must contain non-whitespace content (after removing HTML comments)
 * - WHAT: Must include "What changed" section
 * - WHY: Must include "Why" section
 * - TESTED: Must include "How it was tested" section
 */
export function validatePRDescription(description: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Clean template placeholders (HTML comments) before validation
  const cleaned = cleanTemplatePlaceholders(description);
  const trimmed = cleaned.trim();
  
  // Rule: EMPTY - Description must not be empty
  if (trimmed.length === 0) {
    errors.push(createError('EMPTY', 'Description must not be empty'));
    return {
      isValid: false,
      errors
    };
  }
  
  // Rule: WHAT - Must include "What changed" section
  // Note: Does NOT match "Changes" alone (too generic)
  if (!hasSection(cleaned, SECTION_PATTERNS.WHAT)) {
    errors.push(createError('WHAT', 'What changed'));
  }
  
  // Rule: WHY - Must include "Why" section
  if (!hasSection(cleaned, SECTION_PATTERNS.WHY)) {
    errors.push(createError('WHY', 'Why'));
  }
  
  // Rule: TESTED - Must include "How it was tested" section
  if (!hasSection(cleaned, SECTION_PATTERNS.TESTED)) {
    errors.push(createError('TESTED', 'How it was tested'));
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
