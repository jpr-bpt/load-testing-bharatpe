# K6 Load Testing - Central Merchant Auth Service

Load testing suite for the `/auth/v2/generate-token-for-v2` endpoint using real production request data.

## 📁 Files

- `central-merchant-auth-smoketest.js` - Quick validation test (~1 minute, 1-2 VUs)
- `central-merchant-auth-loadtest.js` - Full load test (~12 minutes, up to 25 VUs)
- `sample_central_merchant_auth_load_testing_script.csv` - Production request data

## 🚀 Quick Start

### Prerequisites

Install k6 if you haven't already:

```bash
# macOS
brew install k6

# Or download from: https://k6.io/docs/getting-started/installation/
```

### Step 1: Run Smoke Test (ALWAYS RUN THIS FIRST)

```bash
k6 run central-merchant-auth-smoketest.js
```

**Duration:** ~1 minute  
**Load:** 1-2 VUs  
**Purpose:** Verify script works, CSV loads correctly, API is reachable

**Expected Output:**
```
✓ Smoke Test: Loaded 2 production requests from CSV
✓ Request successful - Status: 200, Duration: 45.32ms
...
checks.........................: 100.00% ✓ 60  ✗ 0
http_req_failed................: 0.00%   ✓ 0   ✗ 60
```

### Step 2: Run Full Load Test (Only if smoke test passes)

```bash
k6 run central-merchant-auth-loadtest.js
```

**Duration:** ~12 minutes  
**Load Pattern:**
- Minutes 0-2: 5 VUs (baseline)
- Minutes 2-5: 5→25 VUs (ramp-up)
- Minutes 5-10: 25 VUs (plateau)
- Minutes 10-12: 25→0 VUs (ramp-down)

## 📊 Understanding Results

### Key Metrics

| Metric | Description | Good Target |
|--------|-------------|-------------|
| `http_req_duration` | Response time | p(95) < 1s |
| `http_req_failed` | Error rate | < 5% |
| `checks` | Validation pass rate | > 95% |

### Sample Output

```
✓ status is 200
✓ response has success field
✓ response success is true
✓ response has accessToken
✓ response has refreshToken
✓ response time < 500ms

http_req_duration..............: avg=234ms min=89ms med=198ms max=1.2s p(95)=456ms
http_req_failed................: 0.00%
checks.........................: 98.50%
```

## 🎯 Load Test Scenarios

### Smoke Test Configuration

```javascript
stages: [
  { duration: '30s', target: 1 },  // 1 VU for 30s
  { duration: '30s', target: 2 },  // 2 VUs for 30s
]
```

### Full Load Test Configuration

```javascript
stages: [
  { duration: '2m', target: 5 },   // Baseline
  { duration: '3m', target: 25 },  // Ramp-up
  { duration: '5m', target: 25 },  // Plateau
  { duration: '2m', target: 0 },   // Ramp-down
]
```

## 🔧 Customization

### Adjust Load Levels

Edit the `stages` array in `central-merchant-auth-loadtest.js`:

```javascript
stages: [
  { duration: '2m', target: 10 },  // Change target VUs
  { duration: '3m', target: 50 },  // Increase peak load
  // ...
]
```

### Adjust Think Time

Edit the `sleep()` value in the default function:

```javascript
sleep(1);     // Current: 1 second between requests
sleep(0.5);   // Faster: 500ms between requests
sleep(2);     // Slower: 2 seconds between requests
```

### Adjust Thresholds

Edit the `thresholds` in options:

```javascript
thresholds: {
  'http_req_duration': ['p(95)<500'],  // Stricter: 500ms
  'http_req_failed': ['rate<0.01'],    // Stricter: 1% errors
}
```

## 📈 Advanced Usage

### Run with Custom Duration (Override stages)

```bash
# Quick 2-minute test with 10 VUs
k6 run --vus 10 --duration 2m central-merchant-auth-loadtest.js
```

### Generate HTML Report

```bash
k6 run --out json=results.json central-merchant-auth-loadtest.js
# Then use k6-reporter to generate HTML (requires additional setup)
```

### Run with Cloud Output (k6 Cloud)

```bash
k6 run --out cloud central-merchant-auth-loadtest.js
```

## 🐛 Troubleshooting

### Issue: "Cannot open file"

**Error:** `open /path/to/csv: no such file or directory`

**Solution:** Update `CSV_FILE_PATH` in the script with the correct absolute path.

### Issue: "All checks failing"

**Possible causes:**
1. Service is down
2. Wrong base URL
3. Network connectivity issues
4. Authentication/authorization issues

**Debug:**
```bash
# Run smoke test with verbose output
k6 run --verbose central-merchant-auth-smoketest.js
```

### Issue: High error rate during load test

**Common causes:**
1. Service can't handle the load (expected in load testing!)
2. Rate limiting
3. Database connection pool exhausted
4. Timeouts

**Actions:**
- Reduce target VUs
- Increase sleep duration
- Check service logs

## 📝 Notes

- **Data:** Uses 2 real production requests from CSV
- **Strategy:** Random selection per iteration
- **Environment:** Staging (central-merchant-auth-service.bharatpe.co.in)
- **Protocol:** HTTPS
- **Endpoint:** POST /auth/v2/generate-token-for-v2

## 🔐 Security

⚠️ **Important:** The CSV contains real production access tokens. Keep this file secure and do not commit to public repositories.

## 📚 Resources

- [K6 Documentation](https://k6.io/docs/)
- [K6 Best Practices](https://k6.io/docs/testing-guides/load-testing-best-practices/)
- [PromQL Metrics](https://k6.io/docs/results-visualization/prometheus/)
