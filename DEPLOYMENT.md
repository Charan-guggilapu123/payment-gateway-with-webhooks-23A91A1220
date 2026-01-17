# Deployment & Testing Guide

## 🚀 Deployment Steps

### Prerequisites
- Docker Desktop installed and running
- Ports 8000, 3000, 3001, 5432, 6379 available
- Internet connection (for pulling Docker images)

### Step 1: Start Services

```powershell
# Navigate to project directory
cd C:\Users\guggi\OneDrive\Desktop\Gpp\week-8\week8-mandatory\payment-gateway-with-webhooks-23A91A1220

# Start all services in detached mode
docker-compose up -d

# Expected output:
# Creating network "payment-gateway-with-webhooks_default" ...
# Creating postgres_gateway ...
# Creating redis_gateway ...
# Creating gateway_api ...
# Creating gateway_worker ...
# Creating gateway_dashboard ...
# Creating gateway_checkout ...
```

### Step 2: Wait for Services to Initialize (~30-60 seconds)

```powershell
# Check service status
docker-compose ps

# Expected output: All services should show "healthy" or "Up"
```

### Step 3: Verify Health

```powershell
# Check API health
curl http://localhost:8000/health

# Expected: {"status":"healthy"}

# Check job queue
curl http://localhost:8000/api/v1/test/jobs/status

# Expected: {"success":true,"data":{...}}
```

### Step 4: Access Applications

Open in browser:
- **Dashboard**: http://localhost:3000
- **Checkout**: http://localhost:3001
- **Demo**: Open `demo.html` in browser

## 🧪 Testing Guide

### Test 1: Complete Payment Flow

1. Open `demo.html` in browser
2. Click "Create Order" button
3. Wait for order creation confirmation
4. Click "Pay ₹500.00" button
5. Select payment method (Card/UPI/NetBanking)
6. Fill in details:
   - **Card**: 4111111111111111, 12/25, 123
   - **UPI**: test@upi
7. Click "Pay" button
8. Wait for payment processing (~5 seconds in test mode)
9. Verify success message with payment ID

### Test 2: Dashboard Features

1. Go to http://localhost:3000
2. **Payments Page**: View list of payments
3. **Orders Page**: View list of orders
4. **Webhooks Page**:
   - Configure webhook URL
   - View webhook delivery logs
   - Test manual retry
5. **API Docs Page**: View integration examples

### Test 3: API Testing with curl

```powershell
# Create Order
$order = curl -X POST http://localhost:8000/api/v1/orders `
  -H "X-Api-Key: key_test_abc123" `
  -H "X-Api-Secret: secret_test_xyz789" `
  -H "Content-Type: application/json" `
  -d '{"amount": 50000, "currency": "INR"}' | ConvertFrom-Json

$orderId = $order.data.id
Write-Host "Order ID: $orderId"

# Create Payment
$payment = curl -X POST http://localhost:8000/api/v1/payments `
  -H "X-Api-Key: key_test_abc123" `
  -H "X-Api-Secret: secret_test_xyz789" `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: test_key_001" `
  -d "{`"order_id`": `"$orderId`", `"method`": `"upi`", `"captured`": true, `"upi_id`": `"test@upi`"}" | ConvertFrom-Json

$paymentId = $payment.data.id
Write-Host "Payment ID: $paymentId"

# Wait 10 seconds for processing
Start-Sleep -Seconds 10

# Check Payment Status
curl http://localhost:8000/api/v1/payments/$paymentId `
  -H "X-Api-Key: key_test_abc123" `
  -H "X-Api-Secret: secret_test_xyz789"
```

### Test 4: Webhook Testing

```powershell
# Terminal 1: Start webhook receiver
cd test-merchant
npm install
node webhook-receiver.js

# Terminal 2: Trigger payment (creates webhook)
# (Use demo.html or curl commands above)

# Watch webhook receiver terminal for incoming webhooks
```

### Test 5: Refund Testing

```powershell
# Create refund (use payment ID from previous test)
curl -X POST http://localhost:8000/api/v1/payments/$paymentId/refunds `
  -H "X-Api-Key: key_test_abc123" `
  -H "X-Api-Secret: secret_test_xyz789" `
  -H "Content-Type: application/json" `
  -d '{"amount": 10000, "reason": "Customer request"}'

# Wait 5 seconds for processing
Start-Sleep -Seconds 5

# Check refund status
curl http://localhost:8000/api/v1/payments/$paymentId `
  -H "X-Api-Key: key_test_abc123" `
  -H "X-Api-Secret: secret_test_xyz789"
```

### Test 6: Idempotency Testing

