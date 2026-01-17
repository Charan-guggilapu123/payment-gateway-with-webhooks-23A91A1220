import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_KEY = 'key_test_abc123';
const API_SECRET = 'secret_test_xyz789';

function Payments() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/payments`, {
        headers: {
          'X-Api-Key': API_KEY,
          'X-Api-Secret': API_SECRET
        }
      });
      setPayments(response.data.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  return (
    <div>
      <h1>Payments</h1>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Order ID</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{payment.id}</td>
                <td>{payment.order_id}</td>
                <td>₹{(payment.amount / 100).toFixed(2)}</td>
                <td>{payment.method.toUpperCase()}</td>
                <td>
                  <span className={`badge ${payment.status}`}>
                    {payment.status}
                  </span>
                </td>
                <td>{new Date(payment.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Payments;
