// ============================================================================
// TestFactory.js
// Purpose: Factory for creating load test instances from configuration
// Pattern: Factory Pattern
// ============================================================================

import { BaseLoadTest } from './BaseLoadTest.js';

/**
 * TestFactory - Creates load test instances from configuration
 * 
 * Features:
 * - Reads service configuration
 * - Creates BaseLoadTest or custom test class instances
 * - Handles endpoint-specific configuration
 * - Supports custom handler classes
 * 
 * @class
 */
export class TestFactory {
  /**
   * Create a load test instance
   * 
   * @param {Object} config - Service configuration object
   * @param {string} endpointName - Name of endpoint to test (key in config.endpoints)
   * @param {string} testType - Test type ('smoke' or 'load')
   * @param {Class} [CustomTestClass] - Optional custom test class (extends BaseLoadTest)
   * @returns {BaseLoadTest} Load test instance
   * 
   * @example
   * // Using default BaseLoadTest
   * const test = TestFactory.createTest(config, 'generate-token-for-v2', 'load');
   * 
   * @example
   * // Using custom test class
   * import { UserTokenTest } from './endpoints/user-token.js';
   * const test = TestFactory.createTest(config, 'user-token', 'smoke', UserTokenTest);
   */
  static createTest(config, endpointName, testType, CustomTestClass = null) {
    // Validate configuration
    TestFactory._validateConfig(config);
    
    // Validate test type
    if (!['smoke', 'load'].includes(testType)) {
      throw new Error(`TestFactory: Invalid test type '${testType}'. Must be 'smoke' or 'load'.`);
    }
    
    // Get endpoint configuration
    const endpointConfig = TestFactory._getEndpointConfig(config, endpointName);
    
    // Use custom class or default BaseLoadTest
    const TestClass = CustomTestClass || BaseLoadTest;
    
    // Create and return test instance
    const test = new TestClass(config.service, endpointConfig, testType);
    
    console.log(`TestFactory: Created test for ${config.service.name}/${endpointName} (${testType})`);
    
    return test;
  }
  
  /**
   * Validate configuration structure
   * 
   * @param {Object} config - Configuration to validate
   * @throws {Error} If configuration is invalid
   * @private
   */
  static _validateConfig(config) {
    // Check if config exists
    if (!config) {
      throw new Error('TestFactory: Configuration is required');
    }
    
    // Validate service section
    if (!config.service) {
      throw new Error('TestFactory: config.service is required');
    }
    
    if (!config.service.name) {
      throw new Error('TestFactory: config.service.name is required');
    }
    
    if (!config.service.baseUrl) {
      throw new Error('TestFactory: config.service.baseUrl is required');
    }
    
    // Validate endpoints section
    if (!config.endpoints) {
      throw new Error('TestFactory: config.endpoints is required');
    }
    
    if (typeof config.endpoints !== 'object' || Array.isArray(config.endpoints)) {
      throw new Error('TestFactory: config.endpoints must be an object');
    }
    
    if (Object.keys(config.endpoints).length === 0) {
      throw new Error('TestFactory: config.endpoints cannot be empty');
    }
  }
  
  /**
   * Get endpoint configuration by name
   * 
   * @param {Object} config - Service configuration
   * @param {string} endpointName - Endpoint name
   * @returns {Object} Endpoint configuration
   * @throws {Error} If endpoint not found
   * @private
   */
  static _getEndpointConfig(config, endpointName) {
    const endpointConfig = config.endpoints[endpointName];
    
    if (!endpointConfig) {
      const availableEndpoints = Object.keys(config.endpoints).join(', ');
      throw new Error(
        `TestFactory: Endpoint '${endpointName}' not found in configuration. ` +
        `Available endpoints: ${availableEndpoints}`
      );
    }
    
    // Validate required endpoint fields
    if (!endpointConfig.path) {
      throw new Error(`TestFactory: endpoints.${endpointName}.path is required`);
    }
    
    if (!endpointConfig.dataSource) {
      throw new Error(`TestFactory: endpoints.${endpointName}.dataSource is required`);
    }
    
    if (!endpointConfig.validation) {
      throw new Error(`TestFactory: endpoints.${endpointName}.validation is required`);
    }
    
    if (!endpointConfig.loadProfiles) {
      throw new Error(`TestFactory: endpoints.${endpointName}.loadProfiles is required`);
    }
    
    return endpointConfig;
  }
  
  /**
   * Load custom test class from file path
   * 
   * @param {string} customHandlerPath - Path to custom handler file
   * @returns {Class} Custom test class
   * @private
   * @deprecated - Direct import is preferred in k6. Use CustomTestClass parameter instead.
   * 
   * Note: Dynamic imports are not well-supported in k6.
   * Instead of using customHandlerPath, import the class directly:
   * 
   * import { CustomTest } from './path/to/custom.js';
   * TestFactory.createTest(config, 'endpoint', 'load', CustomTest);
   */
  static _loadCustomHandler(customHandlerPath) {
    throw new Error(
      'TestFactory: Dynamic handler loading not supported. ' +
      'Please import custom test class directly and pass as CustomTestClass parameter.'
    );
  }
}
