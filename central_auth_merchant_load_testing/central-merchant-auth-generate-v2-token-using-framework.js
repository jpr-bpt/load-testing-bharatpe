// ============================================================================
// K6 Load Test - Generate Token v2 (Using Framework)
// ============================================================================

import { TestFactory } from '../framework/core/TestFactory.js';

// Load config using k6's open() function
const configFile = open('../services_config/central_merchant_auth_service/config.json');
const config = JSON.parse(configFile);

// Create test instance
// Parameters: (config, endpointName, testType)
const test = TestFactory.createTest(config, 'generate-token-for-v2', 'load');

// Export k6 options
export const options = test.getOptions();

// Initialize data loading
test.init();

// Main test function
export default function() {
  test.run();
}
