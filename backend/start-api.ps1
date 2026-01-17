$env:NODE_ENV="development"
$env:PORT="8000"
$env:DATABASE_URL="postgresql://gateway_user:gateway_pass@localhost:5432/payment_gateway"
$env:REDIS_URL="redis://localhost:6379"
$env:TEST_MODE="true"
$env:TEST_PROCESSING_DELAY="5000"
$env:TEST_PAYMENT_SUCCESS="true"
$env:WEBHOOK_RETRY_INTERVALS_TEST="true"

Write-Host "Starting Payment Gateway API on port 8000..." -ForegroundColor Green
node src/server.js
