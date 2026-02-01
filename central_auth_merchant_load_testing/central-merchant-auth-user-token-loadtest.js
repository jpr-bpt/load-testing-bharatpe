// ============================================================================
// K6 Load Test Script for Central Merchant Auth Service
// Endpoint: POST /auth/v2/generate-token-for-v2
// Environment: Staging
// ============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';
import { CSVDataLoader } from '../framework/index.js';

// Note: open() is a built-in k6 function for reading files

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = 'https://central-merchant-auth-service.bharatpe.co.in';
const ENDPOINT = '/auth/v2/user-token';
const CSV_FILE_PATH = '/Users/jatin.jha/workspace/load_testing/central_auth_merchant_load_testing/sample_central_merchant_auth_load_testing_script.csv';

// ============================================================================
// Options - Load Test Configuration
// ============================================================================

export const options = {
  // Load Stages: Baseline → Ramp-up → Plateau → Ramp-down
  stages: [
    // Stage 1: Baseline (Warm-up)
    { duration: '1m', target: 5 },   // Stay at 5 VUs for 2 minutes
    
    // Stage 2: Ramp-up
    { duration: '1m', target: 25 },  // Ramp from 5 to 25 VUs over 3 minutes
    
    // Stage 3: Plateau (Sustained Load)
    { duration: '1m', target: 25 },  // Hold at 25 VUs for 5 minutes
    
    // Stage 4: Ramp-down
    { duration: '1m', target: 0 },   // Ramp down from 25 to 0 VUs over 2 minutes
  ],
  
  // Thresholds: Pass/Fail Criteria
  thresholds: {
    // HTTP Request Duration
    'http_req_duration': ['p(95)<1000', 'p(99)<2000'], // 95% under 1s, 99% under 2s
    
    // HTTP Request Failed
    'http_req_failed': ['rate<0.01'], // Error rate should be less than 5%
    
    // Checks (our custom validations)
    'checks': ['rate>0.95'], // 95% of checks should pass
    
    // Individual check thresholds
    'checks{check:status is 200}': ['rate==0.99'],
    'checks{check:response success is true}': ['rate>0.99'],
    'checks{check:response has accessToken}': ['rate>0.99'],
  },
  
  // Summary Options
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(95)', 'p(99)'],
  
  // Graceful Stop
  gracefulStop: '30s', // Wait 30s for iterations to finish before force-stopping
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
    .filter(row => row.request_json && row.request_json.trim() !== '' && row.api_endpoint == ENDPOINT) // Filter out empty rows
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
  
  console.log(`Loaded ${requests.length} production requests from CSV`);
  return requests;
});

// ============================================================================
// Main Test Function
// ============================================================================

export default function () {
  // Step 3: Get data from CSV (Random Selection Strategy)
  const randomIndex = Math.floor(Math.random() * requestData.length);
  const requestPayload = requestData[randomIndex];
  
  // Step 4: Make HTTP POST request
  const url = `${BASE_URL}${ENDPOINT}`;
  const headers = {
    'Content-Type': 'application/json',
  };
  
  const response = http.post(url, JSON.stringify(requestPayload), {
    headers: headers,
    timeout: '30s', // 30 second timeout
  });
  
  // Step 4: Validate response
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
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  // Log failures for debugging
  if (!checkResult) {
    console.error(`Request failed - Status: ${response.status}, Body: ${response.body.substring(0, 200)}`);
  }
  
  // Step 4: Add think time (simulate real user behavior)
  sleep(1); // 1 second pause between requests
}

// ============================================================================
// Teardown (Optional)
// ============================================================================

export function teardown(data) {
  // Cleanup logic if needed
}
