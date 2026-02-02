// ============================================================================
// K6 Load Test Script for Merchant Java Service
// Common Framework - Shared Configuration and Data Loading
// ============================================================================

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

// ============================================================================
// Configuration
// ============================================================================

export const BASE_URL = 'https://merchant-java.bharatpe.co.in/';
export const CSV_FILE_PATH = __ENV.CSV_PATH || '/Users/Devanshu/load-testing-bharatpe/load_input_creator/api_logs_20260201_215230.csv';

// ============================================================================
// CSV Data Loader Factory
// ============================================================================

/**
 * Create a SharedArray for loading CSV data filtered by endpoint
 * @param {string} endpoint - The API endpoint to filter by
 * @returns {SharedArray} - Shared array of parsed request data
 */
export function createDataLoader(endpoint) {
    return new SharedArray(`merchant_java_requests_${endpoint}`, function () {
        // Read and parse CSV file
        const csvData = open(CSV_FILE_PATH);
        const parsedData = papaparse.parse(csvData, { header: true }).data;

        // Extract and parse request_json column
        const requests = parsedData
            .filter(row => row.request_json && row.request_json.trim() !== '' && row.api_endpoint == endpoint) // Filter by endpoint
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

        console.log(`Loaded ${requests.length} production requests from CSV for endpoint: ${endpoint}`);
        return requests;
    });
}

// ============================================================================
// Common Validation Functions
// ============================================================================

/**
 * Generic validation checks for merchant-java API responses
 * @param {object} response - HTTP response object
 * @param {object} customChecks - Additional custom checks
 * @returns {boolean} - Check result
 */
export function validateResponse(response, customChecks = {}) {
    const commonChecks = {
        'status is 200': (r) => r.status === 200,
        'response has success or status field': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.hasOwnProperty('success') || body.hasOwnProperty('status');
            } catch (e) {
                return false;
            }
        },
        'response success/status is true': (r) => {
            try {
                const body = JSON.parse(r.body);
                return body.success === true || body.status === true;
            } catch (e) {
                return false;
            }
        },
        'response time < 1000ms': (r) => r.timings.duration < 1000,
    };

    const allChecks = { ...commonChecks, ...customChecks };
    const checkResult = check(response, allChecks);

    // Log failures for debugging
    if (!checkResult) {
        console.error(`Request failed - Status: ${response.status}, Body: ${response.body.substring(0, 200)}`);
    }

    return checkResult;
}

// ============================================================================
// Common HTTP Request Helper
// ============================================================================

/**
 * Make HTTP request to merchant-java API
 * @param {string} endpoint - API endpoint path
 * @param {object} payload - Request payload
 * @param {object} headers - Additional headers
 * @param {string} method - HTTP method (default: POST)
 * @returns {object} - HTTP response
 */
export function makeRequest(endpoint, payload, headers = {}, method = 'POST') {
    const url = `${BASE_URL}${endpoint}`;
    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    const finalHeaders = { ...defaultHeaders, ...headers };

    const options = {
        headers: finalHeaders,
        timeout: '30s',
    };

    if (method === 'POST') {
        return http.post(url, JSON.stringify(payload), options);
    } else if (method === 'GET') {
        // Build query string from payload
        const queryParams = Object.keys(payload)
            .filter(key => payload[key] !== null && payload[key] !== undefined)
            .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(payload[key])}`)
            .join('&');

        const urlWithParams = queryParams ? `${url}?${queryParams}` : url;
        return http.get(urlWithParams, options);
    }
}
