import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('quotes');
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bills, setBills] = useState([]);
  
  // Quote Request State
  const [quoteRequest, setQuoteRequest] = useState({
    propertyAddress: '',
    squareFootage: '',
    proposedPrice: '',
    notes: '',
    photos: []
  });
  
  // Negotiation State
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [negotiationMessage, setNegotiationMessage] = useState('');
  
  // Bill Payment State
  const [selectedBill, setSelectedBill] = useState(null);
  const [disputeMessage, setDisputeMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quotesRes, ordersRes, billsRes] = await Promise.all([
        axios.get('/api/client/quotes'),
        axios.get('/api/client/orders'),
        axios.get('/api/client/bills')
      ]);

      setQuotes(quotesRes.data);
      setOrders(ordersRes.data);
      setBills(billsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setQuoteRequest(prev => ({
      ...prev, 
      photos: files
    }));
  };

  const submitQuoteRequest = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    
    Object.keys(quoteRequest).forEach(key => {
      if (key === 'photos') {
        quoteRequest.photos.forEach(photo => {
          formData.append('photos', photo);
        });
      } else {
        formData.append(key, quoteRequest[key]);
      }
    });

    try {
      await axios.post('/api/quotes/request', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setQuoteRequest({
        propertyAddress: '',
        squareFootage: '',
        proposedPrice: '',
        notes: '',
        photos: []
      });
      fetchData();
    } catch (error) {
      console.error('Error submitting quote request:', error);
    }
  };

  const handleQuoteAction = async (action) => {
    if (!selectedQuote) return;

    try {
      await axios.post(`/api/quotes/${selectedQuote.id}/${action}`, {
        negotiationMessage: negotiationMessage || undefined
      });
      
      setSelectedQuote(null);
      setNegotiationMessage('');
      fetchData();
    } catch (error) {
      console.error(`Error with quote ${action}:`, error);
    }
  };

  const handleBillAction = async (action) => {
    if (!selectedBill) return;

    try {
      await axios.post(`/api/bills/${selectedBill.id}/${action}`, {
        disputeMessage: disputeMessage || undefined
      });
      
      setSelectedBill(null);
      setDisputeMessage('');
      fetchData();
    } catch (error) {
      console.error(`Error with bill ${action}:`, error);
    }
  };

  const renderQuoteRequestForm = () => (
    <form onSubmit={submitQuoteRequest}>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label>Property Address</label>
          <input
            type="text"
            className="form-control"
            value={quoteRequest.propertyAddress}
            onChange={(e) => setQuoteRequest(prev => ({
              ...prev, 
              propertyAddress: e.target.value
            }))}
            required
          />
        </div>
        <div className="col-md-6 mb-3">
          <label>Driveway Square Footage</label>
          <input
            type="number"
            className="form-control"
            value={quoteRequest.squareFootage}
            onChange={(e) => setQuoteRequest(prev => ({
              ...prev, 
              squareFootage: e.target.value
            }))}
            required
          />
        </div>
      </div>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label>Proposed Price</label>
          <input
            type="number"
            className="form-control"
            value={quoteRequest.proposedPrice}
            onChange={(e) => setQuoteRequest(prev => ({
              ...prev, 
              proposedPrice: e.target.value
            }))}
            required
          />
        </div>
        <div className="col-md-6 mb-3">
          <label>Photos (Up to 5)</label>
          <input
            type="file"
            multiple
            className="form-control"
            accept="image/*"
            onChange={handlePhotoUpload}
          />
          <small className="text-muted">
            {quoteRequest.photos.length} photo(s) selected
          </small>
        </div>
      </div>
      <div className="mb-3">
        <label>Additional Notes</label>
        <textarea
          className="form-control"
          value={quoteRequest.notes}
          onChange={(e) => setQuoteRequest(prev => ({
            ...prev, 
            notes: e.target.value
          }))}
          rows="3"
        />
      </div>
      <button type="submit" className="btn btn-primary">
        Submit Quote Request
      </button>
    </form>
  );

  const renderQuotesTable = () => (
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Status</th>
          <th>Proposed Price</th>
          <th>David's Response</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {quotes.map((quote) => (
          <tr key={quote.id}>
            <td>{new Date(quote.date).toLocaleDateString()}</td>
            <td>{quote.status}</td>
            <td>${quote.proposedPrice}</td>
            <td>{quote.davidResponse || 'Pending'}</td>
            <td>
              {quote.status === 'pending_response' && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedQuote(quote)}
                >
                  Review Response
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderQuoteNegotiationModal = () => (
    selectedQuote && (
      <div className="modal show d-block" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Quote Negotiation</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setSelectedQuote(null)}
              />
            </div>
            <div className="modal-body">
              <h6>David's Proposal</h6>
              <p>Price: ${selectedQuote.davidProposedPrice}</p>
              <p>Work Window: {selectedQuote.workWindow}</p>
              <p>Notes: {selectedQuote.davidNotes}</p>

              <div className="mt-3">
                <textarea
                  className="form-control"
                  placeholder="Your negotiation message (optional)"
                  value={negotiationMessage}
                  onChange={(e) => setNegotiationMessage(e.target.value)}
                  rows="3"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-success"
                onClick={() => handleQuoteAction('accept')}
              >
                Accept Quote
              </button>
              <button 
                className="btn btn-warning"
                onClick={() => handleQuoteAction('negotiate')}
              >
                Negotiate
              </button>
              <button 
                className="btn btn-danger"
                onClick={() => handleQuoteAction('cancel')}
              >
                Cancel Quote
              </button>
            </div>
          </div>
        </div>
        <div className="modal-backdrop show"></div>
      </div>
    )
  );

  return (
    <div className="container mt-4">
      <h2>Client Dashboard</h2>

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
      </ul>

      {activeTab === 'quotes' && (
        <div>
          <h3>Quote Request</h3>
          {renderQuoteRequestForm()}

          <h3 className="mt-4">Your Quotes</h3>
          {renderQuotesTable()}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h3>Your Orders</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Status</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td>{new Date(order.date).toLocaleDateString()}</td>
                  <td>{order.description}</td>
                  <td>{order.status}</td>
                  <td>${order.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bills' && (
        <div>
          <h3>Your Bills</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((bill) => (
                <tr key={bill.id}>
                  <td>{new Date(bill.date).toLocaleDateString()}</td>
                  <td>${bill.amount}</td>
                  <td>{bill.status}</td>
                  <td>
                    {bill.status === 'pending' && (
                      <button 
                        className="btn btn-primary btn-sm"
                        onClick={() => setSelectedBill(bill)}
                      >
                        Review Bill
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {renderQuoteNegotiationModal()}
      
      {selectedBill && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Bill Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedBill(null)}
                />
              </div>
              <div className="modal-body">
                <h6>Invoice Details</h6>
                <p>Amount: ${selectedBill.amount}</p>
                <p>Work Description: {selectedBill.description}</p>

                <textarea
                  className="form-control mt-3"
                  placeholder="Dispute notes (optional)"
                  value={disputeMessage}
                  onChange={(e) => setDisputeMessage(e.target.value)}
                  rows="3"
                />
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-success"
                  onClick={() => handleBillAction('pay')}
                >
                  Pay Immediately
                </button>
                <button 
                  className="btn btn-warning"
                  onClick={() => handleBillAction('dispute')}
                >
                  Dispute Bill
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show"></div>
        </div>
      )}
    </div>
  );
}

export default ClientDashboard;