// ============================================================================
// BaseLoadTest.js
// Purpose: Abstract base class for all k6 load tests
// Pattern: Template Method Pattern
// ============================================================================

import http from 'k6/http';
import { sleep } from 'k6';
import { CSVDataLoader } from './CSVDataLoader.js';
import { RequestValidator } from './RequestValidator.js';

/**
 * BaseLoadTest - Abstract base class for k6 load tests
 * 
 * Uses Template Method Pattern:
 * - Defines the skeleton of load test execution
 * - Provides hooks for customization
 * - Subclasses can override specific methods
 * 
 * @abstract
 * @class
 */
export class BaseLoadTest {
  /**
   * @param {Object} serviceConfig - Service configuration
   * @param {Object} endpointConfig - Endpoint-specific configuration
   * @param {string} testType - Test type ('smoke' or 'load')
   */
  constructor(serviceConfig, endpointConfig, testType) {
    this.serviceConfig = serviceConfig;
    this.endpointConfig = endpointConfig;
    this.testType = testType;
    
    // Initialize validator
    this.validator = new RequestValidator(endpointConfig.validation);
    
    // Load data (will be populated during init)
    this.requestData = null;
  }
  
  // ==========================================================================
  // INITIALIZATION (Called once at k6 startup)
  // ==========================================================================
  
  /**
   * Initialize load test (loads data)
   * Called once when k6 starts
   * 
   * @returns {void}
   */
  init() {
    // TODO: Implementation in Step 1.4
    throw new Error('BaseLoadTest.init() not yet implemented');
  }
  
  // ==========================================================================
  // TEMPLATE METHODS (Hooks - Can be overridden by subclasses)
  // ==========================================================================
  
  /**
   * HOOK: Select data for current iteration
   * Default: Random selection
   * Override for: Round-robin, weighted, sequential, etc.
   * 
   * @returns {Object} Selected request data
   */
  selectData() {
    // TODO: Implementation in Step 1.4
    // Default: Random selection
    throw new Error('BaseLoadTest.selectData() not yet implemented');
  }
  
  /**
   * HOOK: Prepare request payload
   * Default: Return data as-is
   * Override for: Data transformation, enrichment, etc.
   * 
   * @param {Object} data - Raw data from CSV
   * @returns {Object} Prepared request payload
   */
  prepareRequest(data) {
    // Default: No transformation
    return data;
  }
  
  /**
   * HOOK: Build HTTP headers
   * Default: From config
   * Override for: Dynamic headers, auth tokens, etc.
   * 
   * @returns {Object} HTTP headers
   */
  buildHeaders() {
    // TODO: Implementation in Step 1.4
    // Default: Return headers from config
  }
  
  /**
   * HOOK: Build full URL
   * Default: baseUrl + path
   * Override for: Dynamic URLs, query params, etc.
   * 
   * @returns {string} Full URL
   */
  buildUrl() {
    // TODO: Implementation in Step 1.4
    // Default: baseUrl + endpoint path
  }
  
  /**
   * HOOK: Make HTTP request
   * Default: POST/GET based on config
   * Override for: Custom request logic, retries, etc.
   * 
   * @param {string} url - Full URL
   * @param {Object} payload - Request payload
   * @param {Object} headers - HTTP headers
   * @returns {Object} k6 HTTP response
   */
  makeRequest(url, payload, headers) {
    // TODO: Implementation in Step 1.4
    throw new Error('BaseLoadTest.makeRequest() not yet implemented');
  }
  
  /**
   * HOOK: Validate response
   * Default: Use RequestValidator with config
   * Override for: Custom validation logic
   * 
   * @param {Object} response - k6 HTTP response
   * @returns {boolean} True if validation passed
   */
  validateResponse(response) {
    // TODO: Implementation in Step 1.4
    // Default: Use validator
  }
  
  /**
   * HOOK: Handle request failure
   * Default: Log to console
   * Override for: Custom error handling, metrics, etc.
   * 
   * @param {Object} response - Failed response
   * @returns {void}
   */
  handleError(response) {
    // TODO: Implementation in Step 1.4
    // Default: Console log
  }
  
  /**
   * HOOK: Get think time (pause between requests)
   * Default: From config
   * Override for: Dynamic think time, random intervals, etc.
   * 
   * @returns {number} Think time in seconds
   */
  getThinkTime() {
    // Default: Return from config
    return this.endpointConfig.thinkTime || 1;
  }
  
  // ==========================================================================
  // FINAL METHODS (Cannot be overridden)
  // ==========================================================================
  
  /**
   * Main execution method (k6 default function)
   * This is the template method - defines the execution flow
   * 
   * @returns {void}
   * @final
   */
  run() {
    // TODO: Implementation in Step 1.4
    // Template:
    // 1. Select data
    // 2. Prepare request
    // 3. Build headers & URL
    // 4. Make request
    // 5. Validate response
    // 6. Handle errors if needed
    // 7. Sleep (think time)
    throw new Error('BaseLoadTest.run() not yet implemented');
  }
  
  /**
   * Get k6 options (stages, thresholds, etc.)
   * 
   * @returns {Object} k6 options object
   * @final
   */
  getOptions() {
    // TODO: Implementation in Step 1.4
    throw new Error('BaseLoadTest.getOptions() not yet implemented');
  }
  
  // ==========================================================================
  // HELPER METHODS (Private)
  // ==========================================================================
  
  /**
   * Build stages from config
   * 
   * @returns {Array} k6 stages array
   * @private
   */
  _buildStages() {
    // TODO: Implementation in Step 1.4
  }
  
  /**
   * Build thresholds from config
   * 
   * @returns {Object} k6 thresholds object
   * @private
   */
  _buildThresholds() {
    // TODO: Implementation in Step 1.4
  }
}
