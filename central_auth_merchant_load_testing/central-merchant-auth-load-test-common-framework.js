// ============================================================================
// K6 Load Test Script for Central Merchant Auth Service
// ============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// ============================================================================
// Configuration
// ============================================================================

const BASE_URL = 'https://central-merchant-auth-service.bharatpe.co.in';
const CSV_FILE_PATH = '/Users/jatin.jha/workspace/load_testing/central_auth_merchant_load_testing/sample_central_merchant_auth_load_testing_script.csv';


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