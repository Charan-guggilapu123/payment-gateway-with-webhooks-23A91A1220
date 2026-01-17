# 🚀 Getting Started - Payment Gateway

Choose your preferred setup method:

## Option 1: Docker (Recommended)

**Prerequisites**: Docker Desktop installed and running

```powershell
# Start all services
docker-compose up -d

# Wait 30 seconds for initialization
Start-Sleep -Seconds 30

# Verify services
curl http://localhost:8000/health
curl http://localhost:8000/api/v1/test/jobs/status

# Access
# - Dashboard: http://localhost:3000
# - Checkout: http://localhost:3001
# - Demo: Open demo.html in browser
```

**Troubleshooting Docker**:
- If you get registry errors, wait a few minutes and try again
- Check Docker Desktop is running: `docker ps`
- View logs: `docker-compose logs -f`

---

## Option 2: Local Development

**Prerequisites**: Node.js 18+, PostgreSQL 15, Redis

### Quick Start (5 Steps)

**Step 1**: Install dependencies in all directories
```powershell
cd backend && npm install
cd ../dashboard && npm install
cd ../checkout-widget && npm install
cd ../test-merchant && npm install
cd ..
```

**Step 2**: Setup PostgreSQL database
```powershell
# Create database (run in psql)
CREATE DATABASE payment_gateway;
CREATE USER gateway_user WITH PASSWORD 'gateway_pass';
GRANT ALL PRIVILEGES ON DATABASE payment_gateway TO gateway_user;
```

**Step 3**: Start Redis
```powershell
redis-server
# Or if using WSL: wsl redis-server
```

**Step 4**: Start services (4 terminals)

**Terminal 1 - API**:
```powershell
cd backend
.\start-api.ps1
```

**Terminal 2 - Worker**:
```powershell
cd backend
.\start-worker.ps1
```

**Terminal 3 - Dashboard**:
```powershell
cd dashboard
.\start-dashboard.ps1
```

**Terminal 4 - Checkout**:
```powershell
cd checkout-widget
.\start-checkout.ps1
```

**Step 5**: Test
```powershell
curl http://localhost:8000/health
# Open http://localhost:3000 in browser
# Open demo.html in browser
```

---

## 🧪 Quick Test

Once running (Docker or Local):

```powershell
# Create order
$order = (curl -X POST http://localhost:8000/api/v1/orders `
  -H "X-Api-Key: key_test_abc123" `
  -H "X-Api-Secret: secret_test_xyz789" `
  -H "Content-Type: application/json" `
  -d '{"amount": 50000, "currency": "INR"}' | ConvertFrom-Json).data.id

# Create payment
curl -X POST http://localhost:8000/api/v1/payments `
  -H "X-Api-Key: key_test_abc123" `
  -H "X-Api-Secret: secret_test_xyz789" `
  -H "Content-Type: application/json" `
  -d "{`"order_id`": `"$order`", `"method`": `"upi`", `"captured`": true, `"upi_id`": `"test@upi`"}"

# Check status after 10 seconds
Start-Sleep -Seconds 10
curl http://localhost:8000/api/v1/test/jobs/status
```

---

## 📚 Documentation

- **README.md** - Complete API documentation
- **QUICKSTART.md** - Step-by-step setup guide
- **LOCAL_SETUP.md** - Detailed local development guide
- **DEPLOYMENT.md** - Testing and troubleshooting
- **PROJECT_SUMMARY.md** - Architecture overview

---

## 🔑 Test Credentials

```
API Key: key_test_abc123
API Secret: secret_test_xyz789
Webhook Secret: whsec_test_abc123
```

---

## 🎯 Next Steps

1. **Start the services** (Docker or Local)
2. **Open Dashboard**: http://localhost:3000
3. **Try SDK Demo**: Open `demo.html` in browser
4. **Read API Docs**: See README.md
5. **Test webhooks**: Run `test-merchant/webhook-receiver.js`

---

## ⚡ Quick Commands

```powershell
# Docker
docker-compose up -d              # Start all services
docker-compose logs -f            # View logs
docker-compose down               # Stop services
docker-compose down -v            # Stop and remove data

# Testing
.\test-suite.bat                  # Run automated tests
node test-merchant\webhook-receiver.js  # Start webhook receiver

# Verification
curl http://localhost:8000/health
curl http://localhost:3000
curl http://localhost:3001
```

---

## 🌐 Service Ports

| Service | Port | URL |
|---------|------|-----|
| API | 8000 | http://localhost:8000 |
| Dashboard | 3000 | http://localhost:3000 |
| Checkout | 3001 | http://localhost:3001 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |
| Webhook Test | 4000 | http://localhost:4000 |

---

## ✅ Project Complete!

All features implemented:
- ✅ Async job processing with Bull + Redis
- ✅ Webhook delivery with HMAC & retry logic
- ✅ Embeddable JavaScript SDK
- ✅ Full refund support
- ✅ Idempotency keys
- ✅ React Dashboard with all data-test-id attributes
- ✅ Payment widget with multiple methods
- ✅ Complete API (9 endpoints)
- ✅ Docker Compose setup
- ✅ Comprehensive documentation

**Ready for deployment!** 🎉
