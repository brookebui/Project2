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
    setSelectedQuote(quote);
    setNegotiationForm({
      proposed_price: quote.counter_price,
      preferred_start: quote.work_start ? new Date(quote.work_start).toISOString().slice(0, 16) : '',
      preferred_end: quote.work_end ? new Date(quote.work_end).toISOString().slice(0, 16) : '',
      note: ''
    });
  };

  const handleNegotiationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQuote) return;

    try {
      const response = await axios.post(`http://localhost:5050/api/quotes/${selectedQuote.quote_id}/negotiate`, {
        proposed_price: parseFloat(negotiationForm.proposed_price),
        preferred_start: negotiationForm.preferred_start,
        preferred_end: negotiationForm.preferred_end,
        note: negotiationForm.note
      });

      if (response.data.success) {
        alert('Negotiation submitted successfully!');
        setSelectedQuote(null);
        fetchQuotes();
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

  const [isPaying, setIsPaying] = useState(false);
  const handlePay = (billId) => {
    const isConfirmed = window.confirm("Are you sure you want to pay this bill?");
    
    if (isConfirmed) {
      setIsPaying(true); 
      axios
        .delete(`http://localhost:5050/api/bills/${billId}`)
        .then((response) => {
          console.log(response.data);
          setBills((prevBills) => prevBills.filter((bill) => bill.bill_id !== billId));
          alert("Bill deleted successfully.");
        })
        .catch((error) => {
          console.error("Error deleting bill:", error);
          if (error.response) {
            alert(`Error: ${error.response.data.message}`);
          } else if (error.request) {

            alert("Network error. Please check your connection.");
          } else {

            alert("There was an issue removing the bill. Please try again.");
          }
        })
        .finally(() => {
          setIsPaying(false); 
        });
    }
  };

// Handle Dispute Action
const handleDispute = (billId) => {
  console.log(`Disputing bill ID: ${billId}`);
  // Implement logic for submitting a dispute (e.g., open a form for submitting a dispute note)
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
    <table className="table mt-4">
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
              <td>${quote.counter_price.toFixed(2)}</td>
              <td>{quote.work_start ? new Date(quote.work_start).toLocaleString() : 'N/A'}</td>
              <td>{quote.work_end ? new Date(quote.work_end).toLocaleString() : 'N/A'}</td>
              <td>{quote.status}</td>
              <td>{quote.note || 'No note'}</td>
              <td>
                {quote.status === 'pending' ? (
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
          <h3>Your Quotes</h3>
          {renderQuotesTable()}
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <h3>Your Orders</h3>
          {/* Add orders table here */}
        </div>
      )}
    </div>
  );
}

export default ClientDashboard;