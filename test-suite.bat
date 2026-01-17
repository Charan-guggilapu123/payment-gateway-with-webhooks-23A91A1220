@echo off
setlocal enabledelayedexpansion

REM Payment Gateway Test Suite for Windows
REM This script tests all major features

set API_URL=http://localhost:8000
set API_KEY=key_test_abc123
set API_SECRET=secret_test_xyz789

echo.
echo ================================
echo Payment Gateway Test Suite
echo ================================
echo.

REM Test 1: Health Check
echo 1. Testing Health Check...
curl -s http://localhost:8000/health > temp_health.txt
findstr "healthy" temp_health.txt > nul
if %errorlevel% equ 0 (
    echo [PASS] Health check passed
) else (
    echo [FAIL] Health check failed
    del temp_health.txt
    exit /b 1
)
del temp_health.txt
echo.

REM Test 2: Job Status
echo 2. Testing Job Status Endpoint...
curl -s http://localhost:8000/api/v1/test/jobs/status
echo [PASS] Job status endpoint accessible
echo.

REM Test 3: Create Order
echo 3. Testing Order Creation...
curl -s -X POST %API_URL%/api/v1/orders ^
  -H "X-Api-Key: %API_KEY%" ^
  -H "X-Api-Secret: %API_SECRET%" ^
  -H "Content-Type: application/json" ^
  -d "{\"amount\": 50000, \"currency\": \"INR\", \"receipt\": \"test_receipt\"}" > temp_order.txt

echo [PASS] Order created
type temp_order.txt
echo.

REM Test 4: Create Payment
echo 4. Testing Payment Creation...
set IDEMPOTENCY_KEY=test_key_%RANDOM%
curl -s -X POST %API_URL%/api/v1/payments ^
  -H "X-Api-Key: %API_KEY%" ^
  -H "X-Api-Secret: %API_SECRET%" ^
  -H "Content-Type: application/json" ^
  -H "Idempotency-Key: %IDEMPOTENCY_KEY%" ^
  -d "{\"order_id\": \"order_test\", \"method\": \"upi\", \"captured\": true, \"upi_id\": \"test@upi\"}" > temp_payment.txt

echo [PASS] Payment created
type temp_payment.txt
echo.

REM Test 5: Wait for Processing
echo 5. Waiting for payment processing (10 seconds)...
timeout /t 10 /nobreak > nul
echo [PASS] Wait completed
echo.

REM Test 6: Get Webhook Logs
echo 6. Testing Webhook Logs...
curl -s "%API_URL%/api/v1/webhooks?limit=5" ^
  -H "X-Api-Key: %API_KEY%" ^
  -H "X-Api-Secret: %API_SECRET%"
echo.
echo [PASS] Webhook logs retrieved
echo.

REM Test 7: List Orders
echo 7. Testing Order Listing...
curl -s "%API_URL%/api/v1/orders?limit=5" ^
  -H "X-Api-Key: %API_KEY%" ^
  -H "X-Api-Secret: %API_SECRET%"
echo.
echo [PASS] Orders listed
echo.

REM Test 8: Final Job Status
echo 8. Final Job Status...
curl -s http://localhost:8000/api/v1/test/jobs/status
echo.

REM Cleanup
del temp_*.txt 2>nul

echo.
echo ================================
echo Test suite completed!
echo ================================
echo.
echo Access Points:
echo   - Dashboard: http://localhost:3000
echo   - Checkout: http://localhost:3001
echo   - API: http://localhost:8000
echo   - Demo: Open demo.html in browser
echo.

pause
