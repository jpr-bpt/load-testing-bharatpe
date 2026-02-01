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
    // Load data using CSVDataLoader
    const dataSourceConfig = this.endpointConfig.dataSource;
    const sharedArrayName = `${this.serviceConfig.name}-${this.endpointConfig.path}-data`;
    
    this.requestData = CSVDataLoader.load(dataSourceConfig, sharedArrayName);
    
    console.log(`BaseLoadTest: Initialized test for ${this.serviceConfig.name}${this.endpointConfig.path}`);
    console.log(`BaseLoadTest: Test type: ${this.testType}`);
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
    // Default: Random selection
    const randomIndex = Math.floor(Math.random() * this.requestData.length);
    return this.requestData[randomIndex];
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
    // Default: Return headers from config (or empty object)
    return this.endpointConfig.headers || {};
  }
  
  /**
   * HOOK: Build full URL
   * Default: baseUrl + path
   * Override for: Dynamic URLs, query params, etc.
   * 
   * @returns {string} Full URL
   */
  buildUrl() {
    // Default: Concatenate baseUrl + endpoint path
    const baseUrl = this.serviceConfig.baseUrl;
    const path = this.endpointConfig.path;
    
    // Handle trailing slash in baseUrl
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${cleanBaseUrl}${cleanPath}`;
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
    const method = (this.endpointConfig.method || 'POST').toUpperCase();
    const options = {
      headers: headers,
      timeout: '30s', // Default timeout
    };
    
    // Execute request based on HTTP method
    if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
      return http[method.toLowerCase()](url, JSON.stringify(payload), options);
    } else if (method === 'GET') {
      return http.get(url, options);
    } else if (method === 'DELETE') {
      return http.del(url, null, options);
    } else {
      throw new Error(`BaseLoadTest: Unsupported HTTP method: ${method}`);
    }
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
    // Default: Use RequestValidator with config
    return this.validator.validate(response);
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
    // Default: Log error details
    console.error(`BaseLoadTest: Request failed for ${this.endpointConfig.path}`);
    console.error(`  Status: ${response.status}`);
    console.error(`  Duration: ${response.timings.duration.toFixed(2)}ms`);
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
    // Step 1: Select data for this iteration
    const data = this.selectData();
    
    // Step 2: Prepare request (allows transformation)
    const payload = this.prepareRequest(data);
    
    // Step 3: Build headers and URL
    const headers = this.buildHeaders();
    const url = this.buildUrl();
    
    // Step 4: Make HTTP request
    const response = this.makeRequest(url, payload, headers);
    
    // Step 5: Validate response
    const isValid = this.validateResponse(response);
    
    // Step 6: Handle errors if validation failed
    if (!isValid) {
      this.handleError(response);
    }
    
    // Step 7: Think time (pause before next iteration)
    sleep(this.getThinkTime());
  }
  
  /**
   * Get k6 options (stages, thresholds, etc.)
   * 
   * @returns {Object} k6 options object
   * @final
   */
  getOptions() {
    return {
      stages: this._buildStages(),
      thresholds: this._buildThresholds(),
      summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
      gracefulStop: '30s',
    };
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
    // Get load profile based on test type (smoke or load)
    const loadProfiles = this.endpointConfig.loadProfiles;
    
    if (!loadProfiles || !loadProfiles[this.testType]) {
      throw new Error(`BaseLoadTest: No load profile found for test type '${this.testType}'`);
    }
    
    return loadProfiles[this.testType].stages;
  }
  
  /**
   * Build thresholds from config
   * 
   * @returns {Object} k6 thresholds object
   * @private
   */
  _buildThresholds() {
    const thresholdConfig = this.endpointConfig.thresholds;
    
    if (!thresholdConfig) {
      // Return default minimal thresholds
      return {
        'http_req_failed': ['rate<0.1'], // Less than 10% errors
      };
    }
    
    const thresholds = {};
    
    // HTTP request duration thresholds
    if (thresholdConfig.p95Duration || thresholdConfig.p99Duration) {
      const durationThresholds = [];
      
      if (thresholdConfig.p95Duration) {
        durationThresholds.push(`p(95)<${thresholdConfig.p95Duration}`);
      }
      if (thresholdConfig.p99Duration) {
        durationThresholds.push(`p(99)<${thresholdConfig.p99Duration}`);
      }
      
      thresholds['http_req_duration'] = durationThresholds;
    }
    
    // HTTP request failed rate
    if (thresholdConfig.errorRate !== undefined) {
      thresholds['http_req_failed'] = [`rate<${thresholdConfig.errorRate}`];
    }
    
    // Checks pass rate
    if (thresholdConfig.checkPassRate !== undefined) {
      thresholds['checks'] = [`rate>${thresholdConfig.checkPassRate}`];
    }
    
    return thresholds;
  }
}
