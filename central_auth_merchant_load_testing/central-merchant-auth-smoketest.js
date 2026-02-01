// ============================================================================
// K6 Smoke Test for Central Merchant Auth Service
// Purpose: Quick validation before running full load test
// Duration: ~1 minute
// Load: 1-2 VUs
// ============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// Note: open() is a built-in k6 function for reading files

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = 'https://central-merchant-auth-service.bharatpe.co.in';
const ENDPOINT = '/auth/v2/generate-token-for-v2';
const CSV_FILE_PATH = '/Users/jatin.jha/workspace/load_testing/central_auth_merchant_load_testing/sample_central_merchant_auth_load_testing_script.csv';

// ============================================================================
// Options - Smoke Test Configuration
// ============================================================================

export const options = {
  // Smoke Test: Minimal load, quick validation
  stages: [
    { duration: '30s', target: 1 },  // 1 VU for 30 seconds
    { duration: '30s', target: 2 },  // Ramp to 2 VUs for 30 seconds
  ],
  
  // Relaxed Thresholds for Smoke Test
  thresholds: {
    'http_req_duration': ['p(95)<2000'], // More lenient for smoke test
    'http_req_failed': ['rate<0.1'],     // Allow 10% errors
    'checks': ['rate>0.90'],              // 90% checks should pass
  },
};

// ============================================================================
// Load CSV Data
// ============================================================================

const requestData = new SharedArray('production_requests', function () {
  // Read and parse CSV file
  const csvData = open(CSV_FILE_PATH);
  const parsedData = papaparse.parse(csvData, { header: true }).data;
  
  // Extract and parse request_json column
  const requests = parsedData
    .filter(row => row.request_json && row.request_json.trim() !== '') // Filter out empty rows
    .map(row => {
      try {
        // Parse the JSON string from request_json column
        return JSON.parse(row.request_json);
      } catch (e) {
        console.error(`Failed to parse request_json: ${e.message}`);
        return null;
      }
    })
    .filter(req => req !== null); // Remove any failed parses
  
  console.log(`✓ Smoke Test: Loaded ${requests.length} production requests from CSV`);
  return requests;
});

// ============================================================================
// Main Test Function
// ============================================================================

export default function () {
  // Get random request from CSV data
  const randomIndex = Math.floor(Math.random() * requestData.length);
  const requestPayload = requestData[randomIndex];
  
  // Make HTTP POST request
  const url = `${BASE_URL}${ENDPOINT}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const response = http.post(url, JSON.stringify(requestPayload), {
    headers: headers,
    timeout: '30s',
  });
  
  // Validate response
  const checkResult = check(response, {
    'status is 200': (r) => r.status === 200,
    'response has success field': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.hasOwnProperty('success');
      } catch (e) {
        return false;
      }
    },
    'response success is true': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success === true;
      } catch (e) {
        return false;
      }
    },
    'response has accessToken': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.data && body.data.accessToken && body.data.accessToken.length > 0;
      } catch (e) {
        return false;
      }
    },
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });
  
  // Log details for smoke test debugging
  if (!checkResult) {
    console.error(`✗ SMOKE TEST FAIL - Status: ${response.status}, Body: ${response.body.substring(0, 200)}`);
  } else {
    console.log(`✓ Request successful - Status: ${response.status}, Duration: ${response.timings.duration.toFixed(2)}ms`);
  }
  
  // Shorter sleep for smoke test
  sleep(0.5);
}

// ============================================================================
// Setup
// ============================================================================

export function setup() {
  console.log('========================================');
  console.log('🔥 SMOKE TEST STARTED');
  console.log('========================================');
  console.log(`Target: ${BASE_URL}${ENDPOINT}`);
  console.log(`Duration: ~1 minute`);
  console.log(`Load: 1-2 VUs`);
  console.log('========================================\n');
}

// ============================================================================
// Teardown
// ============================================================================

export function teardown(data) {
  console.log('\n========================================');
  console.log('🔥 SMOKE TEST COMPLETED');
  console.log('========================================');
  console.log('Check the summary above for results.');
  console.log('If all checks passed, proceed with full load test.');
  console.log('========================================');
}
