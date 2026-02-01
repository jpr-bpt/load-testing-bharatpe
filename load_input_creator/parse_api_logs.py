import json
import csv
from datetime import datetime

# --------------------------------------------------
# CONFIG
# --------------------------------------------------
INPUT_FILE = "coralogix_logs_20260130_173117.jsonl"
OUTPUT_FILE = f"api_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"

# --------------------------------------------------
# CSV HEADERS
# --------------------------------------------------
CSV_HEADERS = [
    "timestamp",
    "log_id",
    "request_id",
    "trace_id",
    "pod_name",
    "thread",
    "api_endpoint",
    "http_method",
    "request_json",
    "response_json",
    "status_code",
    "duration_ms"
]

def parse_key_value_log(log_section):
    """
    Parse key=value pairs from API_LOGGING section.
    Handles nested JSON values.
    """
    result = {}
    current_key = None
    current_value = []
    in_json = False
    brace_count = 0
    
    i = 0
    while i < len(log_section):
        char = log_section[i]
        
        if char == '=' and not in_json and current_key is None:
            # Found key
            # Backtrack to find the start of the key
            j = i - 1
            while j >= 0 and log_section[j] not in [',', ' ', '{']:
                j -= 1
            current_key = log_section[j+1:i].strip()
            i += 1
            continue
        
        if current_key:
            if char == '{':
                in_json = True
                brace_count += 1
                current_value.append(char)
            elif char == '}':
                current_value.append(char)
                brace_count -= 1
                if brace_count == 0:
                    in_json = False
            elif char == ',' and not in_json:
                # End of value
                value_str = ''.join(current_value).strip()
                result[current_key] = value_str
                current_key = None
                current_value = []
            else:
                current_value.append(char)
        
        i += 1
    
    # Don't forget the last key-value pair
    if current_key and current_value:
        value_str = ''.join(current_value).strip()
        result[current_key] = value_str
    
    return result

def extract_api_log_info(log_entry):
    """
    Extract API logging information from a log entry.
    Returns a dictionary with extracted fields or None if not an API log.
    """
    try:
        # Navigate the nested structure
        result = log_entry.get("result", {})
        results = result.get("results", [])
        
        if not results:
            return None
        
        first_result = results[0]
        
        # Extract metadata
        metadata = {item["key"]: item["value"] for item in first_result.get("metadata", [])}
        labels = {item["key"]: item["value"] for item in first_result.get("labels", [])}
        
        # Parse userData JSON string
        user_data_str = first_result.get("userData", "{}")
        user_data = json.loads(user_data_str)
        
        # Get the log message
        log_message = user_data.get("log", "")
        
        # Check if this is an API_LOGGING entry
        if "API_LOGGING:" not in log_message:
            return None
        
        # Extract basic info
        timestamp = metadata.get("timestamp", "")
        log_id = metadata.get("logid", "")
        pod_name = user_data.get("kubernetes", {}).get("pod_name", "")
        
        # # Parse the log message to extract request_id, trace_id, thread
        # request_id = ""
        # trace_id = ""
        # thread = ""
        
        # # Extract thread name (e.g., [http-nio-9091-exec-1])
        # if "[" in log_message and "]" in log_message:
        #     parts = log_message.split("[")
        #     for part in parts:
        #         if "http-nio" in part or "exec" in part:
        #             thread = part.split("]")[0].strip()
        #         if "X-Request-ID=" in part:
        #             request_id = part.split("X-Request-ID=")[1].split(",")[0].split("]")[0].strip()
        #         if "trace_id=" in part:
        #             trace_id = part.split("trace_id=")[1].split(",")[0].split("]")[0].strip()
        
        # Extract API_LOGGING data section
        api_logging_start = log_message.find("API_LOGGING:")
        if api_logging_start == -1:
            return None
        
        api_section = log_message[api_logging_start + len("API_LOGGING:"):].strip()
        
        # Remove leading/trailing braces if present
        if api_section.startswith("{") and api_section.endswith("}"):
            api_section = api_section[1:-1]
        
        # Parse the key-value pairs
        api_data = parse_key_value_log(api_section)
        
        # Extract fields
        api_endpoint = api_data.get("request_url", "")
        http_method = api_data.get("api_method", "")
        request_body = api_data.get("request_body", "")
        response_body = api_data.get("response", "")
        duration_ms = api_data.get("api_time", "")
        client_name = api_data.get("clientname", "")
        
        # Try to parse request_body and response as JSON for pretty formatting
        try:
            if request_body:
                request_json = json.dumps(json.loads(request_body), ensure_ascii=False)
            else:
                request_json = ""
        except:
            request_json = request_body
        
        try:
            if response_body:
                response_json = json.dumps(json.loads(response_body), ensure_ascii=False)
            else:
                response_json = ""
        except:
            response_json = response_body
        
        return {
            "timestamp": timestamp,
            "log_id": log_id,
            "pod_name": pod_name,
            "api_endpoint": api_endpoint,
            "http_method": http_method,
            "request_json": request_json,
            "response_json": response_json,
            "status_code": "",  # Not in this log format
            "duration_ms": duration_ms
        }
        
    except Exception as e:
        print(f"Error parsing log entry: {e}")
        import traceback
        traceback.print_exc()
        return None

# --------------------------------------------------
# MAIN PROCESSING
# --------------------------------------------------
print("=" * 70)
print("📊 API LOG PARSER")
print("=" * 70)
print(f"Input file: {INPUT_FILE}")
print(f"Output file: {OUTPUT_FILE}")
print("-" * 70)

api_logs = []
total_lines = 0
total_log_entries = 0
api_log_count = 0

with open(INPUT_FILE, "r") as f:
    for line_num, line in enumerate(f, 1):
        if not line.strip():
            continue
        
        total_lines += 1
        
        try:
            log_entry = json.loads(line)
            result = log_entry.get("result", {})
            results = result.get("results", [])
            
            # Process ALL results in the array, not just the first one
            for single_result in results:
                total_log_entries += 1
                
                # Create a temporary log entry with just this result
                temp_log_entry = {
                    "result": {
                        "results": [single_result]
                    }
                }
                
                api_info = extract_api_log_info(temp_log_entry)
                
                if api_info:
                    api_logs.append(api_info)
                    api_log_count += 1
                    
                    if api_log_count % 100 == 0:
                        print(f"Processed {total_log_entries} log entries from {total_lines} lines, found {api_log_count} API logs...")
        
        except json.JSONDecodeError as e:
            print(f"Warning: Could not parse line {line_num}: {e}")
            continue

print("-" * 70)
print(f"✅ Processed {total_lines} JSONL lines")
print(f"📊 Total log entries: {total_log_entries}")
print(f"📝 Found {api_log_count} API_LOGGING entries")

# --------------------------------------------------
# WRITE TO CSV
# --------------------------------------------------
if api_logs:
    with open(OUTPUT_FILE, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=CSV_HEADERS)
        writer.writeheader()
        writer.writerows(api_logs)
    
    print(f"💾 Saved to: {OUTPUT_FILE}")
else:
    print("⚠️  No API logs found to save")

print("=" * 70)
