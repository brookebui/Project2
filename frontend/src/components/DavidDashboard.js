import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DavidDashboard.css';

function DavidDashboard() {
  const [activeTab, setActiveTab] = useState('quotes');
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
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestResponse, setRequestResponse] = useState({
    status: '',
    note: '',
    counter_price: '',
    work_start: '',
    work_end: ''
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
        console.log('Raw quotes response:', quotesRes);
        console.log('Quotes response:', quotesRes.data);
        if (quotesRes.data && quotesRes.data.length > 0) {
          console.log('First quote:', quotesRes.data[0]);
        }
        setQuotes(quotesRes.data || []);
      } catch (error) {
        console.error('Error fetching quotes:', error.response?.data || error.message);
        console.error('Full error object:', error);
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

  const handleRequestReject = (request) => {
    setSelectedRequest(request);
    setRequestResponse({
      status: 'rejected',
      note: '',
      counter_price: '',
      work_start: '',
      work_end: ''
    });
  };

  const handleRequestAccept = (request) => {
    setSelectedRequest(request);
    setRequestResponse({
      status: 'accepted',
      note: '',
      counter_price: '',
      work_start: '',
      work_end: ''
    });
  };

  const handleRequestResponse = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    
    try {
      await axios.post(
        `http://localhost:5050/api/requests/${selectedRequest.request_id}/respond`,
        requestResponse
      );
      setSelectedRequest(null);
      setRequestResponse({
        status: '',
        note: '',
        counter_price: '',
        work_start: '',
        work_end: ''
      });
      await Promise.all([
        fetchData(),
        fetchQuotes()
      ]);
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('Error responding to request');
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
            className={`nav-link ${activeTab === 'requestsTable' ? 'active' : ''}`}
            onClick={() => setActiveTab('requestsTable')}
          >
            Requests
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
          {console.log('Current quotes:', quotes)}
          {quotes.length === 0 ? (
            <div className="alert alert-info">No quotes found</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Quote ID</th>
                  <th>Request ID</th>
                  <th>Client</th>
                  <th>Counter Price</th>
                  <th>Work Start</th>
                  <th>Work End</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((quote) => (
                  <tr key={`quote-${quote.quote_id}-${quote.created_at}`}>
                    <td>{quote.quote_id}</td>
                    <td>{quote.request_id}</td>
                    <td>Client {quote.request_id}</td>
                    <td>${quote.counter_price || 0}</td>
                    <td>{quote.work_start ? new Date(quote.work_start).toLocaleString() : 'Not set'}</td>
                    <td>{quote.work_end ? new Date(quote.work_end).toLocaleString() : 'Not set'}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeColor(quote.status || 'pending')}`}>
                        {quote.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      {quote.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-danger btn-sm me-2"
                            onClick={() => handleReject(quote)}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleCounter(quote)}
                          >
                            Counter
                          </button>
                        </>
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
                  <th>Actions</th>
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
                    <td className="text-nowrap">
                      {console.log('Request status:', request.status)}
                      {request.status === 'pending' && (
                        <div className="btn-group">
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRequestReject(request)}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-primary btn-sm ms-1"
                            onClick={() => handleRequestAccept(request)}
                          >
                            Create Quote
                          </button>
                        </div>
                      )}
                      {request.status !== 'pending' && (
                        <span className="text-muted">No actions available</span>
                      )}
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
        <div className="modal-overlay">
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
        </div>
      )}

      {selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {requestResponse.status === 'rejected' ? 'Reject Request' : 'Create Quote'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedRequest(null)}
                />
              </div>
              <div className="modal-body">
                <form onSubmit={handleRequestResponse}>
                  <div className="mb-3">
                    <label className="form-label">Note</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={requestResponse.note}
                      onChange={(e) => setRequestResponse(prev => ({
                        ...prev,
                        note: e.target.value
                      }))}
                      required
                    />
                  </div>
                  
                  {requestResponse.status === 'accepted' && (
                    <>
                      <div className="mb-3">
                        <label className="form-label">Counter Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          className="form-control"
                          value={requestResponse.counter_price}
                          onChange={(e) => setRequestResponse(prev => ({
                            ...prev,
                            counter_price: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Work Start</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={requestResponse.work_start}
                          onChange={(e) => setRequestResponse(prev => ({
                            ...prev,
                            work_start: e.target.value
                          }))}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Work End</label>
                        <input
                          type="datetime-local"
                          className="form-control"
                          value={requestResponse.work_end}
                          onChange={(e) => setRequestResponse(prev => ({
                            ...prev,
                            work_end: e.target.value
                          }))}
                          required
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedRequest(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {requestResponse.status === 'rejected' ? 'Reject' : 'Create Quote'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DavidDashboard;