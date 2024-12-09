// Quotes endpoints
app.get('/api/quotes', async (req, res) => {
  try {
    const quotes = await Quote.find().sort({ date: -1 });
    res.json(quotes);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching quotes' });
  }
});

app.post('/api/quotes/:id/respond', async (req, res) => {
  try {
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      {
        response: req.body.response,
        status: 'responded',
        respondedAt: new Date()
      },
      { new: true }
    );
    res.json(quote);
  } catch (error) {
    res.status(500).json({ error: 'Error updating quote' });
  }
});

// Orders endpoints
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ date: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
});

// Bills endpoints
app.get('/api/bills', async (req, res) => {
  try {
    const bills = await Bill.find().sort({ date: -1 });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching bills' });
  }
});

app.post('/api/bills/:id/respond', async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(
      req.params.id,
      {
        response: req.body.response,
        status: 'responded',
        respondedAt: new Date()
      },
      { new: true }
    );
    res.json(bill);
  } catch (error) {
    res.status(500).json({ error: 'Error updating bill' });
  }
});

// Revenue report endpoint
app.post('/api/revenue-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.body;
    
    const orders = await Order.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      status: 'completed'
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
    const totalOrders = orders.length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    res.json({
      totalRevenue,
      totalOrders,
      averageOrderValue
    });
  } catch (error) {
    res.status(500).json({ error: 'Error generating revenue report' });
  }
});
