// ============================================================================
// K6 Load Test - Generate Token v2 (Using Framework)
// ============================================================================

import { TestFactory } from '../framework/core/TestFactory.js';

// Load config using k6's open() function
const configFile = open('../services_config/central_merchant_auth_service/user_token_config.json');
const config = JSON.parse(configFile);

const test = TestFactory.createTest(config, 'user-token', 'load');

export const options = test.getOptions();

test.init();

export default function() {
    test.run()
}
