# Local Development Setup (Without Docker)

If you encounter Docker registry issues, you can run the services locally for development and testing.

## Prerequisites

```powershell
# Install Node.js 18+ (if not already installed)
node --version  # Should be v18 or higher

# Install PostgreSQL 15
# Download from: https://www.postgresql.org/download/windows/

# Install Redis
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use WSL with Redis
```

## Setup Steps

### 1. Setup Database

```powershell
# Start PostgreSQL service
# Create database
psql -U postgres
CREATE DATABASE payment_gateway;
CREATE USER gateway_user WITH PASSWORD 'gateway_pass';
GRANT ALL PRIVILEGES ON DATABASE payment_gateway TO gateway_user;
\q
```

### 2. Setup Redis

```powershell
# Start Redis
redis-server

# Or in WSL
wsl redis-server
```

### 3. Setup Backend API

```powershell
# Navigate to backend
cd backend

# Install dependencies
npm install

# Set environment variables
$env:NODE_ENV="development"
$env:PORT="8000"
$env:DATABASE_URL="postgresql://gateway_user:gateway_pass@localhost:5432/payment_gateway"
$env:REDIS_URL="redis://localhost:6379"
$env:TEST_MODE="true"
$env:TEST_PROCESSING_DELAY="5000"
$env:TEST_PAYMENT_SUCCESS="true"
$env:WEBHOOK_RETRY_INTERVALS_TEST="true"

# Start API server
npm start
# Or with nodemon for auto-reload
npx nodemon src/server.js
```

### 4. Setup Worker (New Terminal)

```powershell
cd backend

# Set same environment variables as above
$env:NODE_ENV="development"
$env:DATABASE_URL="postgresql://gateway_user:gateway_pass@localhost:5432/payment_gateway"
$env:REDIS_URL="redis://localhost:6379"
$env:TEST_MODE="true"
$env:TEST_PROCESSING_DELAY="5000"
$env:TEST_PAYMENT_SUCCESS="true"

# Start worker
node src/worker.js
```

### 5. Setup Dashboard (New Terminal)

```powershell
cd dashboard

# Install dependencies
npm install

# Set environment variable
$env:REACT_APP_API_URL="http://localhost:8000"

# Start dashboard
npm start
# Opens at http://localhost:3000
```

### 6. Setup Checkout Widget (New Terminal)

```powershell
cd checkout-widget

# Install dependencies
npm install

# Set environment variable
$env:REACT_APP_API_URL="http://localhost:8000"

# Start checkout (on port 3001)
$env:PORT="3001"
npm start
# Opens at http://localhost:3001
```

## Quick Test

```powershell
# Test API health
curl http://localhost:8000/health

# Test job status
curl http://localhost:8000/api/v1/test/jobs/status

# Create order
curl -X POST http://localhost:8000/api/v1/orders `
  -H "X-Api-Key: key_test_abc123" `
  -H "X-Api-Secret: secret_test_xyz789" `
  -H "Content-Type: application/json" `
  -d '{"amount": 50000, "currency": "INR"}'
```

## Troubleshooting

### Port Already in Use
```powershell
# Find process on port 8000
netstat -ano | findstr :8000

# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Database Connection Error
```powershell
# Check PostgreSQL is running
Get-Service -Name postgresql*

# Test connection
psql -U gateway_user -d payment_gateway
```

### Redis Connection Error
```powershell
# Test Redis
redis-cli ping
# Should return: PONG
```

## Environment Variables Script

Create `backend\start-api.ps1`:

```powershell
$env:NODE_ENV="development"
$env:PORT="8000"
$env:DATABASE_URL="postgresql://gateway_user:gateway_pass@localhost:5432/payment_gateway"
$env:REDIS_URL="redis://localhost:6379"
$env:TEST_MODE="true"
$env:TEST_PROCESSING_DELAY="5000"
$env:TEST_PAYMENT_SUCCESS="true"
$env:WEBHOOK_RETRY_INTERVALS_TEST="true"

node src/server.js
```

Create `backend\start-worker.ps1`:

```powershell
$env:NODE_ENV="development"
$env:DATABASE_URL="postgresql://gateway_user:gateway_pass@localhost:5432/payment_gateway"
$env:REDIS_URL="redis://localhost:6379"
$env:TEST_MODE="true"
$env:TEST_PROCESSING_DELAY="5000"
$env:TEST_PAYMENT_SUCCESS="true"

node src/worker.js
```

## Running All Services

```powershell
# Terminal 1: API
cd backend
.\start-api.ps1

# Terminal 2: Worker
cd backend
.\start-worker.ps1

# Terminal 3: Dashboard
cd dashboard
$env:REACT_APP_API_URL="http://localhost:8000"
npm start

# Terminal 4: Checkout
cd checkout-widget
$env:REACT_APP_API_URL="http://localhost:8000"
$env:PORT="3001"
npm start
```

## Testing Webhooks Locally

```powershell
# Terminal 5: Webhook Receiver
cd test-merchant
npm install
node webhook-receiver.js
# Runs on http://localhost:4000

# Configure webhook URL in Dashboard to:
# http://localhost:4000/webhook
```

## Access Points

- API: http://localhost:8000
- Dashboard: http://localhost:3000
- Checkout: http://localhost:3001
- Webhook Receiver: http://localhost:4000
- Demo: Open demo.html in browser

## Notes

- All services must be running simultaneously
- PostgreSQL and Redis must be running first
- Worker must connect to same database as API
- Dashboard and Checkout connect to API on port 8000
