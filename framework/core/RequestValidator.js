// ============================================================================
// RequestValidator.js
// Purpose: Handles HTTP response validation for k6 load tests
// ============================================================================

import { check } from 'k6';

/**
 * RequestValidator - Handles response validation based on configuration
 * 
 * Features:
 * - Validates status codes
 * - Checks required fields (including nested paths like data.accessToken)
 * - Validates success field values
 * - Checks response times
 * - Returns k6-compatible check results
 * 
 * @class
 */
export class RequestValidator {
  /**
   * @param {Object} validationConfig - Validation configuration
   * @param {number} validationConfig.statusCode - Expected status code
   * @param {Array<string>} validationConfig.requiredFields - Required response fields (supports dot notation)
   * @param {string} [validationConfig.successField] - Field indicating success (e.g., 'success')
   * @param {*} [validationConfig.successValue] - Expected value of success field
   * @param {number} [validationConfig.maxDuration] - Max response time in ms
   */
  constructor(validationConfig) {
    this.config = validationConfig;
  }
  
  /**
   * Validate HTTP response
   * 
   * @param {Object} response - k6 HTTP response object
   * @returns {boolean} True if all checks passed
   * 
   * @example
   * const validator = new RequestValidator({
   *   statusCode: 200,
   *   requiredFields: ['success', 'data.accessToken'],
   *   successField: 'success',
   *   successValue: true
   * });
   * const passed = validator.validate(response);
   */
  validate(response) {
    // Build checks object from configuration
    const checks = this._buildChecks();
    
    // Run k6 checks
    const result = check(response, checks);
    
    // Log failure details if needed
    if (!result) {
      this._logFailure(response);
    }
    
    return result;
  }
  
  /**
   * Build k6 checks object from configuration
   * 
   * @returns {Object} k6 checks object
   * @private
   */
  _buildChecks() {
    const checks = {};
    
    // Check 1: Status code validation
    if (this.config.statusCode) {
      checks[`status is ${this.config.statusCode}`] = (r) => r.status === this.config.statusCode;
    }
    
    // Check 2: Required fields validation (supports nested paths)
    if (this.config.requiredFields && Array.isArray(this.config.requiredFields)) {
      this.config.requiredFields.forEach(fieldPath => {
        checks[`has field '${fieldPath}'`] = (r) => {
          try {
            const body = JSON.parse(r.body);
            const value = this._getNestedField(body, fieldPath);
            return value !== undefined && value !== null;
          } catch (e) {
            return false;
          }
        };
      });
    }
    
    // Check 3: Success field validation
    if (this.config.successField) {
      const expectedValue = this.config.successValue !== undefined ? this.config.successValue : true;
      checks[`${this.config.successField} is ${expectedValue}`] = (r) => {
        try {
          const body = JSON.parse(r.body);
          const value = this._getNestedField(body, this.config.successField);
          return value === expectedValue;
        } catch (e) {
          return false;
        }
      };
    }
    
    // Check 4: Max duration validation (if specified)
    if (this.config.maxDuration) {
      checks[`response time < ${this.config.maxDuration}ms`] = (r) => r.timings.duration < this.config.maxDuration;
    }
    
    return checks;
  }
  
  /**
   * Get nested field value from object using dot notation
   * 
   * @param {Object} obj - Object to search
   * @param {string} path - Dot-notation path (e.g., 'data.accessToken')
   * @returns {*} Field value or undefined
   * @private
   * 
   * @example
   * _getNestedField({ data: { token: 'abc' } }, 'data.token') // Returns 'abc'
   */
  _getNestedField(obj, path) {
    // Split path by dots and traverse the object
    return path.split('.').reduce((current, key) => {
      return current?.[key];
    }, obj);
  }
  
  /**
   * Log validation failure details
   * 
   * @param {Object} response - k6 HTTP response
   * @private
   */
  _logFailure(response) {
    console.error('RequestValidator: Validation failed');
    console.error(`  Status: ${response.status}`);
    console.error(`  Duration: ${response.timings.duration.toFixed(2)}ms`);
    
    // Log response body (truncated)
    const bodyPreview = response.body ? response.body.substring(0, 200) : '(empty)';
    console.error(`  Body: ${bodyPreview}${response.body.length > 200 ? '...' : ''}`);
  }
}
