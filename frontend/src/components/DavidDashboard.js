import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DavidDashboard() {
  const [activeTab, setActiveTab] = useState('requests');
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  const [requests, setRequests] = useState([]);
  const [response, setResponse] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [revenueData, setRevenueData] = useState(null);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quoteResponse, setQuoteResponse] = useState({
    status: '',
    note: '',
    counter_price: '',
    work_start: '',
    work_end: 0
  });

  const handleBillAction = (bill) => {
    alert(`Processing bill ${bill.bill_id} for $${bill.amount_due}`);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Starting to fetch data...');
      
      try {
        const billsRes = await axios.get('http://localhost:5050/api/bills');
        console.log('Bills response:', billsRes.data);
        setBills(billsRes.data || []);
      } catch (error) {
        console.error('Error fetching bills:', error.response?.data || error.message);
        setBills([]);
      }

      try {
        const quotesRes = await axios.get('http://localhost:5050/api/quotes');
        console.log('Quotes response:', quotesRes.data);
        setQuotes(quotesRes.data || []);
      } catch (error) {
        console.error('Error fetching quotes:', error.response?.data || error.message);
        setQuotes([]);
      }

      try {
        const ordersRes = await axios.get('http://localhost:5050/api/orders');
        console.log('Orders response:', ordersRes.data);
        setOrders(ordersRes.data || []);
      } catch (error) {
        console.error('Error fetching orders:', error.response?.data || error.message);
        setOrders([]);
      }

      try {
        const requestsRes = await axios.get('http://localhost:5050/api/requests');
        console.log('Requests response:', requestsRes.data);
        setRequests(requestsRes.data || []);
      } catch (error) {
        console.error('Error fetching requests:', error.response?.data || error.message);
        setRequests([]);
      }

    } catch (error) {
      console.error('General error:', error);
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

  const fetchQuotes = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/quotes');
      setQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const handleQuoteResponse = async (e) => {
    e.preventDefault();
    if (!selectedQuote) return;

    try {
      await axios.post(`http://localhost:5050/api/quotes/${selectedQuote.quote_id}/respond`, quoteResponse);
      setSelectedQuote(null);
      setQuoteResponse({
        status: '',
        note: '',
        counter_price: '',
        work_start: '',
        work_end: 0
      });
      fetchQuotes();
    } catch (error) {
      console.error('Error responding to quote:', error);
    }
  };

  const handleReject = (quote) => {
    setSelectedQuote(quote);
    setQuoteResponse({
      status: 'rejected',
      note: '',
      counter_price: '',
      work_start: '',
      work_end: 0
    });
  };

  const handleCounter = (quote) => {
    setSelectedQuote(quote);
    setQuoteResponse({
      status: 'countered',
      note: '',
      counter_price: '',
      work_start: '',
      work_end: 0
    });
  };

  const handleCreateQuote = async (request) => {
    try {
      await axios.post(`http://localhost:5050/api/requests/${request.request_id}/quote`);
      fetchData(); // Refresh all data
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error creating quote');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'closed':
        return 'secondary';
      default:
        return 'primary';
    }
  };

  return (
    <div className="container mt-4">
      <h2>Dashboard</h2>

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
          >
            Quote Requests
          </button>
        </li>
        <li className="nav-item">
          <button 
            className={`nav-link ${activeTab === 'requestsTable' ? 'active' : ''}`}
            onClick={() => setActiveTab('requestsTable')}
          >
            Requests Table
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

      {activeTab === 'requests' && (
        <div>
          <h3>Quote Requests</h3>
          {requests.length === 0 ? (
            <div className="alert alert-info">No requests found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Property Address</th>
                  <th>Square Feet</th>
                  <th>Proposed Price</th>
                  <th>Status</th>
                  <th>Photos</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.request_id}>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td>{`${request.first_name} ${request.last_name}`}</td>
                    <td>{request.property_address}</td>
                    <td>{request.square_feet}</td>
                    <td>${request.proposed_price}</td>
                    <td>{request.status}</td>
                    <td>
                      {request.photos && request.photos.split(',').map((photo, index) => (
                        <a 
                          key={index} 
                          href={photo} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="me-2"
                        >
                          Photo {index + 1}
                        </a>
                      ))}
                    </td>
                    <td>
                      {request.status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCreateQuote(request)}
                        >
                          Create Quote
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'requestsTable' && (
        <div>
          <h3>All Requests</h3>
          {requests.length === 0 ? (
            <div className="alert alert-info">No requests found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Client ID</th>
                  <th>Date</th>
                  <th>Property Address</th>
                  <th>Square Feet</th>
                  <th>Proposed Price</th>
                  <th>Note</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.request_id}>
                    <td>{request.request_id}</td>
                    <td>{request.client_id}</td>
                    <td>{new Date(request.created_at).toLocaleDateString()}</td>
                    <td>{request.property_address}</td>
                    <td>{request.square_feet}</td>
                    <td>${request.proposed_price}</td>
                    <td>{request.note}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeColor(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h3>Orders</h3>
          {orders.length === 0 ? (
            <div className="alert alert-info">No orders found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Quote ID</th>
                  <th>Work Start</th>
                  <th>Work End</th>
                  <th>Final Price</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.order_id}>
                    <td>{order.order_id}</td>
                    <td>{order.quote_id}</td>
                    <td>{new Date(order.work_start).toLocaleDateString()}</td>
                    <td>{new Date(order.work_end).toLocaleDateString()}</td>
                    <td>${order.final_price}</td>
                    <td>{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'bills' && (
        <div>
          <h3>Bills</h3>
          {bills.length === 0 ? (
            <div className="alert alert-info">No bills found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Bill ID</th>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Amount Due</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.bill_id}>
                    <td>{bill.bill_id}</td>
                    <td>{bill.order_id}</td>
                    <td>{new Date(bill.created_at).toLocaleDateString()}</td>
                    <td>${bill.amount_due}</td>
                    <td>{bill.status}</td>
                    <td>
                      {bill.status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleBillAction(bill)}
                        >
                          Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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