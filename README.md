# K6 Load Testing Framework

A reusable, configuration-driven framework for k6 load testing across multiple services and endpoints.

## 📁 Structure

```
framework/
├── core/
│   ├── BaseLoadTest.js         # Abstract base class (Template Method Pattern)
│   ├── CSVDataLoader.js        # CSV loading and parsing utility
│   ├── RequestValidator.js     # Response validation logic
│   └── TestFactory.js          # Factory for creating test instances
│
└── utils/
    └── helpers.js              # Shared utility functions
```

## 🎯 Design Patterns

### Template Method Pattern (BaseLoadTest)
- Defines the skeleton of test execution
- Provides hooks for customization
- Subclasses override specific behaviors

### Factory Pattern (TestFactory)
- Creates test instances from configuration
- Handles default and custom test classes
- Simplifies test creation

## 🚀 Usage

### For Standard Endpoints (90% of cases)

```javascript
// tests/my-endpoint-load-test.js
import { TestFactory } from '../framework/core/TestFactory.js';
import config from '../services/my-service/config.json';

// Create test from config
const test = TestFactory.createTest(config, 'my-endpoint', 'load');

// Export k6 functions
export const options = test.getOptions();

// Initialize data loading
test.init();

// Main test function
export default function() {
  test.run();
}
```


```javascript
import { TestFactory } from '../../framework/core/TestFactory.js';
import config from '../services/central-merchant-auth/config.json';

// Create test
const test = TestFactory.createTest(config, 'generate-token-for-v2', 'load');

// Export k6 functions
export const options = test.getOptions();
test.init();

export default function() {
  test.run();
}

```

### For Custom Endpoints (10% of cases)

```javascript
// services/my-service/endpoints/custom-endpoint.js
import { BaseLoadTest } from '../../../framework/core/BaseLoadTest.js';

export class CustomEndpointTest extends BaseLoadTest {
  // Override only what's different
  
  prepareRequest(data) {
    // Custom transformation
    return {
      ...data,
      timestamp: Date.now()
    };
  }
  
  validateResponse(response) {
    // Custom validation
    const baseChecks = super.validateResponse(response);
    return {
      ...baseChecks,
      'custom check': (r) => r.status === 200
    };
  }
}
```

Then use it:

```javascript
// tests/custom-endpoint-load-test.js
import { TestFactory } from '../framework/core/TestFactory.js';
import { CustomEndpointTest } from '../services/my-service/endpoints/custom-endpoint.js';
import config from '../services/my-service/config.json';

// Create with custom handler
const test = TestFactory.createTest(config, 'custom-endpoint', 'load', CustomEndpointTest);

export const options = test.getOptions();
test.init();

export default function() {
  test.run();
}
```

## 📋 Configuration Schema

See service configuration files for detailed schema.

```json
{
  "service": {
    "name": "my-service",
    "baseUrl": "https://api.example.com",
    "environment": "staging"
  },
  "endpoints": {
    "my-endpoint": {
      "path": "/api/v1/endpoint",
      "method": "POST",
      "dataSource": {
        "type": "csv",
        "path": "./data/requests.csv",
        "requestColumn": "request_json",
        "filterByEndpoint": "/api/v1/endpoint"
      },
      "headers": {
        "Content-Type": "application/json"
      },
      "validation": {
        "statusCode": 200,
        "requiredFields": ["success", "data"],
        "successField": "success",
        "successValue": true
      },
      "thresholds": {
        "p95Duration": 1000,
        "errorRate": 0.05,
        "checkPassRate": 0.95
      },
      "loadProfiles": {
        "smoke": {
          "stages": [...]
        },
        "load": {
          "stages": [...]
        }
      },
      "thinkTime": 1
    }
  }
}
```

example config 
``` json
{
  "service": {
    "name": "central-merchant-auth",
    "baseUrl": "https://central-merchant-auth-service.bharatpe.co.in",
    "environment": "staging"
  },
  "endpoints": {
    "generate-token-for-v2": {
      "path": "/auth/v2/generate-token-for-v2",
      "method": "POST",
      "dataSource": {
        "type": "csv",
        "path": "./data/requests.csv",
        "requestColumn": "request_json",
        "filterByEndpoint": "/auth/v2/generate-token-for-v2"
      },
      "headers": {
        "Content-Type": "application/json"
      },
      "validation": {
        "statusCode": 200,
        "requiredFields": ["success", "data.accessToken", "data.refreshToken"],
        "successField": "success",
        "successValue": true,
        "maxDuration": 1000
      },
      "thresholds": {
        "p95Duration": 1000,
        "p99Duration": 2000,
        "errorRate": 0.05,
        "checkPassRate": 0.95
      },
      "loadProfiles": {
        "smoke": {
          "stages": [
            { "duration": "30s", "target": 1 },
            { "duration": "30s", "target": 2 }
          ]
        },
        "load": {
          "stages": [
            { "duration": "2m", "target": 5 },
            { "duration": "3m", "target": 25 },
            { "duration": "5m", "target": 25 },
            { "duration": "2m", "target": 0 }
          ]
        }
      },
      "thinkTime": 1
    }
  }
}
```

## 🔧 Customization Hooks

### BaseLoadTest Hooks (Override in subclasses)

| Hook | Purpose | Default Behavior |
|------|---------|------------------|
| `selectData()` | Choose data for iteration | Random selection |
| `prepareRequest(data)` | Transform request data | Returns data as-is |
| `buildHeaders()` | Build HTTP headers | Returns config headers |
| `buildUrl()` | Build full URL | baseUrl + path |
| `makeRequest()` | Execute HTTP request | POST/GET based on config |
| `validateResponse()` | Validate response | Uses RequestValidator |
| `handleError()` | Handle failures | Console logging |
| `getThinkTime()` | Get pause duration | Returns config value |

## 📝 Implementation Status

### Phase 1: Core Framework (In Progress)

- [x] Step 1.1: Framework structure created ✅
- [ ] Step 1.2: CSVDataLoader implementation
- [ ] Step 1.3: RequestValidator implementation
- [ ] Step 1.4: BaseLoadTest implementation
- [ ] Step 1.5: TestFactory implementation
- [ ] Step 1.6: Migration of existing test
- [ ] Step 1.7: Add user-token endpoint

## 🤝 Contributing

When adding new features:
1. Follow the existing patterns
2. Add JSDoc comments
3. Update this README
4. Test with multiple services

## 📚 Resources

- [K6 Documentation](https://k6.io/docs/)
- [Template Method Pattern](https://refactoring.guru/design-patterns/template-method)
- [Factory Pattern](https://refactoring.guru/design-patterns/factory-method)
