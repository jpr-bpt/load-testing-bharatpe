// ============================================================================
// CSVDataLoader.js
// Purpose: Handles CSV file loading and parsing for k6 load tests
// ============================================================================

import { SharedArray } from 'k6/data';
import papaparse from 'https://jslib.k6.io/papaparse/5.1.1/index.js';

/**
 * CSVDataLoader - Utility class for loading and parsing CSV data
 * 
 * Features:
 * - Loads CSV files using k6's SharedArray (memory efficient)
 * - Parses JSON from specified column
 * - Supports filtering by endpoint (optional)
 * - Validates data integrity
 * 
 * @class
 */
export class CSVDataLoader {
  /**
   * Load and parse CSV data
   * 
   * @param {Object} dataSourceConfig - Data source configuration
   * @param {string} dataSourceConfig.path - Path to CSV file
   * @param {string} dataSourceConfig.requestColumn - Column containing request JSON
   * @param {string} [dataSourceConfig.filterByEndpoint] - Optional: Filter by api_endpoint column
   * @param {string} sharedArrayName - Name for SharedArray (must be unique)
   * @returns {SharedArray} Parsed request data
   * 
   * @example
   * const loader = new CSVDataLoader();
   * const data = loader.load({
   *   path: './data/requests.csv',
   *   requestColumn: 'request_json',
   *   filterByEndpoint: '/auth/v2/user-token'
   * }, 'user-token-data');
   */
  static load(dataSourceConfig, sharedArrayName) {
    const { path, requestColumn, filterByEndpoint } = dataSourceConfig;
    
    // Validate required fields
    if (!path) {
      throw new Error('CSVDataLoader: dataSourceConfig.path is required');
    }
    if (!requestColumn) {
      throw new Error('CSVDataLoader: dataSourceConfig.requestColumn is required');
    }
    if (!sharedArrayName) {
      throw new Error('CSVDataLoader: sharedArrayName is required');
    }
    
    // Create SharedArray - executed once at k6 init time
    const requestData = new SharedArray(sharedArrayName, function () {
      // Read CSV file
      let csvContent;
      try {
        csvContent = open(path);
      } catch (e) {
        throw new Error(`CSVDataLoader: Failed to read CSV file at ${path}: ${e.message}`);
      }
      
      // Parse CSV with headers
      const parsedData = papaparse.parse(csvContent, { 
        header: true,
        skipEmptyLines: true 
      });
      
      if (parsedData.errors && parsedData.errors.length > 0) {
        console.warn(`CSVDataLoader: CSV parsing warnings for ${path}:`, parsedData.errors);
      }
      
      let rows = parsedData.data;
      
      // Filter by endpoint if specified
      if (filterByEndpoint) {
        rows = CSVDataLoader._filterByEndpoint(rows, filterByEndpoint);
        console.log(`CSVDataLoader: Filtered to ${rows.length} rows for endpoint ${filterByEndpoint}`);
      }
      
      // Extract and parse request JSON from specified column
      const requests = rows
        .map(row => CSVDataLoader._parseRequestJson(row, requestColumn))
        .filter(req => req !== null); // Remove failed parses
      
      if (requests.length === 0) {
        throw new Error(`CSVDataLoader: No valid requests found in ${path} (column: ${requestColumn})`);
      }
      
      console.log(`✓ CSVDataLoader: Loaded ${requests.length} requests from ${path}`);
      return requests;
    });
    
    return requestData;
  }
  
  /**
   * Parse a single row's request JSON
   * 
   * @param {Object} row - CSV row object
   * @param {string} requestColumn - Column name containing JSON
   * @returns {Object|null} Parsed JSON object or null if invalid
   * @private
   */
  static _parseRequestJson(row, requestColumn) {
    const jsonString = row[requestColumn];
    
    // Check if column exists and has content
    if (!jsonString || jsonString.trim() === '') {
      return null;
    }
    
    try {
      // Parse JSON string to object
      const parsed = JSON.parse(jsonString);
      return parsed;
    } catch (e) {
      console.warn(`CSVDataLoader: Failed to parse JSON in column '${requestColumn}': ${e.message}`);
      console.warn(`CSVDataLoader: Raw value: ${jsonString.substring(0, 100)}...`);
      return null;
    }
  }
  
  /**
   * Filter CSV rows by endpoint
   * 
   * @param {Array} rows - Array of CSV row objects
   * @param {string} endpoint - Endpoint path to filter by
   * @returns {Array} Filtered rows
   * @private
   */
  static _filterByEndpoint(rows, endpoint) {
    const filtered = rows.filter(row => {
      // Check if row has api_endpoint column
      if (!row.api_endpoint) {
        return false;
      }
      
      // Match the endpoint (exact match or contains)
      return row.api_endpoint === endpoint || row.api_endpoint.includes(endpoint);
    });
    
    return filtered;
  }
}
