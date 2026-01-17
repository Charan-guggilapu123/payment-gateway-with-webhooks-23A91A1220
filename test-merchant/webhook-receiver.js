const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

const WEBHOOK_SECRET = 'whsec_test_abc123';

app.post('/webhook', (req, res) => {
  const signature = req.headers['x-webhook-signature'];
  const payload = req.body;

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');

  if (signature !== expectedSignature) {
    console.error('❌ Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  console.log('\n✅ Webhook received and verified');
  console.log('Event:', payload.event);
  console.log('Data:', JSON.stringify(payload.data, null, 2));
  console.log('Created:', payload.created_at);
  console.log('---');

  res.status(200).json({ success: true });
});

app.listen(4000, () => {
  console.log('🎯 Test webhook receiver running on http://localhost:4000');
  console.log('Configure your merchant webhook URL to: http://host.docker.internal:4000/webhook');
});
