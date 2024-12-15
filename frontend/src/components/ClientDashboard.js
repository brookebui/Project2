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
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [quoteAction, setQuoteAction] = useState({
    status: '',
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

  const handleQuoteAction = (quote) => {
    setSelectedQuote(quote);
    setQuoteAction({
      status: '',
      note: ''
    });
  };

  const handleQuoteActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQuote) return;
    
    try {
      await axios.post(
        `http://localhost:5050/api/quotes/${selectedQuote.quote_id}/respond`,
        {
          ...quoteAction,
          quote_id: selectedQuote.quote_id
        }
      );
      setSelectedQuote(null);
      setQuoteAction({
        status: '',
        note: ''
      });
      fetchQuotes();
    } catch (error) {
      console.error('Error responding to quote:', error);
      alert('Error responding to quote');
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
          <th>Request ID</th>
          <th>Counter Price</th>
          <th>Work Start</th>
          <th>Work End</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {quotes.length > 0 ? (
          quotes.map((quote) => (
            <tr key={quote.quote_id}>
              <td>{quote.quote_id}</td>
              <td>{quote.request_id}</td>
              <td>${quote.counter_price.toFixed(2)}</td>
              <td>{quote.work_start ? new Date(quote.work_start).toLocaleString() : 'N/A'}</td>
              <td>{quote.work_end ? new Date(quote.work_end).toLocaleString() : 'N/A'}</td>
              <td>{quote.status}</td>
              <td>
                {quote.status === 'pending' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleQuoteAction(quote)}
                  >
                    Review
                  </button>
                )}
                {quote.note && (
                  <button
                    className="btn btn-info btn-sm ms-1"
                    onClick={() => alert(quote.note)}
                  >
                    View Note
                  </button>
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

  const renderBillsTable = () => (
    <table className="table mt-4">
      <thead>
        <tr>
          <th>Bill ID</th>
          <th>Order ID</th>
          <th>Amount Due</th>
          <th>Status</th>
          <th>Created At</th>
          <th>Actions</th> {/* New Actions column */}
        </tr>
      </thead>
      <tbody>
        {bills.length > 0 ? (
          bills.map((bill) => (
            <tr key={bill.bill_id}>
              <td>{bill.bill_id}</td>
              <td>{bill.order_id}</td>
              <td>${bill.amount_due ? bill.amount_due.toFixed(2) : 'N/A'}</td>
              <td>{bill.status}</td>
              <td>{new Date(bill.created_at).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn btn-success"
                  onClick={() => handlePay(bill.bill_id)}
                >
                  Pay Immediately
                </button>
                <button
                  className="btn btn-warning ml-2"
                  onClick={() => handleDispute(bill.bill_id)}
                >
                  Dispute
                </button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6">No bills available</td>
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
          <h3>Your Requests</h3>
          {/* {renderRequestsTable()} */}
        </div>
      )}

      {activeTab === 'bills' && (
        <div>
          <h3>Your Bills</h3>
          {renderBillsTable()}
        </div>
      )}
    </div>
  );
}

export default ClientDashboard;