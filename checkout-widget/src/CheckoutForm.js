import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CheckoutForm() {
  const [orderId, setOrderId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [amount, setAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get('orderId') || '');
    setApiKey(params.get('key') || '');
    setAmount(parseInt(params.get('amount') || '0'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await axios.post(
        `${API_URL}/api/v1/payments`,
        {
          order_id: orderId,
          method: paymentMethod,
          captured: true,
          upi_id: paymentMethod === 'upi' ? upiId : undefined,
          card_number: paymentMethod === 'card' ? cardNumber : undefined
        },
        {
          headers: {
            'X-Api-Key': apiKey,
            'X-Api-Secret': 'secret_test_xyz789'
          }
        }
      );

      // Notify parent window
      if (window.opener || window.parent !== window) {
        const target = window.opener || window.parent;
        target.postMessage(
          {
            type: 'payment_success',
            paymentId: response.data.data.id,
            orderId: orderId,
            status: response.data.data.status
          },
          '*'
        );
      }

      alert('Payment initiated successfully! ID: ' + response.data.data.id);
    } catch (error) {
      console.error('Payment failed:', error);
      
      // Notify parent window
      if (window.opener || window.parent !== window) {
        const target = window.opener || window.parent;
        target.postMessage(
          {
            type: 'payment_failed',
            error: error.response?.data?.message || 'Payment failed'
          },
          '*'
        );
      }

      alert('Payment failed: ' + (error.response?.data?.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-container">
      <div className="checkout-form">
        <h2>Complete Payment</h2>
        <p className="amount">₹{(amount / 100).toFixed(2)}</p>

        <form onSubmit={handleSubmit}>
          <div className="payment-methods">
            <button
              type="button"
              className={paymentMethod === 'card' ? 'active' : ''}
              onClick={() => setPaymentMethod('card')}
            >
              Card
            </button>
            <button
              type="button"
              className={paymentMethod === 'upi' ? 'active' : ''}
              onClick={() => setPaymentMethod('upi')}
            >
              UPI
            </button>
            <button
              type="button"
              className={paymentMethod === 'netbanking' ? 'active' : ''}
              onClick={() => setPaymentMethod('netbanking')}
            >
              Net Banking
            </button>
          </div>

          {paymentMethod === 'card' && (
            <div className="card-details">
              <input
                type="text"
                placeholder="Card Number"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                maxLength="16"
                required
              />
              <div className="card-row">
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={(e) => setCardExpiry(e.target.value)}
                  maxLength="5"
                  required
                />
                <input
                  type="text"
                  placeholder="CVV"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value)}
                  maxLength="3"
                  required
                />
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="upi-details">
              <input
                type="text"
                placeholder="UPI ID (e.g., user@upi)"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="pay-button" disabled={loading}>
            {loading ? 'Processing...' : `Pay ₹${(amount / 100).toFixed(2)}`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CheckoutForm;
