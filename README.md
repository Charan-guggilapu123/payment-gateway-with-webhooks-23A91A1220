# Payment Gateway with Webhooks

A production-ready payment gateway system built with Node.js featuring asynchronous job processing, webhook delivery with retry logic, embeddable SDK, and comprehensive refund support.

## Architecture

- **Backend API**: Express.js REST API with authentication
- **Database**: PostgreSQL with Sequelize ORM
- **Job Queue**: Bull queue with Redis for async processing
- **Worker Service**: Dedicated worker for payment, webhook, and refund processing
- **Dashboard**: React SPA for payment management and webhook configuration
- **Checkout**: Embeddable payment widget with modal/iframe support
- **Containerization**: Docker Compose with 6 services

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Ports 8000, 3000, 3001, 5432, 6379 available

### Setup

```bash
# Start all services
docker-compose up -d

# Check service health
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/test/jobs/status

# Access applications
# API: http://localhost:8000
# Dashboard: http://localhost:3000
# Checkout: http://localhost:3001
```

### Test Merchant Credentials

```
API Key: key_test_abc123
API Secret: secret_test_xyz789
Webhook Secret: whsec_test_abc123
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TEST_MODE` | `true` | Enable test mode with simulated processing |
| `TEST_PROCESSING_DELAY` | `5000` | Payment processing delay in ms (test mode) |
| `TEST_PAYMENT_SUCCESS` | `true` | Force all payments to succeed in test mode |
| `WEBHOOK_RETRY_INTERVALS_TEST` | `0,5,10,15,20` | Retry intervals in seconds (test mode) |
| `WEBHOOK_RETRY_INTERVALS` | `0,60,300,1800,7200` | Retry intervals in production (0s, 1m, 5m, 30m, 2h) |

## API Documentation

### Authentication

All API requests require headers:
```
X-Api-Key: key_test_abc123
X-Api-Secret: secret_test_xyz789
```

### Endpoints

#### Create Order
```bash
POST /api/v1/orders
Content-Type: application/json

{
  "amount": 50000,
  "currency": "INR",
  "receipt": "receipt_123"
}
```

#### Create Payment (with Idempotency)
```bash
POST /api/v1/payments
Content-Type: application/json
Idempotency-Key: unique_key_123

{
  "order_id": "order_abc123",
  "method": "upi",
  "captured": true,
  "upi_id": "user@upi"
}
```

#### Create Refund
```bash
POST /api/v1/payments/:id/refunds
Content-Type: application/json

{
  "amount": 10000,
  "reason": "Customer request"
}
```

#### Get Webhook Logs
```bash
GET /api/v1/webhooks?limit=50&offset=0
```

#### Retry Webhook
```bash
POST /api/v1/webhooks/:id/retry
```

#### Get Job Status (No Auth Required)
```bash
GET /api/v1/test/jobs/status
```

## Webhook Integration

### Webhook Events

- `order.created` - Order created
- `payment.pending` - Payment initiated
- `payment.success` - Payment successful
- `payment.failed` - Payment failed
- `refund.pending` - Refund initiated
- `refund.processed` - Refund completed

### Verify Webhook Signature

```javascript
const crypto = require('crypto');

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
}
```

### Retry Logic

- **Production**: 5 attempts at intervals 0s, 1m, 5m, 30m, 2h
- **Test Mode**: 5 attempts at intervals 0s, 5s, 10s, 15s, 20s

## SDK Integration

### Installation

```html
<script src="http://localhost:3001/checkout.js"></script>
```

### Usage

```javascript
const checkout = new PaymentGateway({
  key: 'key_test_abc123',
  orderId: order.data.id,
  amount: 50000,
  
  onSuccess: function(response) {
    console.log('Payment successful:', response.paymentId);
  },
  
  onFailure: function(error) {
    console.error('Payment failed:', error);
  }
});

checkout.open();
```

## Testing

```bash
# Check queue status
curl http://localhost:8000/api/v1/test/jobs/status

# View logs
docker-compose logs -f worker

# Test webhook receiver
node test-merchant/webhook-receiver.js
```

## License

MIT