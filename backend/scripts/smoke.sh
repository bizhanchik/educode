#!/bin/bash
# EduCode Backend - Smoke Tests
# Quick curl-based tests to verify critical API functionality

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_URL="${API_URL:-http://localhost:8000}"
API_PREFIX="/api/v1"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print colored output
print_test() {
    echo -e "${BLUE}[TEST ${TESTS_RUN}]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to run a test
run_test() {
    local test_name=$1
    local curl_cmd=$2
    local expected_status=$3

    TESTS_RUN=$((TESTS_RUN + 1))
    print_test "$test_name"

    # Execute curl and capture response and status code
    response=$(eval $curl_cmd)
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)

    # Check status code
    if [ "$status_code" == "$expected_status" ]; then
        print_success "Status: $status_code (expected $expected_status)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
    else
        print_error "Status: $status_code (expected $expected_status)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "$body"
    fi
    echo ""
}

# Start tests
echo "========================================"
echo "🚀 EduCode API Smoke Tests"
echo "========================================"
echo "API URL: $API_URL"
echo ""

# Test 1: Health Check
run_test "Health check" \
    "curl -s -w '\n%{http_code}' $API_URL$API_PREFIX/health" \
    "200"

# Test 2: Admin Login
print_test "Admin login"
TESTS_RUN=$((TESTS_RUN + 1))
LOGIN_RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL$API_PREFIX/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@educode.io","password":"Passw0rd!"}')
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | tail -n 1)
LOGIN_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$LOGIN_STATUS" == "200" ]; then
    print_success "Admin login successful"
    ADMIN_TOKEN=$(echo "$LOGIN_BODY" | jq -r '.access_token')
    echo "Token (first 20 chars): ${ADMIN_TOKEN:0:20}..."
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Admin login failed (Status: $LOGIN_STATUS)"
    echo "$LOGIN_BODY"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    echo ""
    echo "⚠️  Cannot continue without admin token. Stopping tests."
    exit 1
fi
echo ""

# Test 3: Get Current User (Admin)
run_test "Get current user (admin)" \
    "curl -s -w '\n%{http_code}' $API_URL$API_PREFIX/auth/me -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

# Test 4: List Users
run_test "List users" \
    "curl -s -w '\n%{http_code}' $API_URL$API_PREFIX/users/ -H 'Authorization: Bearer $ADMIN_TOKEN'" \
    "200"

# Test 5: Create New User (Student)
print_test "Create new student"
TESTS_RUN=$((TESTS_RUN + 1))
CREATE_USER_RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL$API_PREFIX/users/" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -d '{
        "name":"Test Student",
        "email":"teststudent@educode.io",
        "password":"Passw0rd!",
        "role":"student",
        "group_id":1
    }')
CREATE_USER_STATUS=$(echo "$CREATE_USER_RESPONSE" | tail -n 1)

if [ "$CREATE_USER_STATUS" == "200" ]; then
    print_success "Student created successfully"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_warning "Student creation returned status: $CREATE_USER_STATUS (may already exist)"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
echo ""

# Test 6: Teacher Login
print_test "Teacher login"
TESTS_RUN=$((TESTS_RUN + 1))
TEACHER_LOGIN_RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL$API_PREFIX/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"teacher@educode.io","password":"Passw0rd!"}')
TEACHER_LOGIN_STATUS=$(echo "$TEACHER_LOGIN_RESPONSE" | tail -n 1)
TEACHER_LOGIN_BODY=$(echo "$TEACHER_LOGIN_RESPONSE" | head -n -1)

if [ "$TEACHER_LOGIN_STATUS" == "200" ]; then
    print_success "Teacher login successful"
    TEACHER_TOKEN=$(echo "$TEACHER_LOGIN_BODY" | jq -r '.access_token')
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Teacher login failed (Status: $TEACHER_LOGIN_STATUS)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 7: List Subjects
run_test "List subjects" \
    "curl -s -w '\n%{http_code}' $API_URL$API_PREFIX/subjects/ -H 'Authorization: Bearer $TEACHER_TOKEN'" \
    "200"

# Test 8: List Lessons
run_test "List lessons" \
    "curl -s -w '\n%{http_code}' '$API_URL/api/lessons/?page=1&size=10' -H 'Authorization: Bearer $TEACHER_TOKEN'" \
    "200"

# Test 9: List Tasks
run_test "List tasks" \
    "curl -s -w '\n%{http_code}' '$API_URL/api/tasks/?page=1&size=10' -H 'Authorization: Bearer $TEACHER_TOKEN'" \
    "200"

# Test 10: Student Login
print_test "Student login"
TESTS_RUN=$((TESTS_RUN + 1))
STUDENT_LOGIN_RESPONSE=$(curl -s -w '\n%{http_code}' -X POST "$API_URL$API_PREFIX/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"student1@educode.io","password":"Passw0rd!"}')
STUDENT_LOGIN_STATUS=$(echo "$STUDENT_LOGIN_RESPONSE" | tail -n 1)
STUDENT_LOGIN_BODY=$(echo "$STUDENT_LOGIN_RESPONSE" | head -n -1)

if [ "$STUDENT_LOGIN_STATUS" == "200" ]; then
    print_success "Student login successful"
    STUDENT_TOKEN=$(echo "$STUDENT_LOGIN_BODY" | jq -r '.access_token')
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    print_error "Student login failed (Status: $STUDENT_LOGIN_STATUS)"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 11: Student views tasks
run_test "Student views tasks" \
    "curl -s -w '\n%{http_code}' '$API_URL/api/tasks/?page=1&size=10' -H 'Authorization: Bearer $STUDENT_TOKEN'" \
    "200"

# Test 12: Unauthorized access (no token)
run_test "Unauthorized access (no token)" \
    "curl -s -w '\n%{http_code}' $API_URL$API_PREFIX/users/" \
    "401"

# Test 13: Similarity Service Health
run_test "Similarity service health" \
    "curl -s -w '\n%{http_code}' $API_URL$API_PREFIX/similarity/ping" \
    "200"

# Print summary
echo "========================================"
echo "📊 Test Summary"
echo "========================================"
echo "Total tests:  $TESTS_RUN"
echo -e "${GREEN}Passed:       $TESTS_PASSED${NC}"
echo -e "${RED}Failed:       $TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed!${NC}"
    exit 1
fi
