#!/bin/bash

# Payment Gateway Test Suite
# This script tests all major features

API_URL="http://localhost:8000"
API_KEY="key_test_abc123"
API_SECRET="secret_test_xyz789"

echo "🚀 Payment Gateway Test Suite"
echo "==============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Health Check
echo "1️⃣  Testing Health Check..."
HEALTH=$(curl -s http://localhost:8000/health)
if [[ $HEALTH == *"healthy"* ]]; then
  echo -e "${GREEN}✓${NC} Health check passed"
else
  echo -e "${RED}✗${NC} Health check failed"
  exit 1
fi
echo ""

# Test 2: Job Status
echo "2️⃣  Testing Job Status Endpoint..."
STATUS=$(curl -s http://localhost:8000/api/v1/test/jobs/status)
if [[ $STATUS == *"worker_status"* ]]; then
  echo -e "${GREEN}✓${NC} Job status endpoint working"
  echo "   $STATUS" | jq -r '.data | "Pending: \(.pending), Processing: \(.processing), Completed: \(.completed), Failed: \(.failed)"'
else
  echo -e "${RED}✗${NC} Job status endpoint failed"
fi
echo ""

# Test 3: Create Order
echo "3️⃣  Testing Order Creation..."
ORDER_RESPONSE=$(curl -s -X POST $API_URL/api/v1/orders \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Api-Secret: $API_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "currency": "INR", "receipt": "test_receipt_1"}')

ORDER_ID=$(echo $ORDER_RESPONSE | jq -r '.data.id')
if [[ $ORDER_ID != "null" && $ORDER_ID != "" ]]; then
  echo -e "${GREEN}✓${NC} Order created: $ORDER_ID"
else
  echo -e "${RED}✗${NC} Order creation failed"
  echo "$ORDER_RESPONSE" | jq
  exit 1
fi
echo ""

# Test 4: Create Payment with Idempotency
echo "4️⃣  Testing Payment Creation with Idempotency..."
IDEMPOTENCY_KEY="test_key_$(date +%s)"
PAYMENT_RESPONSE=$(curl -s -X POST $API_URL/api/v1/payments \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Api-Secret: $API_SECRET" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d "{\"order_id\": \"$ORDER_ID\", \"method\": \"upi\", \"captured\": true, \"upi_id\": \"test@upi\"}")

PAYMENT_ID=$(echo $PAYMENT_RESPONSE | jq -r '.data.id')
if [[ $PAYMENT_ID != "null" && $PAYMENT_ID != "" ]]; then
  echo -e "${GREEN}✓${NC} Payment created: $PAYMENT_ID"
  echo "   Status: $(echo $PAYMENT_RESPONSE | jq -r '.data.status')"
else
  echo -e "${RED}✗${NC} Payment creation failed"
  echo "$PAYMENT_RESPONSE" | jq
  exit 1
fi
echo ""

# Test 5: Verify Idempotency
echo "5️⃣  Testing Idempotency (duplicate request)..."
DUPLICATE_RESPONSE=$(curl -s -X POST $API_URL/api/v1/payments \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Api-Secret: $API_SECRET" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d "{\"order_id\": \"$ORDER_ID\", \"method\": \"upi\", \"captured\": true, \"upi_id\": \"test@upi\"}")

DUPLICATE_PAYMENT_ID=$(echo $DUPLICATE_RESPONSE | jq -r '.data.id')
if [[ $DUPLICATE_PAYMENT_ID == $PAYMENT_ID ]]; then
  echo -e "${GREEN}✓${NC} Idempotency working (same payment ID returned)"
else
  echo -e "${RED}✗${NC} Idempotency failed (different payment ID)"
fi
echo ""

# Test 6: Wait for Payment Processing
echo "6️⃣  Waiting for payment processing (10 seconds)..."
for i in {1..10}; do
  echo -n "."
  sleep 1
done
echo ""

PAYMENT_STATUS=$(curl -s $API_URL/api/v1/payments/$PAYMENT_ID \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Api-Secret: $API_SECRET" | jq -r '.data.status')

if [[ $PAYMENT_STATUS == "success" ]]; then
  echo -e "${GREEN}✓${NC} Payment processed successfully"
elif [[ $PAYMENT_STATUS == "failed" ]]; then
  echo -e "${YELLOW}⚠${NC} Payment failed (expected in test mode)"
else
  echo -e "${YELLOW}⚠${NC} Payment still pending: $PAYMENT_STATUS"
fi
echo ""

# Test 7: Create Refund
if [[ $PAYMENT_STATUS == "success" ]]; then
  echo "7️⃣  Testing Refund Creation..."
  REFUND_RESPONSE=$(curl -s -X POST $API_URL/api/v1/payments/$PAYMENT_ID/refunds \
    -H "X-Api-Key: $API_KEY" \
    -H "X-Api-Secret: $API_SECRET" \
    -H "Content-Type: application/json" \
    -d '{"amount": 10000, "reason": "Test refund"}')

  REFUND_ID=$(echo $REFUND_RESPONSE | jq -r '.data.id')
  if [[ $REFUND_ID != "null" && $REFUND_ID != "" ]]; then
    echo -e "${GREEN}✓${NC} Refund created: $REFUND_ID"
  else
    echo -e "${RED}✗${NC} Refund creation failed"
    echo "$REFUND_RESPONSE" | jq
  fi
  echo ""
else
  echo "7️⃣  Skipping refund test (payment not successful)"
  echo ""
fi

# Test 8: Get Webhook Logs
echo "8️⃣  Testing Webhook Logs..."
WEBHOOKS=$(curl -s "$API_URL/api/v1/webhooks?limit=5" \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Api-Secret: $API_SECRET")

WEBHOOK_COUNT=$(echo $WEBHOOKS | jq -r '.data | length')
echo -e "${GREEN}✓${NC} Retrieved $WEBHOOK_COUNT webhook logs"
if [[ $WEBHOOK_COUNT > 0 ]]; then
  echo "   Latest webhook:"
  echo $WEBHOOKS | jq -r '.data[0] | "   Event: \(.event), Status: \(.status), Attempts: \(.attempts)"'
fi
echo ""

# Test 9: List Orders
echo "9️⃣  Testing Order Listing..."
ORDERS=$(curl -s "$API_URL/api/v1/orders?limit=5" \
  -H "X-Api-Key: $API_KEY" \
  -H "X-Api-Secret: $API_SECRET")

ORDER_COUNT=$(echo $ORDERS | jq -r '.data | length')
echo -e "${GREEN}✓${NC} Retrieved $ORDER_COUNT orders"
echo ""

# Test 10: Final Job Status
echo "🔟 Final Job Status..."
FINAL_STATUS=$(curl -s http://localhost:8000/api/v1/test/jobs/status)
echo $FINAL_STATUS | jq '.data'
echo ""

echo "==============================="
echo -e "${GREEN}✅ Test suite completed!${NC}"
echo ""
echo "📊 Summary:"
echo "  - Order ID: $ORDER_ID"
echo "  - Payment ID: $PAYMENT_ID"
echo "  - Payment Status: $PAYMENT_STATUS"
if [[ $REFUND_ID != "" ]]; then
  echo "  - Refund ID: $REFUND_ID"
fi
echo ""
echo "🌐 Access Points:"
echo "  - Dashboard: http://localhost:3000"
echo "  - Checkout: http://localhost:3001"
echo "  - API: http://localhost:8000"
