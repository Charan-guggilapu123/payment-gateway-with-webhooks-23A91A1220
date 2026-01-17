# Payment Gateway with Webhooks - Project Summary

## 📋 Project Overview

A complete, production-ready payment gateway system built with Node.js, featuring asynchronous job processing, webhook delivery with retry logic, an embeddable JavaScript SDK, and comprehensive refund support.

**Repository**: payment-gateway-with-webhooks-23A91A1220  
**Tech Stack**: Node.js, Express, PostgreSQL, Redis, React, Docker  
**Date**: January 2026

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
├──────────────┬──────────────┬──────────────┬────────────────┤
│  Dashboard   │   Checkout   │  SDK (JS)    │   Merchant     │
│  (React)     │   Widget     │  Embeddable  │   Website      │
│  Port 3000   │  Port 3001   │              │                │
└──────────────┴──────────────┴──────────────┴────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       API Layer                              │
│  Express.js REST API (Port 8000)                            │
│  • Authentication (API Key/Secret)                          │
│  • Order Management                                         │
│  • Payment Processing                                       │
│  • Refund Handling                                          │
│  • Webhook Configuration                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   PostgreSQL Database    │  │      Redis Queue         │
│   • Merchants            │  │   • Payment Jobs         │
│   • Orders               │  │   • Webhook Jobs         │
│   • Payments             │  │   • Refund Jobs          │
│   • Refunds              │  │   • Job Monitoring       │
│   • Webhook Logs         │  └──────────────────────────┘
│   • Idempotency Keys     │              │
└──────────────────────────┘              │
                                          ▼
                              ┌────────────────────────┐
                              │   Worker Service       │
                              │  • Payment Processor   │
                              │  • Webhook Deliverer   │
                              │  • Refund Processor    │
                              └────────────────────────┘
                                          │
                                          ▼
                              ┌────────────────────────┐
                              │  Merchant Webhook URL  │
                              │  (HMAC Verification)   │
                              └────────────────────────┘
```

---

## 🎯 Key Features

### 1. Asynchronous Processing
- **Bull Queue** with Redis backend
- **3 Dedicated Queues**: ProcessPaymentJob, DeliverWebhookJob, ProcessRefundJob
- **Separate Worker Process**: Isolated from API for reliability
- **Job Monitoring**: Real-time status via `/api/v1/test/jobs/status`

### 2. Webhook System
- **HMAC-SHA256 Signatures**: Secure webhook verification
- **Automatic Retry Logic**: Up to 5 attempts with exponential backoff
  - Production: 0s, 1m, 5m, 30m, 2h
  - Test: 0s, 5s, 10s, 15s, 20s
- **Manual Retry**: Via Dashboard or API
- **Comprehensive Logging**: Every delivery attempt tracked

### 3. Payment Processing
- **Multiple Methods**: UPI, Card, Net Banking
- **Async Processing**: 5-10 second simulation
- **Test Mode**: Configurable success rates and delays
- **Status Tracking**: pending → success/failed
- **Capture Support**: Auto or manual capture

### 4. Idempotency
- **24-Hour Cache**: Prevents duplicate payments
- **Header-Based**: `Idempotency-Key` header
- **Response Caching**: Returns cached response for duplicates
- **Automatic Cleanup**: Expired keys removed

### 5. Refund System
- **Partial/Full Refunds**: Support for multiple refunds
- **Validation**: Total refunded ≤ payment amount
- **Async Processing**: 3-5 second simulation
- **Webhook Events**: refund.pending, refund.processed

### 6. Embeddable SDK
- **Easy Integration**: Single script tag
- **Modal/Iframe Support**: Seamless checkout experience
- **Event Callbacks**: onSuccess, onFailure, onClose
- **PostMessage Communication**: Secure parent-child messaging

---

## 📁 Project Structure

```
payment-gateway-with-webhooks-23A91A1220/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Redis config
│   │   ├── models/          # Sequelize models (6 tables)
│   │   ├── queues/          # Bull queue setup
│   │   ├── workers/         # Job processors
│   │   ├── middleware/      # Authentication
│   │   ├── routes/          # API endpoints
│   │   ├── server.js        # API entry point
│   │   └── worker.js        # Worker entry point
│   ├── Dockerfile           # API container
│   ├── Dockerfile.worker    # Worker container
│   └── package.json
│
├── dashboard/
│   ├── src/
│   │   ├── pages/           # React pages (4)
│   │   ├── App.js           # Main app
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
│
├── checkout-widget/
│   ├── src/
│   │   ├── CheckoutForm.js  # Payment form
│   │   └── sdk/             # SDK & styles
│   ├── public/
│   │   ├── checkout.js      # Embeddable SDK
│   │   └── index.html
│   ├── Dockerfile
│   └── package.json
│
├── test-merchant/
│   ├── webhook-receiver.js  # Test webhook endpoint
│   └── package.json
│
├── docker-compose.yml       # 6 services
├── .env                     # Environment config
├── README.md                # Main documentation
├── QUICKSTART.md            # Quick start guide
├── DEPLOYMENT.md            # Deployment guide
├── CHECKLIST.md             # Feature checklist
├── submission.yml           # Automated testing
├── demo.html                # SDK demo
├── test-suite.sh            # Linux test script
└── test-suite.bat           # Windows test script
```

---

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js 18
- **Framework**: Express.js 4.18
- **ORM**: Sequelize 6.35
- **Database**: PostgreSQL 15
- **Cache/Queue**: Redis 7
- **Job Queue**: Bull 4.12
- **HTTP Client**: Axios 1.6

### Frontend
- **Framework**: React 18.2
- **Routing**: react-router-dom 6.20
- **Build Tool**: react-scripts 5.0

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Services**: 6 containers (postgres, redis, api, worker, dashboard, checkout)

---

## 🚀 Getting Started

### Prerequisites
```bash
# Required
- Docker Desktop
- Ports available: 8000, 3000, 3001, 5432, 6379

