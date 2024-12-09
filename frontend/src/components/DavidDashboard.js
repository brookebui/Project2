import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DavidDashboard() {
  const [activeTab, setActiveTab] = useState('quotes');
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [response, setResponse] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueData, setRevenueData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotesRes, ordersRes, billsRes] = await Promise.all([
        axios.get('/api/quotes'),
        axios.get('/api/orders'),
        axios.get('/api/bills')
      ]);

      setQuotes(quotesRes.data);
      setOrders(ordersRes.data);
      setBills(billsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!selectedItem || !response) return;

    try {
      const endpoint = selectedItem.type === 'quote' 
        ? `/api/quotes/${selectedItem.id}/respond`
        : `/api/bills/${selectedItem.id}/respond`;

      await axios.post(endpoint, { response });
      setResponse('');
      setSelectedItem(null);
      fetchData();
    } catch (error) {
      console.error('Error submitting response:', error);
    }
  };

  const generateReport = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/revenue-report', { startDate, endDate });
      setRevenueData(res.data);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  return (
    <div className="container mt-4">
      <h2>Dashboard</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'quotes' ? 'active' : ''}`}
            onClick={() => setActiveTab('quotes')}
          >
            Quotes
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Orders
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'bills' ? 'active' : ''}`}
            onClick={() => setActiveTab('bills')}
          >
            Bills
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            Revenue Report
          </button>
        </li>
      </ul>

      {activeTab === 'quotes' && (
        <div>
          <h3>Quotes</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Content</th>
                <th>Status</th>
                <th>Response</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <tr key={quote.id}>
                  <td>{new Date(quote.date).toLocaleDateString()}</td>
                  <td>{quote.client}</td>
                  <td>{quote.content}</td>
                  <td>{quote.status}</td>
                  <td>{quote.response || 'No response yet'}</td>
                  <td>
                    {quote.status === 'pending' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedItem({ ...quote, type: 'quote' })}
                      >
                        Respond
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h3>Orders</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Description</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{new Date(order.date).toLocaleDateString()}</td>
                  <td>{order.client}</td>
                  <td>{order.description}</td>
                  <td>{order.status}</td>
                  <td>${order.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bills' && (
        <div>
          <h3>Bills</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Client</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td>{new Date(bill.date).toLocaleDateString()}</td>
                  <td>{bill.client}</td>
                  <td>${bill.amount}</td>
                  <td>{bill.status}</td>
                  <td>
                    {bill.status === 'pending' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedItem({ ...bill, type: 'bill' })}
                      >
                        Respond
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div>
          <h3>Revenue Report</h3>
          <form onSubmit={generateReport} className="mb-4">
            <div className="row">
              <div className="col-md-4">
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="col-md-4">
                <button type="submit" className="btn btn-primary mt-4">
                  Generate Report
                </button>
              </div>
            </div>
          </form>

          {revenueData && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Summary</h5>
                <p>Total Revenue: ${revenueData.totalRevenue}</p>
                <p>Number of Orders: {revenueData.totalOrders}</p>
                <p>Average Order Value: ${revenueData.averageOrderValue}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedItem && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Respond to {selectedItem.type === 'quote' ? 'Quote' : 'Bill'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedItem(null)}
                />
              </div>
              <div className="modal-body">
                <form onSubmit={handleRespond}>
                  <div className="form-group">
                    <label>Your Response</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      required
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedItem(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Submit Response
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </div>
      )}
    </div>
  );
}

export default DavidDashboard;