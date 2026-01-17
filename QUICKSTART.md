# Quick Start Guide

## Setup and Run

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Wait for services to be healthy (~30 seconds):**
   ```bash
   docker-compose ps
   ```

3. **Verify services:**
   ```bash
   # API health
   curl http://localhost:8000/health
   
   # Job queue status
   curl http://localhost:8000/api/v1/test/jobs/status
   
   # Dashboard
   curl http://localhost:3000
   
   # Checkout
   curl http://localhost:3001
   ```

## Access the Application

- **Dashboard**: http://localhost:3000
- **Checkout**: http://localhost:3001
- **API**: http://localhost:8000
- **SDK Demo**: Open `demo.html` in browser

## Test the Payment Flow

### Method 1: Using SDK Demo

1. Open `demo.html` in your browser
2. Click "Create Order"
3. Click "Pay ₹500.00"
4. Fill payment details and submit
5. Check the status message

### Method 2: Using curl

```bash
# 1. Create Order
ORDER=$(curl -X POST http://localhost:8000/api/v1/orders \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "currency": "INR"}' | jq -r '.data.id')

echo "Order ID: $ORDER"

# 2. Create Payment
PAYMENT=$(curl -X POST http://localhost:8000/api/v1/payments \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d "{\"order_id\": \"$ORDER\", \"method\": \"upi\", \"captured\": true, \"upi_id\": \"test@upi\"}" | jq -r '.data.id')

echo "Payment ID: $PAYMENT"

# 3. Wait 10 seconds for processing
sleep 10

# 4. Check Payment Status
curl http://localhost:8000/api/v1/payments/$PAYMENT \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" | jq
```

## Test Webhooks

### Start Test Webhook Receiver

```bash
cd test-merchant
npm install
node webhook-receiver.js
```

The receiver will listen on http://localhost:4000

### Configure Webhook URL

Via Dashboard:
1. Go to http://localhost:3000/webhooks
2. Enter webhook URL: `http://host.docker.internal:4000/webhook`
3. Click "Save Configuration"

Or update directly in database.

### Trigger Payment

Create a payment (see above) and watch webhook logs in the receiver terminal.

## Monitor Jobs

```bash
# Real-time status
curl http://localhost:8000/api/v1/test/jobs/status

# Worker logs
docker-compose logs -f worker

# API logs
docker-compose logs -f api
```

## Test Refunds

```bash
# Create refund (partial)
curl -X POST http://localhost:8000/api/v1/payments/$PAYMENT/refunds \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"amount": 10000, "reason": "Customer request"}' | jq

# Check refund status after 5 seconds
sleep 5
curl http://localhost:8000/api/v1/payments/$PAYMENT \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" | jq '.data.refunds'
```

## View Webhook Logs

```bash
# Via API
curl "http://localhost:8000/api/v1/webhooks?limit=10" \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" | jq

# Or use Dashboard
# http://localhost:3000/webhooks
```

## Troubleshooting

### Services not starting

```bash
docker-compose logs
docker-compose down -v
docker-compose up -d
```

### Worker not processing

```bash
docker-compose logs worker
docker-compose restart worker
```

### Database issues

```bash
docker-compose logs postgres
docker-compose down -v
docker-compose up -d
```

### Clear all data

```bash
docker-compose down -v
docker-compose up -d
```

## Stop Services

```bash
docker-compose down
```

## Test Credentials

- **API Key**: `key_test_abc123`
- **API Secret**: `secret_test_xyz789`
- **Webhook Secret**: `whsec_test_abc123`