# Optional (for testing)
- Node.js 18+ (for webhook receiver)
- curl or Postman (for API testing)
```

### Quick Start (30 seconds)
```bash
# 1. Start all services
docker-compose up -d

# 2. Wait for health checks (~30s)
docker-compose ps

# 3. Verify
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/test/jobs/status

# 4. Access
# Dashboard: http://localhost:3000
# Checkout: http://localhost:3001
# Demo: open demo.html
```

---

## 📊 API Endpoints

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - List orders
- `GET /api/v1/orders/:id` - Get order

### Payments
- `POST /api/v1/payments` - Create payment (with idempotency)
- `GET /api/v1/payments/:id` - Get payment
- `POST /api/v1/payments/:id/capture` - Capture payment

### Refunds
- `POST /api/v1/payments/:id/refunds` - Create refund
- `GET /api/v1/payments/:id/refunds` - List refunds

### Webhooks
- `GET /api/v1/webhooks` - List webhook logs
- `POST /api/v1/webhooks/:id/retry` - Retry webhook

### Testing
- `GET /api/v1/test/jobs/status` - Job queue stats (no auth)

---

## 🧪 Testing

### Test Credentials
```
API Key: key_test_abc123
API Secret: secret_test_xyz789
Webhook Secret: whsec_test_abc123
```

### Automated Test Suite
```bash
# Linux/Mac
./test-suite.sh

