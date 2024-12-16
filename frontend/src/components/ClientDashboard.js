import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ClientDashboard() {
  const [activeTab, setActiveTab] = useState('quotes');
  const [quoteRequest, setQuoteRequest] = useState({
    property_address: '',
    square_feet: '',
    proposed_price: '',
    note: '',
    photos: []
  });
  const [quotes, setQuotes] = useState([]);
  const [bills, setBills] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [negotiationForm, setNegotiationForm] = useState({
    proposed_price: '',
    preferred_start: '',
    preferred_end: '',
    note: ''
  });
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [negotiateQuote, setNegotiateQuote] = useState(null);
  const [negotiateForm, setNegotiateForm] = useState({
    proposed_price: '',
    preferred_start: '',
    preferred_end: '',
    note: ''
  });
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeBill, setDisputeBill] = useState(null);
  const [disputeNote, setDisputeNote] = useState('');

  const fetchQuotes = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/quotes');
      setQuotes(response.data);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchBills = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/bills');
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  useEffect(() => {
    fetchQuotes();
    fetchBills();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuoteRequest(prev => ({
      ...prev,
      [name]: value
    }));
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

    const client_id = localStorage.getItem('client_id');
    
    if (!client_id) {
      alert('You must be logged in to submit a quote request');
      return;
    }

    const formData = new FormData();
    
    formData.append('client_id', client_id);
    formData.append('property_address', quoteRequest.property_address);
    formData.append('square_feet', quoteRequest.square_feet);
    formData.append('proposed_price', quoteRequest.proposed_price);
    formData.append('note', quoteRequest.note);
    

    quoteRequest.photos.forEach((photo) => {
      formData.append('photos', photo);
    });

    try {
      const response = await axios.post('http://localhost:5050/quotes/request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data.success) {
        alert('Quote request submitted successfully!');

        setQuoteRequest({
          property_address: '',
          square_feet: '',
          proposed_price: '',
          note: '',
          photos: []
        });

        e.target.reset();
      } else {
        alert('Failed to submit quote request');
      }
    } catch (error) {
      console.error('Quote request error:', error);
      alert('An error occurred submitting the quote request');
    }
  };

  const handleAcceptQuote = async (quote) => {
    if (!window.confirm('Are you sure you want to accept this quote? This will create a binding contract.')) {
      return;
    }

    try {
      console.log('Accepting quote:', quote);
      const response = await axios.post(`http://localhost:5050/api/quotes/${quote.quote_id}/accept`, {
        final_price: parseFloat(quote.counter_price),
        work_start: quote.work_start,
        work_end: quote.work_end
      });

      console.log('Accept quote response:', response.data);

      if (response.data.success) {
        alert('Quote accepted! An order has been created.');
        // Refresh both quotes and orders
        await Promise.all([
          fetchQuotes(),
          fetchOrders()
        ]);
      } else {
        alert('Failed to accept quote: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error accepting quote:', error);
      alert('Error accepting quote: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleNegotiateQuote = (quote) => {
    setNegotiateQuote(quote);
    setNegotiateForm({
      proposed_price: quote.counter_price,
      preferred_start: '',
      preferred_end: '',
      note: ''
    });
    setShowNegotiateModal(true);
  };

  const handleNegotiateSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:5050/api/quotes/${negotiateQuote.quote_id}/negotiate`,
        {
          proposed_price: parseFloat(negotiateForm.proposed_price),
          preferred_start: `${negotiateForm.preferred_start} 00:00:00`,
          preferred_end: `${negotiateForm.preferred_end} 23:59:59`,
          note: negotiateForm.note
        }
      );

      if (response.data.success) {
        alert('Negotiation submitted successfully!');
        setShowNegotiateModal(false);
        fetchQuotes(); // Refresh quotes list
      } else {
        alert('Failed to submit negotiation: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting negotiation:', error);
      alert('Error submitting negotiation: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleQuitQuote = async (quote) => {
    if (!window.confirm('Are you sure you want to quit this quote? This cannot be undone.')) {
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5050/api/quotes/${quote.quote_id}/update`,
        {
          status: 'closed',
          note: 'Quote closed by client'
        }
      );

      if (response.data.success) {
        alert('Quote has been closed.');
        fetchQuotes();
      } else {
        alert('Failed to close quote: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error closing quote:', error);
      alert('Error closing quote: ' + (error.response?.data?.error || error.message));
    }
  };

  const handlePay = async (billId) => {
    if (!window.confirm('Are you sure you want to pay this bill?')) {
      return;
    }

    try {
      const response = await axios.post(`http://localhost:5050/api/bills/${billId}/pay`);
      
      if (response.data.success) {
        alert('Bill paid successfully!');
        fetchBills(); // Refresh the bills list
      } else {
        alert('Failed to process payment: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error paying bill:', error);
      alert('Error paying bill: ' + (error.response?.data?.error || error.message));
    }
  };

  // Handle Dispute Action
  const handleDispute = (bill) => {
    setDisputeBill(bill);
    setDisputeNote('');
    setShowDisputeModal(true);
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:5050/api/submit-dispute`,
        {
          bill_id: disputeBill.bill_id,
          note: disputeNote
        }
      );

      if (response.data.message === 'Dispute submitted successfully') {
        alert('Dispute submitted successfully!');
        setShowDisputeModal(false);
        fetchBills(); // Refresh bills list
      } else {
        alert('Failed to submit dispute: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting dispute:', error);
      alert('Error submitting dispute: ' + (error.response?.data?.error || error.message));
    }
  };

  const renderQuoteRequestForm = () => (
    <div className="container mt-4">
      <form onSubmit={submitQuoteRequest}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label>Property Address</label>
            <input
              type="text"
              className="form-control"
              name="property_address"
              value={quoteRequest.property_address}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label>Driveway Square Footage</label>
            <input
              type="number"
              className="form-control"
              name="square_feet"
              value={quoteRequest.square_feet}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-md-6 mb-3">
            <label>Proposed Price</label>
            <input
              type="number"
              className="form-control"
              name="proposed_price"
              value={quoteRequest.proposed_price}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="row">
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
          <div className="col-md-6 mb-3">
            <label>Additional Notes</label>
            <textarea
              className="form-control"
              name="note"
              value={quoteRequest.note}
              onChange={handleChange}
              rows="3"
            />
          </div>
        </div>
        <button type="submit" className="btn btn-primary">
          Submit Quote Request
        </button>
      </form>
    </div>
  );

  const renderQuotesTable = () => (
    <table className="table">
      <thead>
        <tr>
          <th>Quote ID</th>
          <th>Counter Price</th>
          <th>Work Start</th>
          <th>Work End</th>
          <th>Status</th>
          <th>Note</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {quotes.length > 0 ? (
          quotes.map((quote) => (
            <tr key={quote.quote_id}>
              <td>{quote.quote_id}</td>
              <td>${quote.counter_price}</td>
              <td>{quote.work_start ? new Date(quote.work_start).toLocaleString() : 'N/A'}</td>
              <td>{quote.work_end ? new Date(quote.work_end).toLocaleString() : 'N/A'}</td>
              <td>{quote.status}</td>
              <td>{quote.note || 'No note'}</td>
              <td>
                {quote.status === 'pending' || quote.status === 'revised' ? (
                  <div className="btn-group">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleAcceptQuote(quote)}
                    >
                      Accept Quote
                    </button>
                    <button
                      className="btn btn-primary btn-sm ms-1"
                      onClick={() => handleNegotiateQuote(quote)}
                    >
                      Negotiate Quote
                    </button>
                    <button
                      className="btn btn-danger btn-sm ms-1"
                      onClick={() => handleQuitQuote(quote)}
                    >
                      Quit
                    </button>
                  </div>
                ) : (
                  <span className="text-muted">
                    {quote.status === 'closed' ? 'Quote closed' : 'No actions available'}
                  </span>
                )}
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="7">No quotes available</td>
          </tr>
        )}
      </tbody>
    </table>
  );

  const renderNegotiateModal = () => (
    showNegotiateModal && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Negotiate Quote</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowNegotiateModal(false)}
              />
            </div>
            <form onSubmit={handleNegotiateSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Preferred Price ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={negotiateForm.proposed_price}
                    onChange={(e) => setNegotiateForm({
                      ...negotiateForm,
                      proposed_price: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Preferred Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={negotiateForm.preferred_start}
                    onChange={(e) => setNegotiateForm({
                      ...negotiateForm,
                      preferred_start: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Preferred End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={negotiateForm.preferred_end}
                    onChange={(e) => setNegotiateForm({
                      ...negotiateForm,
                      preferred_end: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Additional Notes</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={negotiateForm.note}
                    onChange={(e) => setNegotiateForm({
                      ...negotiateForm,
                      note: e.target.value
                    })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowNegotiateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Negotiation
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );

  const renderDisputeModal = () => (
    showDisputeModal && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Dispute Bill</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDisputeModal(false)}
              />
            </div>
            <form onSubmit={handleDisputeSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Dispute Reason</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={disputeNote}
                    onChange={(e) => setDisputeNote(e.target.value)}
                    required
                    placeholder="Please explain why you are disputing this bill"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDisputeModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Dispute
                </button>
              </div>
            </form>
          </div>
        </div>
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
          <h3>Your Quotes</h3>
          {renderQuotesTable()}
        </div>
      )}

      {activeTab === 'bills' && (
        <div>
          <h3>Your Bills</h3>
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
                    <td>
                      <span className={`badge bg-${bill.status === 'paid' ? 'success' : 'warning'}`}>
                        {bill.status}
                      </span>
                    </td>
                    <td>
                      {bill.status === 'pending' && (
                        <div className="btn-group">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handlePay(bill.bill_id)}
                          >
                            Pay Bill
                          </button>
                          <button
                            className="btn btn-warning btn-sm ms-1"
                            onClick={() => handleDispute(bill)}
                          >
                            Dispute
                          </button>
                        </div>
                      )}
                      {bill.status === 'paid' && (
                        <span className="text-success">Paid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {renderNegotiateModal()}
      {renderDisputeModal()}
    </div>
  );
}

export default ClientDashboard;