```powershell
# Create payment with idempotency key
$response1 = curl -X POST http://localhost:8000/api/v1/payments `
  -H "X-Api-Key: key_test_abc123" `
  -H "X-Api-Secret: secret_test_xyz789" `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: duplicate_test_123" `
  -d "{`"order_id`": `"$orderId`", `"method`": `"upi`", `"captured`": true, `"upi_id`": `"test@upi`"}" | ConvertFrom-Json

# Retry with same key (should return cached response)
$response2 = curl -X POST http://localhost:8000/api/v1/payments `
  -H "X-Api-Key: key_test_abc123" `
  -H "X-Api-Secret: secret_test_xyz789" `
  -H "Content-Type: application/json" `
  -H "Idempotency-Key: duplicate_test_123" `
  -d "{`"order_id`": `"$orderId`", `"method`": `"upi`", `"captured`": true, `"upi_id`": `"test@upi`"}" | ConvertFrom-Json

# Verify both have same payment ID
Write-Host "Payment 1: $($response1.data.id)"
Write-Host "Payment 2: $($response2.data.id)"
```

## 📊 Monitoring

### View Logs

```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f worker
docker-compose logs -f postgres

# Last 100 lines
docker-compose logs --tail=100 worker
```

### Check Job Queue Status

```powershell
# Real-time job stats
while ($true) {
  curl http://localhost:8000/api/v1/test/jobs/status
  Start-Sleep -Seconds 5
}
```

### Database Access

```powershell
# Connect to PostgreSQL
docker exec -it postgres_gateway psql -U gateway_user -d payment_gateway

# Useful queries:
SELECT * FROM merchants;
SELECT * FROM orders ORDER BY created_at DESC LIMIT 10;
SELECT * FROM payments ORDER BY created_at DESC LIMIT 10;
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;
SELECT * FROM idempotency_keys;
```

### Redis Access

```powershell
# Connect to Redis
docker exec -it redis_gateway redis-cli

# Useful commands:
KEYS *
GET bull:ProcessPaymentJob:*
```

## 🐛 Troubleshooting

### Service Won't Start

```powershell
# Check logs
docker-compose logs <service-name>

# Restart service
docker-compose restart <service-name>

# Rebuild and restart
docker-compose up -d --build <service-name>
```

### Port Already in Use

```powershell
# Find process using port
netstat -ano | findstr :8000
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process (replace <PID> with actual process ID)
taskkill /PID <PID> /F
```

### Database Connection Issues

```powershell
# Reset database
docker-compose down -v
docker-compose up -d

# Check postgres logs
docker-compose logs postgres
```

### Worker Not Processing Jobs

```powershell
# Check worker logs
docker-compose logs -f worker

# Restart worker
docker-compose restart worker

# Check Redis connection
docker-compose logs redis
```

### Clean Slate

```powershell
# Stop all services
docker-compose down

# Remove volumes (deletes all data)
docker-compose down -v

# Rebuild everything
docker-compose build --no-cache

# Start fresh
docker-compose up -d
```

## 📈 Load Testing

```powershell
# Install Apache Bench (if needed)
# Or use curl in a loop

# Create 100 orders
for ($i=1; $i -le 100; $i++) {
  curl -X POST http://localhost:8000/api/v1/orders `
    -H "X-Api-Key: key_test_abc123" `
    -H "X-Api-Secret: secret_test_xyz789" `
    -H "Content-Type: application/json" `
    -d "{`"amount`": 50000, `"currency`": `"INR`", `"receipt`": `"load_test_$i`"}"
}

# Monitor queue
curl http://localhost:8000/api/v1/test/jobs/status
```

## 🔒 Security Notes

### Production Checklist
- [ ] Change default API keys and secrets
- [ ] Use strong database passwords
- [ ] Enable HTTPS/TLS
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable authentication on Redis
- [ ] Use environment-specific secrets
- [ ] Set TEST_MODE=false
- [ ] Configure proper logging
- [ ] Set up monitoring and alerts

## 📝 Submission

```powershell
# Verify all services
docker-compose ps

# Run verification commands
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/test/jobs/status
curl http://localhost:3000
curl http://localhost:3001

# Stop services for submission
docker-compose down
```

## 🎯 Expected Results

After successful deployment:
- ✅ API responds on port 8000
- ✅ Dashboard loads on port 3000
- ✅ Checkout widget on port 3001
- ✅ PostgreSQL running on port 5432
- ✅ Redis running on port 6379
- ✅ Worker processing jobs
- ✅ Webhooks being delivered
- ✅ All health checks passing

## 📞 Support

If you encounter issues:
1. Check logs: `docker-compose logs <service>`
2. Verify Docker Desktop is running
3. Check port availability
4. Ensure internet connection for image pulling
5. Try clean restart: `docker-compose down -v && docker-compose up -d`
