import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Payments from './pages/Payments';
import Orders from './pages/Orders';
import Webhooks from './pages/Webhooks';
import ApiDocs from './pages/ApiDocs';

function App() {
  return (
    <BrowserRouter>
      <div className="nav">
        <ul>
          <li><Link to="/">Payments</Link></li>
          <li><Link to="/orders">Orders</Link></li>
          <li><Link to="/webhooks">Webhooks</Link></li>
          <li><Link to="/docs">API Docs</Link></li>
        </ul>
      </div>
      <div className="container">
        <Routes>
          <Route path="/" element={<Payments />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/webhooks" element={<Webhooks />} />
          <Route path="/docs" element={<ApiDocs />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
