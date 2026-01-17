import React from 'react';
import ReactDOM from 'react-dom/client';
import CheckoutForm from './CheckoutForm';
import './sdk/checkout.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CheckoutForm />
  </React.StrictMode>
);
