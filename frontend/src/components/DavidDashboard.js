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
  const [quoteRevision, setQuoteRevision] = useState({
    counter_price: '',
    work_start: '',
    work_end: '',
    note: '',
    status: ''
  });
  const [bigClients, setBigClients] = useState([]);
  const [showBigClients, setShowBigClients] = useState(false);
  const [showDifficultClients, setShowDifficultClients] = useState(false);
  const [showMonthQuotes, setShowMonthQuotes] = useState(false);
  const [showProspectiveClients, setShowProspectiveClients] = useState(false);
  const [showLargestDriveways, setShowLargestDriveways] = useState(false);
  const [showOverdueBills, setShowOverdueBills] = useState(false);
  const [showBadClients, setShowBadClients] = useState(false);
  const [showGoodClients, setShowGoodClients] = useState(false);
  const [difficultClients, setDifficultClients] = useState([]);
  const [monthQuotes, setMonthQuotes] = useState([]);
  const [prospectiveClients, setProspectiveClients] = useState([]);
  const [largestDriveways, setLargestDriveways] = useState([]);
  const [overdueBills, setOverdueBills] = useState([]);
  const [badClients, setBadClients] = useState([]);
  const [goodClients, setGoodClients] = useState([]);
  const [showReviseModal, setShowReviseModal] = useState(false);
  const [reviseQuote, setReviseQuote] = useState(null);
  const [reviseForm, setReviseForm] = useState({
    counter_price: '',
    work_start: '',
    work_end: '',
    note: ''
  });
  const [showDisputeResponseModal, setShowDisputeResponseModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [disputeResponse, setDisputeResponse] = useState({
    new_amount: '',
    response_note: ''
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
        console.error('Error fetching bills:', error);
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
        console.log('Raw requests response:', requestsRes);
        console.log('Requests data:', requestsRes.data);
        console.log('Number of requests:', requestsRes.data.length);
        
        if (!Array.isArray(requestsRes.data)) {
          console.error('Requests data is not an array:', requestsRes.data);
          setRequests([]);
        } else {
          setRequests(requestsRes.data);
        }
      } catch (error) {
        console.error('Error fetching requests:', error.response?.data || error.message);
        console.error('Full error:', error);
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

  const handleGenerateReport = async () => {
    if (!startDate || !endDate) {
      alert('Please select both start and end dates');
      return;
    }

    try {
      const formattedStartDate = `${startDate} 00:00:00`;
      const formattedEndDate = `${endDate} 23:59:59`;

      console.log('Generating report for period:', { formattedStartDate, formattedEndDate });

      const response = await axios.get('http://localhost:5050/api/revenue-report', {
        params: {
          startDate: formattedStartDate,
          endDate: formattedEndDate
        },
        paramsSerializer: params => {
          return Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');
        }
      });

      console.log('Revenue report response:', response.data);
      setRevenueData(response.data);
    } catch (error) {
      console.error('Error generating report:', error);
      const errorMessage = error.response?.data?.error || error.message;
      alert('Error generating report: ' + errorMessage);
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

  const handleQuoteAction = async (quote, action) => {
    try {
      if (action === 'revise') {
        setReviseQuote(quote);
        setReviseForm({
          counter_price: quote.counter_price,
          work_start: quote.work_start ? new Date(quote.work_start).toISOString().slice(0, 10) : '',
          work_end: quote.work_end ? new Date(quote.work_end).toISOString().slice(0, 10) : '',
          note: ''
        });
        setShowReviseModal(true);
        return;
      }
      console.log('Request data:', quote);
      console.log('Action:', action);

      if (!quote) {
        console.error('Request object is null or undefined');
        alert('Invalid request data: Request object is missing');
        return;
      }

      if (!quote.request_id) {
        console.error('Request ID is missing:', quote);
        alert('Invalid request data: Request ID is missing');
        return;
      }

      if (action === 'create') {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const quoteData = {
          counter_price: quote.proposed_price ? parseFloat(quote.proposed_price) : 0,
          work_start: today.toISOString().slice(0, 19).replace('T', ' '),
          work_end: tomorrow.toISOString().slice(0, 19).replace('T', ' '),
          note: 'Quote created from request'
        };

        console.log('Creating quote with data:', {
          request_id: quote.request_id,
          ...quoteData
        });

        const response = await axios.post(
          `http://localhost:5050/api/requests/${quote.request_id}/quote`,
          quoteData
        );

        if (response.data.success) {
          alert('Quote created successfully!');
          fetchData(); // Refresh all data
        } else {
          alert('Failed to create quote: ' + (response.data.error || 'Unknown error'));
        }
      } else if (action === 'reject') {
        console.log('Rejecting request:', quote.request_id);

        const response = await axios.post(
          `http://localhost:5050/api/requests/${quote.request_id}/respond`,
          {
            status: 'rejected',
            note: 'Request rejected by David Smith'
          }
        );

        if (response.data.success) {
          alert('Request rejected successfully!');
          fetchData(); // Refresh all data
        } else {
          alert('Failed to reject request: ' + (response.data.error || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error(`Error ${action}ing quote:`, error);
      alert(`Error ${action}ing quote: ${error.message}`);
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

  const handleReviseQuote = (quote) => {
    setSelectedQuote(quote);
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16); // Get YYYY-MM-DDThh:mm format
    };
    
    setQuoteRevision({
      counter_price: quote.counter_price,
      work_start: formatDateForInput(quote.work_start),
      work_end: formatDateForInput(quote.work_end),
      note: '',
      status: 'revised'
    });
  };

  const handleQuitNegotiation = async (quote) => {
    if (window.confirm('Are you sure you want to quit the negotiation? This cannot be undone.')) {
      try {
        await axios.post(
          `http://localhost:5050/api/quotes/${quote.quote_id}/update`,
          {
            status: 'closed',
            note: 'Negotiation ended by David Smith'
          }
        );
        fetchData();
      } catch (error) {
        console.error('Error closing quote:', error);
        console.error('Error details:', error.response?.data);
        alert('Error closing quote');
      }
    }
  };

  const handleRevisionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedQuote) return;
    
    const formattedData = {
      ...quoteRevision,
      work_start: quoteRevision.work_start.replace('T', ' ') + ':00',
      work_end: quoteRevision.work_end.replace('T', ' ') + ':00',
      counter_price: parseFloat(quoteRevision.counter_price)
    };
    
    console.log('Sending revision data:', formattedData);
    
    try {
      await axios.post(
        `http://localhost:5050/api/quotes/${selectedQuote.quote_id}/update`,
        formattedData
      );
      setSelectedQuote(null);
      setQuoteRevision({
        counter_price: '',
        work_start: '',
        work_end: '',
        note: '',
        status: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error updating quote:', error.response?.data || error.message);
      console.error('Full error:', error);
      alert('Error updating quote');
    }
  };

  const renderRequestsTable = () => (
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
              {request.status === 'pending' ? (
                <div className="btn-group">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleQuoteAction(request, 'create')}
                  >
                    Create Quote
                  </button>
                  <button
                    className="btn btn-danger btn-sm ms-1"
                    onClick={() => handleQuoteAction(request, 'reject')}
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="text-muted">
                  {request.status === 'accepted' ? 'Quote created' : 'No actions available'}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const handleCreateBill = async (order) => {
    if (!window.confirm('Are you sure you want to create a bill for this order?')) {
      return;
    }

    try {
      console.log('Creating bill for order:', order);

      if (!order.order_id || !order.final_price) {
        alert('Invalid order data');
        return;
      }

      const response = await axios.post('http://localhost:5050/api/bills/create', {
        order_id: parseInt(order.order_id),
        amount_due: parseFloat(order.final_price)
      });

      console.log('Bill creation response:', response.data);

      if (response.data.success) {
        alert('Bill created successfully!');
        fetchData(); // Refresh all data
      } else {
        alert('Failed to create bill: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating bill:', error);
      const errorMessage = error.response?.data?.details || 
                          error.response?.data?.sqlMessage ||
                          error.response?.data?.error || 
                          error.message || 
                          'Unknown error occurred';
      alert('Error creating bill: ' + errorMessage);
    }
  };

  const fetchBigClients = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/clients/top');
      console.log('Big clients response:', response.data);
      setBigClients(response.data);
      setShowBigClients(true);
    } catch (error) {
      console.error('Error fetching big clients:', error);
      alert('Error fetching big clients: ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchDifficultClients = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/clients/difficult');
      setDifficultClients(response.data);
      setShowDifficultClients(true);
    } catch (error) {
      console.error('Error fetching difficult clients:', error);
      alert('Error fetching difficult clients: ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchMonthQuotes = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/quotes/month');
      setMonthQuotes(response.data);
      setShowMonthQuotes(true);
    } catch (error) {
      console.error('Error fetching month quotes:', error);
      alert('Error fetching month quotes: ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchProspectiveClients = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/clients/prospective');
      setProspectiveClients(response.data);
      setShowProspectiveClients(true);
    } catch (error) {
      console.error('Error fetching prospective clients:', error);
      alert('Error fetching prospective clients: ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchLargestDriveways = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/driveways/largest');
      setLargestDriveways(response.data);
      setShowLargestDriveways(true);
    } catch (error) {
      console.error('Error fetching largest driveways:', error);
      alert('Error fetching largest driveways: ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchOverdueBills = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/bills/overdue');
      setOverdueBills(response.data);
      setShowOverdueBills(true);
    } catch (error) {
      console.error('Error fetching overdue bills:', error);
      alert('Error fetching overdue bills: ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchBadClients = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/clients/bad');
      setBadClients(response.data);
      setShowBadClients(true);
    } catch (error) {
      console.error('Error fetching bad clients:', error);
      alert('Error fetching bad clients: ' + (error.response?.data?.error || error.message));
    }
  };

  const fetchGoodClients = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/clients/good');
      setGoodClients(response.data);
      setShowGoodClients(true);
    } catch (error) {
      console.error('Error fetching good clients:', error);
      alert('Error fetching good clients: ' + (error.response?.data?.error || error.message));
    }
  };

  const renderBigClientsModal = () => (
    showBigClients && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Top Clients</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowBigClients(false)}
              />
            </div>
            <div className="modal-body">
              {bigClients.length > 0 ? (
                <div>
                  <h6>Clients with Most Completed Orders:</h6>
                  <ul className="list-group">
                    {bigClients.map((client, index) => (
                      <li key={index} className="list-group-item">
                        {client.first_name} {client.last_name} - {client.completed_orders} orders
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No completed orders found.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowBigClients(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderDifficultClientsModal = () => (
    showDifficultClients && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Difficult Clients</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDifficultClients(false)}
              />
            </div>
            <div className="modal-body">
              {difficultClients.length > 0 ? (
                <div>
                  <h6>Clients with Most Rejected Requests:</h6>
                  <ul className="list-group">
                    {difficultClients.map((client, index) => (
                      <li key={index} className="list-group-item">
                        {client.first_name} {client.last_name} - {client.rejected_requests} requests
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No rejected requests found.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDifficultClients(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderMonthQuotesModal = () => (
    showMonthQuotes && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Quote Statistics</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowMonthQuotes(false)}
              />
            </div>
            <div className="modal-body">
              {monthQuotes.length > 0 ? (
                <div>
                  <h6>Total Quotes in Month:</h6>
                  <div className="alert alert-info">
                    {monthQuotes[0].status}
                  </div>
                </div>
              ) : (
                <p>No quotes found in this month.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowMonthQuotes(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderProspectiveClientsModal = () => (
    showProspectiveClients && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Prospective Clients</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowProspectiveClients(false)}
              />
            </div>
            <div className="modal-body">
              {prospectiveClients.length > 0 ? (
                <div>
                  <h6>Prospective Clients:</h6>
                  <ul className="list-group">
                    {prospectiveClients.map((client, index) => (
                      <li key={index} className="list-group-item">
                        {client.first_name} {client.last_name} - {client.prospective_count} clients
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No prospective clients found.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowProspectiveClients(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderLargestDrivewaysModal = () => (
    showLargestDriveways && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Largest Driveways</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowLargestDriveways(false)}
              />
            </div>
            <div className="modal-body">
              {largestDriveways.length > 0 ? (
                <div>
                  <h6>Largest Driveways:</h6>
                  <ul className="list-group">
                    {largestDriveways.map((driveway, index) => (
                      <li key={index} className="list-group-item">
                        {driveway.first_name} {driveway.last_name} - {driveway.square_feet} square feet
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No largest driveways found.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowLargestDriveways(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderOverdueBillsModal = () => (
    showOverdueBills && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Overdue Bills</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowOverdueBills(false)}
              />
            </div>
            <div className="modal-body">
              {overdueBills.length > 0 ? (
                <div>
                  <h6>Overdue Bills:</h6>
                  <ul className="list-group">
                    {overdueBills.map((bill, index) => (
                      <li key={index} className="list-group-item">
                        {bill.first_name} {bill.last_name} - {bill.bill_id} - {bill.amount_due} - {bill.overdue_days} days overdue
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No overdue bills found.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowOverdueBills(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderBadClientsModal = () => (
    showBadClients && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Bad Clients</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowBadClients(false)}
              />
            </div>
            <div className="modal-body">
              {badClients.length > 0 ? (
                <div>
                  <h6>Bad Clients:</h6>
                  <ul className="list-group">
                    {badClients.map((client, index) => (
                      <li key={index} className="list-group-item">
                        {client.first_name} {client.last_name} - {client.bad_client_count} bad clients
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No bad clients found.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowBadClients(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const renderGoodClientsModal = () => (
    showGoodClients && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Good Clients</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowGoodClients(false)}
              />
            </div>
            <div className="modal-body">
              {goodClients.length > 0 ? (
                <div>
                  <h6>Good Clients:</h6>
                  <ul className="list-group">
                    {goodClients.map((client, index) => (
                      <li key={index} className="list-group-item">
                        {client.first_name} {client.last_name} - {client.good_client_count} good clients
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No good clients found.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowGoodClients(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  const handleReviseSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `http://localhost:5050/api/quotes/${reviseQuote.quote_id}/update`,
        {
          counter_price: parseFloat(reviseForm.counter_price),
          work_start: `${reviseForm.work_start} 00:00:00`,
          work_end: `${reviseForm.work_end} 23:59:59`,
          note: reviseForm.note,
          status: 'revised'
        }
      );

      if (response.data.success) {
        alert('Quote revised successfully!');
        setShowReviseModal(false);
        fetchQuotes(); // Refresh quotes list
      } else {
        alert('Failed to revise quote: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error revising quote:', error);
      alert('Error revising quote: ' + (error.response?.data?.error || error.message));
    }
  };

  const renderReviseModal = () => (
    showReviseModal && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Revise Quote</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowReviseModal(false)}
              />
            </div>
            <form onSubmit={handleReviseSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Counter Price ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={reviseForm.counter_price}
                    onChange={(e) => setReviseForm({
                      ...reviseForm,
                      counter_price: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Work Start Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={reviseForm.work_start}
                    onChange={(e) => setReviseForm({
                      ...reviseForm,
                      work_start: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Work End Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={reviseForm.work_end}
                    onChange={(e) => setReviseForm({
                      ...reviseForm,
                      work_end: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Revision Note</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={reviseForm.note}
                    onChange={(e) => setReviseForm({
                      ...reviseForm,
                      note: e.target.value
                    })}
                    required
                    placeholder="Explain the changes in this revision"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowReviseModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Submit Revision
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );

  const handleDisputeResponse = async (e) => {
    e.preventDefault();
    try {
      console.log('Sending dispute response:', {
        bill_id: selectedBill.bill_id,
        new_amount: disputeResponse.new_amount,
        response_note: disputeResponse.response_note
      });

      const response = await axios.post(
        `http://localhost:5050/api/bills/${selectedBill.bill_id}/respond-dispute`,
        {
          new_amount: parseFloat(disputeResponse.new_amount),
          response_note: disputeResponse.response_note
        }
      );

      console.log('Response from server:', response.data);

      if (response.data.success) {
        alert('Dispute response submitted successfully!');
        setShowDisputeResponseModal(false);
        fetchBills(); // Refresh bills list
      } else {
        alert('Failed to submit dispute response: ' + (response.data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error submitting dispute response:', error);
      const errorMessage = error.response?.data?.error || error.message;
      alert('Error submitting dispute response: ' + errorMessage);
    }
  };

  const renderDisputeResponseModal = () => (
    showDisputeResponseModal && (
      <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Respond to Dispute</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowDisputeResponseModal(false)}
              />
            </div>
            <form onSubmit={handleDisputeResponse}>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">New Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={disputeResponse.new_amount}
                    onChange={(e) => setDisputeResponse({
                      ...disputeResponse,
                      new_amount: e.target.value
                    })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Response Note</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    value={disputeResponse.response_note}
                    onChange={(e) => setDisputeResponse({
                      ...disputeResponse,
                      response_note: e.target.value
                    })}
                    required
                    placeholder="Explain the reason for the price adjustment"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDisputeResponseModal(false)}
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
    )
  );

  const fetchBills = async () => {
    try {
      const response = await axios.get('http://localhost:5050/api/bills');
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Dashboard</h2>
        <div className="btn-group">
          <button className="btn btn-info" onClick={fetchBigClients}>
            Big Clients
          </button>
          <button className="btn btn-warning" onClick={fetchDifficultClients}>
            Difficult Clients
          </button>
          <button className="btn btn-primary" onClick={fetchMonthQuotes}>
            This Month Quotes
          </button>
          <button className="btn btn-success" onClick={fetchProspectiveClients}>
            Prospective Clients
          </button>
          <button className="btn btn-info" onClick={fetchLargestDriveways}>
            Largest Driveway
          </button>
          <button className="btn btn-danger" onClick={fetchOverdueBills}>
            Overdue Bills
          </button>
          <button className="btn btn-dark" onClick={fetchBadClients}>
            Bad Clients
          </button>
          <button className="btn btn-success" onClick={fetchGoodClients}>
            Good Clients
          </button>
        </div>
      </div>

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
                  <tr key={quote.quote_id}>
                    <td>{quote.quote_id}</td>
                    <td>{quote.request_id}</td>
                    <td>{quote.client_name || 'N/A'}</td>
                    <td>${quote.counter_price}</td>
                    <td>{new Date(quote.work_start).toLocaleDateString()}</td>
                    <td>{new Date(quote.work_end).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                    <td>
                      {(quote.status === 'pending' || quote.status === 'negotiating') && (
                        <div className="btn-group">
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleQuoteAction(quote, 'accept')}
                          >
                            Accept
                          </button>
                          <button
                            className="btn btn-primary btn-sm ms-1"
                            onClick={() => handleQuoteAction(quote, 'revise')}
                          >
                            Revise
                          </button>
                          <button
                            className="btn btn-danger btn-sm ms-1"
                            onClick={() => handleQuoteAction(quote, 'reject')}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                      {quote.status !== 'pending' && quote.status !== 'negotiating' && (
                        <span className="text-muted">
                          {quote.status === 'accepted' ? 'Quote accepted' : 'No actions available'}
                        </span>
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
            renderRequestsTable()
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
                  <th>Actions</th>
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
                    <td>
                      {order.status !== 'billed' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleCreateBill(order)}
                        >
                          Process
                        </button>
                      )}
                      {order.status === 'billed' && (
                        <span className="text-muted">Billed</span>
                      )}
                    </td>
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
                  <th>Note</th>
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
                    <td>{bill.note || 'No note'}</td>
                    <td>
                      {bill.status === 'disputed' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => {
                            setSelectedBill(bill);
                            setDisputeResponse({
                              new_amount: bill.amount_due,
                              response_note: ''
                            });
                            setShowDisputeResponseModal(true);
                          }}
                        >
                          Respond to Dispute
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
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">&nbsp;</label>
                <button 
                  className="btn btn-primary d-block"
                  onClick={handleGenerateReport}
                >
                  Generate Report
                </button>
              </div>
            </div>
          </div>

          {revenueData && (
            <div>
              <h4>Summary</h4>
              <div className="row mb-4">
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Total Revenue</h5>
                      <p className="card-text">${revenueData.totals.total_revenue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Collected Revenue</h5>
                      <p className="card-text">${revenueData.totals.collected_revenue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card">
                    <div className="card-body">
                      <h5 className="card-title">Pending Revenue</h5>
                      <p className="card-text">${revenueData.totals.pending_revenue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <h4>Daily Breakdown</h4>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Total Bills</th>
                    <th>Total Revenue</th>
                    <th>Paid Bills</th>
                    <th>Collected Revenue</th>
                    <th>Pending Bills</th>
                    <th>Pending Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.daily_data.map((day, index) => (
                    <tr key={index}>
                      <td>{new Date(day.date).toLocaleDateString()}</td>
                      <td>{day.total_bills}</td>
                      <td>${day.total_revenue.toFixed(2)}</td>
                      <td>{day.paid_bills}</td>
                      <td>${day.collected_revenue.toFixed(2)}</td>
                      <td>{day.pending_bills}</td>
                      <td>${day.pending_revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {selectedQuote && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Revise Quote #{selectedQuote.quote_id}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedQuote(null)}
                />
              </div>
              <div className="modal-body">
                <form onSubmit={handleRevisionSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Counter Price ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      value={quoteRevision.counter_price}
                      onChange={(e) => setQuoteRevision(prev => ({
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
                      value={quoteRevision.work_start}
                      onChange={(e) => setQuoteRevision(prev => ({
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
                      value={quoteRevision.work_end}
                      onChange={(e) => setQuoteRevision(prev => ({
                        ...prev,
                        work_end: e.target.value
                      }))}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Note</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      value={quoteRevision.note}
                      onChange={(e) => setQuoteRevision(prev => ({
                        ...prev,
                        note: e.target.value
                      }))}
                      required
                      placeholder="Explain the changes in this revision"
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setSelectedQuote(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Send Revision
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {renderBigClientsModal()}
      {renderDifficultClientsModal()}
      {renderMonthQuotesModal()}
      {renderProspectiveClientsModal()}
      {renderLargestDrivewaysModal()}
      {renderOverdueBillsModal()}
      {renderBadClientsModal()}
      {renderGoodClientsModal()}
      {renderReviseModal()}
      {renderDisputeResponseModal()}
    </div>
  );
}

export default DavidDashboard;