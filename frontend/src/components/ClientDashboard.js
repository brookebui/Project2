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

  const fetchRequests = async () => {
    try {
      const response = await fetch('http://localhost:5050/requests'); 
      const data = await response.json();
      console.log('Fetched data:', data); 
  
      if (data.success) {
        console.log('Fetched quotes:', data.quotes); 
        setQuotes(data.quotes); 
      } else {
        console.error('Failed to fetch requests:', data.message);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    }
  };

  // Fetch the requests when the component mounts
  useEffect(() => {
    fetchRequests();
  }, []); // Empty dependency array to run only once on component mount

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setQuoteRequest(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle photo upload
  const handlePhotoUpload = (e) => {

    const files = Array.from(e.target.files).slice(0, 5);
    setQuoteRequest(prev => ({
      ...prev,
      photos: files
    }));
  };

  // Submit quote request
  const submitQuoteRequest = async (e) => {
    e.preventDefault();

    // Get clientID from localStorage
    const client_id = localStorage.getItem('client_id');
    
    if (!client_id) {
      alert('You must be logged in to submit a quote request');
      return;
    }

    const formData = new FormData();
    
    formData.append('client_id', client_id);  // Add clientID from localStorage
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
                <th>Date</th>
                <th>Status</th>
                <th>Proposed Price</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {quotes && quotes.length > 0 ? (
                quotes.map((quote) => (
                    <tr key={quote.request_id}> 
                        <td>{new Date(quote.created_at).toLocaleDateString()}</td>
                        <td>{quote.status}</td>
                        <td>${quote.proposed_price.toFixed(2)}</td>
                        <td>
                            {quote.status === 'pending' && (
                                <button
                                    className="btn btn-primary btn-sm"
                                    // onClick={() => handleReview(quote)}
                                >
                                    Review
                                </button>
                            )}
                        </td>
                    </tr>
                ))
            ) : (
                <tr>
                    <td colSpan="4">No quotes available</td>
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

          <h3 className="mt-4">Your Quotes</h3>
          {renderQuotesTable()}
        </div>
      )}
    </div>
  );
}

export default ClientDashboard;
