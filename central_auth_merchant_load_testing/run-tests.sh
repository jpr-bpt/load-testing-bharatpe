#!/bin/bash

# ============================================================================
# K6 Load Test Runner Script
# Central Merchant Auth Service
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================================================
# Functions
# ============================================================================

print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# ============================================================================
# Check Prerequisites
# ============================================================================

check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        print_error "k6 is not installed"
        echo ""
        echo "Install k6:"
        echo "  macOS: brew install k6"
        echo "  Other: https://k6.io/docs/getting-started/installation/"
        exit 1
    fi
    
    print_success "k6 is installed ($(k6 version))"
    
    # Check if CSV file exists
    if [ ! -f "sample_central_merchant_auth_load_testing_script.csv" ]; then
        print_error "CSV file not found"
        exit 1
    fi
    
    print_success "CSV file found"
    echo ""
}

# ============================================================================
# Run Smoke Test
# ============================================================================

run_smoke_test() {
    print_header "Running Smoke Test"
    echo ""
    print_warning "Duration: ~1 minute"
    print_warning "Load: 1-2 VUs"
    echo ""
    
    if k6 run central-merchant-auth-smoketest.js; then
        echo ""
        print_success "SMOKE TEST PASSED"
        return 0
    else
        echo ""
        print_error "SMOKE TEST FAILED"
        return 1
    fi
}

# ============================================================================
# Run Full Load Test
# ============================================================================

run_load_test() {
    print_header "Running Full Load Test"
    echo ""
    print_warning "Duration: ~12 minutes"
    print_warning "Load: 5 → 25 VUs"
    echo ""
    
    if k6 run central-merchant-auth-loadtest.js; then
        echo ""
        print_success "LOAD TEST PASSED"
        return 0
    else
        echo ""
        print_error "LOAD TEST FAILED (Thresholds not met)"
        return 1
    fi
}

# ============================================================================
# Main Menu
# ============================================================================

show_menu() {
    echo ""
    print_header "K6 Load Test - Central Merchant Auth"
    echo ""
    echo "1) Run Smoke Test (Quick validation - 1 min)"
    echo "2) Run Full Load Test (Complete test - 12 min)"
    echo "3) Run Both (Smoke first, then Load)"
    echo "4) Exit"
    echo ""
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    # Check prerequisites
    check_prerequisites
    
    # If arguments provided, run accordingly
    if [ $# -gt 0 ]; then
        case "$1" in
            smoke)
                run_smoke_test
                exit $?
                ;;
            load)
                run_load_test
                exit $?
                ;;
            both)
                run_smoke_test
                if [ $? -eq 0 ]; then
                    echo ""
                    echo "Press Enter to continue with full load test, or Ctrl+C to cancel..."
                    read
                    run_load_test
                    exit $?
                else
                    print_error "Smoke test failed. Skipping load test."
                    exit 1
                fi
                ;;
            *)
                echo "Usage: $0 [smoke|load|both]"
                exit 1
                ;;
        esac
    fi
    
    # Interactive menu
    while true; do
        show_menu
        read -p "Select option (1-4): " choice
        
        case $choice in
            1)
                run_smoke_test
                ;;
            2)
                run_load_test
                ;;
            3)
                run_smoke_test
                if [ $? -eq 0 ]; then
                    echo ""
                    read -p "Smoke test passed. Continue with load test? (y/n): " continue
                    if [ "$continue" = "y" ] || [ "$continue" = "Y" ]; then
                        run_load_test
                    fi
                else
                    print_error "Smoke test failed. Fix issues before running load test."
                fi
                ;;
            4)
                echo "Exiting..."
                exit 0
                ;;
            *)
                print_error "Invalid option. Please select 1-4."
                ;;
        esac
    done
}

# Run main function
main "$@"