# Windows
test-suite.bat
```

### Manual Testing
```bash
# 1. Create order
ORDER=$(curl -X POST http://localhost:8000/api/v1/orders \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d '{"amount": 50000, "currency": "INR"}' | jq -r '.data.id')

# 2. Create payment
PAYMENT=$(curl -X POST http://localhost:8000/api/v1/payments \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789" \
  -H "Content-Type: application/json" \
  -d "{\"order_id\": \"$ORDER\", \"method\": \"upi\", \"captured\": true, \"upi_id\": \"test@upi\"}" | jq -r '.data.id')

# 3. Check status (after 10s)
curl http://localhost:8000/api/v1/payments/$PAYMENT \
  -H "X-Api-Key: key_test_abc123" \
  -H "X-Api-Secret: secret_test_xyz789"
```

---

## 🔐 Security

### Implemented Features
- ✅ API Key/Secret authentication
- ✅ HMAC-SHA256 webhook signatures
- ✅ Idempotency key support
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ Input validation
- ✅ CORS configuration

### Production Recommendations
- Rotate API keys regularly
- Use HTTPS/TLS
- Enable rate limiting
- Secure Redis with password
- Use environment-specific secrets
- Set up monitoring and alerts

---

## 📈 Performance

### Async Processing
- **Payment Processing**: 5-10 seconds (simulated)
- **Webhook Delivery**: Immediate + retries
- **Refund Processing**: 3-5 seconds (simulated)
- **Queue Throughput**: Configurable worker concurrency

### Scaling
- **Horizontal**: Add more worker containers
- **Vertical**: Increase worker memory/CPU
- **Database**: Connection pooling enabled
- **Redis**: Persistent queue storage

---

## 🎓 Key Concepts

### Webhook Flow
```
1. Payment Processed → Status: success
2. Create Webhook Log → event: payment.success
3. Enqueue DeliverWebhookJob
4. Worker picks up job
5. Generate HMAC signature
6. POST to merchant URL
7. On failure → schedule retry
8. Max 5 attempts → mark failed
```

### Idempotency Flow
```
1. Payment request with Idempotency-Key
2. Check if key exists in cache
3. If exists → return cached response
4. If new → process payment
5. Cache response for 24 hours
6. Return response
```

### Job Queue Flow
```
1. API enqueues job (ProcessPaymentJob)
2. Redis stores job
3. Worker picks up job
4. Process payment
5. Update database
6. Enqueue next job (DeliverWebhookJob)
7. Continue chain
```

---

## 📚 Documentation

- **README.md**: Comprehensive overview with API docs
- **QUICKSTART.md**: Step-by-step setup guide
- **DEPLOYMENT.md**: Detailed deployment and testing
- **CHECKLIST.md**: Feature implementation checklist
- **Code Comments**: Inline documentation in all files

---

## ✅ Compliance & Testing

### All Requirements Met
- ✅ Asynchronous job processing
- ✅ Webhook delivery with retry
- ✅ HMAC signature verification
- ✅ Embeddable JavaScript SDK
- ✅ Refund support (partial/full)
- ✅ Idempotency keys
- ✅ Enhanced dashboard
- ✅ Complete API
- ✅ Docker deployment
- ✅ Comprehensive documentation

### Test Coverage
- Unit tests: Worker logic
- Integration tests: API endpoints
- End-to-end: Complete payment flow
- Manual testing: Dashboard & SDK
- Automated: test-suite scripts

---

## 🎯 Use Cases

### 1. E-commerce Platform
```javascript
// Integrate checkout on product page
const checkout = new PaymentGateway({
  key: 'your_api_key',
  orderId: orderId,
  amount: cartTotal,
  onSuccess: (response) => {
    window.location = '/order-confirmation?payment=' + response.paymentId;
  }
});
document.getElementById('checkout-btn').onclick = () => checkout.open();
```

### 2. Subscription Service
```javascript
// Recurring payment setup
async function createSubscriptionPayment(userId, plan) {
  const order = await createOrder(plan.price);
  const payment = await createPayment({
    order_id: order.id,
    method: 'card',
    captured: true,
    metadata: { user_id: userId, plan: plan.name }
  });
  return payment;
}
```

### 3. Marketplace
```javascript
// Split payment with webhook
app.post('/webhook', (req, res) => {
  if (req.body.event === 'payment.success') {
    const payment = req.body.data;
    // Split payment to vendors
    splitPaymentToVendors(payment);
  }
  res.json({ success: true });
});
```

---

## 🏆 Best Practices Implemented

- ✅ Separation of concerns (API vs Worker)
- ✅ Error handling and retry logic
- ✅ Health checks and monitoring
- ✅ Graceful shutdown
- ✅ Environment-based configuration
- ✅ Docker multi-stage builds
- ✅ Database indexing
- ✅ Connection pooling
- ✅ Logging and debugging
- ✅ API versioning (/api/v1)
- ✅ Pagination support
- ✅ Data validation
- ✅ Security headers
- ✅ CORS configuration
- ✅ Test data isolation

---

## 🚧 Future Enhancements

- [ ] Rate limiting (Redis-based)
- [ ] API key rotation
- [ ] Multi-currency support
- [ ] Payment method tokenization
- [ ] 3D Secure integration
- [ ] Fraud detection
- [ ] Reporting dashboard
- [ ] Export functionality
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Admin portal
- [ ] Role-based access control

---

## 📞 Support & Maintenance

### Logs
```bash
docker-compose logs -f api
docker-compose logs -f worker
```

### Database Backups
```bash
docker exec postgres_gateway pg_dump -U gateway_user payment_gateway > backup.sql
```

### Redis Monitoring
```bash
docker exec redis_gateway redis-cli INFO
```

---

## 📄 License

MIT License - Free to use and modify

---

## 🙏 Acknowledgments

Built with:
- Node.js
- Express.js
- React
- PostgreSQL
- Redis
- Docker

---

**Project Status**: ✅ Production Ready  
**Last Updated**: January 17, 2026  
**Version**: 1.0.0
