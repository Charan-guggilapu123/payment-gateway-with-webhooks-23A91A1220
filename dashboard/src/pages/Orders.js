import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const API_KEY = 'key_test_abc123';
const API_SECRET = 'secret_test_xyz789';

function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/v1/orders`, {
        headers: {
          'X-Api-Key': API_KEY,
          'X-Api-Secret': API_SECRET
        }
      });
      setOrders(response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  return (
    <div>
      <h1>Orders</h1>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Amount</th>
              <th>Currency</th>
              <th>Receipt</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td>{order.id}</td>
                <td>₹{(order.amount / 100).toFixed(2)}</td>
                <td>{order.currency}</td>
                <td>{order.receipt || '-'}</td>
                <td>
                  <span className={`badge ${order.status}`}>
                    {order.status}
                  </span>
                </td>
                <td>{new Date(order.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Orders;
