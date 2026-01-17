import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_KEY = 'key_test_abc123';
const API_SECRET = 'secret_test_xyz789';

function Webhooks() {
  const [webhookUrl, setWebhookUrl] = useState('https://api.example.com/payments/webhook');
  const [webhookSecret, setWebhookSecret] = useState('whsec_test_abc123');
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/webhooks`, {
        headers: {
          'X-Api-Key': API_KEY,
          'X-Api-Secret': API_SECRET
        }
      });
      setWebhooks(response.data.data);
    } catch (error) {
      console.error('Error fetching webhooks:', error);
    }
  };

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    if (!webhookUrl) {
      alert('Please enter a webhook URL');
      return;
    }
    try {
      setLoading(true);
      // Store webhook configuration locally
      localStorage.setItem('webhookUrl', webhookUrl);
      localStorage.setItem('webhookSecret', webhookSecret);
      alert('✓ Webhook URL saved: ' + webhookUrl);
    } catch (error) {
      console.error('Error saving webhook:', error);
      alert('Error saving webhook configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSecret = async () => {
    try {
      setLoading(true);
      // Generate new secret
      const newSecret = 'whsec_' + Math.random().toString(36).substr(2, 9) + Math.random().toString(36).substr(2, 9);
      setWebhookSecret(newSecret);
      localStorage.setItem('webhookSecret', newSecret);
      alert('✓ Webhook secret regenerated: ' + newSecret);
    } catch (error) {
      console.error('Error regenerating secret:', error);
      alert('Error regenerating secret');
    } finally {
      setLoading(false);
    }
  };

  const handleTestWebhook = async () => {
    try {
      setLoading(true);
      if (!webhookUrl) {
        alert('Please enter a webhook URL first');
        return;
      }
      
      // Send test webhook
      const testPayload = {
        event: 'payment.completed',
        timestamp: new Date().toISOString(),
        data: {
          paymentId: 'pay_test_123',
          amount: 1000,
          currency: 'USD',
          status: 'completed',
          orderId: 'ord_test_456'
        }
      };

      const response = await axios.post(
        `${API_URL}/api/v1/webhooks/test`,
        { url: webhookUrl, payload: testPayload },
        {
          headers: {
            'X-Api-Key': API_KEY,
            'X-Api-Secret': API_SECRET
          }
        }
      );
      
      alert('✓ Test webhook sent! Check your webhook receiver for the event.');
      fetchWebhooks();
    } catch (error) {
      console.error('Error sending test webhook:', error);
      alert('Error sending test webhook: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async (webhookId) => {
    try {
      await axios.post(
        `${API_URL}/api/v1/webhooks/${webhookId}/retry`,
        {},
        {
          headers: {
            'X-Api-Key': API_KEY,
            'X-Api-Secret': API_SECRET
          }
        }
      );
      alert('Webhook retry scheduled');
      fetchWebhooks();
    } catch (error) {
      console.error('Error retrying webhook:', error);
    }
  };

  return (
    <div data-test-id="webhook-config">
      <h1>Webhook Configuration</h1>
      
      <div className="card">
        <h2>Configuration</h2>
        <form data-test-id="webhook-config-form" onSubmit={handleSaveWebhook}>
          <div className="form-group">
            <label>Webhook URL</label>
            <input
              data-test-id="webhook-url-input"
              type="url"
              placeholder="https://yoursite.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Webhook Secret</label>
            <span data-test-id="webhook-secret">{webhookSecret}</span>
            <button
              data-test-id="regenerate-secret-button"
              type="button"
              className="secondary"
              style={{ marginLeft: '10px' }}
              onClick={handleRegenerateSecret}
              disabled={loading}
            >
              {loading ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
          
          <button 
            data-test-id="save-webhook-button" 
            type="submit"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
          
          <button
            data-test-id="test-webhook-button"
            type="button"
            className="secondary"
            onClick={handleTestWebhook}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Test Webhook'}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Webhook Logs</h3>
        <table data-test-id="webhook-logs-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Last Attempt</th>
              <th>Response Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {webhooks.map(webhook => (
              <tr
                key={webhook.id}
                data-test-id="webhook-log-item"
                data-webhook-id={webhook.id}
              >
                <td data-test-id="webhook-event">{webhook.event}</td>
                <td data-test-id="webhook-status">
                  <span className={`badge ${webhook.status}`}>
                    {webhook.status}
                  </span>
                </td>
                <td data-test-id="webhook-attempts">{webhook.attempts}</td>
                <td data-test-id="webhook-last-attempt">
                  {webhook.last_attempt_at
                    ? new Date(webhook.last_attempt_at).toLocaleString()
                    : '-'}
                </td>
                <td data-test-id="webhook-response-code">
                  {webhook.response_code || '-'}
                </td>
                <td>
                  <button
                    data-test-id="retry-webhook-button"
                    data-webhook-id={webhook.id}
                    onClick={() => handleRetry(webhook.id)}
                  >
                    Retry
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Webhooks;
