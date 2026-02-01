// ============================================================================
// helpers.js
// Purpose: Shared utility functions for the framework
// ============================================================================

/**
 * Get nested field value from object using dot notation
 * 
 * @param {Object} obj - Object to traverse
 * @param {string} path - Dot-notation path (e.g., 'data.user.id')
 * @returns {*} Value at path, or undefined if not found
 * 
 * @example
 * const obj = { data: { user: { id: 123 } } };
 * getNestedValue(obj, 'data.user.id'); // Returns 123
 * getNestedValue(obj, 'data.missing'); // Returns undefined
 */
export function getNestedValue(obj, path) {
  // TODO: Implementation
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Parse JSON safely without throwing errors
 * 
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 * 
 * @example
 * safeJsonParse('{"key": "value"}'); // Returns {key: 'value'}
 * safeJsonParse('invalid json', {}); // Returns {}
 */
export function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.warn(`Failed to parse JSON: ${e.message}`);
    return defaultValue;
  }
}

/**
 * Check if value is empty (null, undefined, empty string, empty array)
 * 
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 * 
 * @example
 * isEmpty(null);      // true
 * isEmpty('');        // true
 * isEmpty([]);        // true
 * isEmpty('hello');   // false
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * Generate unique identifier
 * 
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format duration from milliseconds to human-readable string
 * 
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration (e.g., '1.23s', '234ms')
 */
export function formatDuration(ms) {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Deep merge two objects
 * 
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] instanceof Object && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}
