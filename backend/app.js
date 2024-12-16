const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql');

dotenv.config();

const app = express();

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'driveway_mgmt',
    port: 3306
});

// Test database connection with enhanced error logging
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database successfully');
    
    // Test query to verify connection
    db.query('SELECT 1', (err, results) => {
        if (err) {
            console.error('Error executing test query:', err);
        } else {
            console.log('Database connection verified');
        }
    });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const generateClientID = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let client_id = '';
    for (let i = 0; i < 5; i++) {
        client_id += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return client_id;
};

// Registration Endpoint
app.post('/Registration', (request, response) => {
    const { first_name, last_name, address, phone_number, email, credit_card, password } = request.body;

    const client_id = generateClientID();

    const sql = "INSERT INTO Clients (client_id, first_name, last_name, address, phone, email, credit_card, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(sql, [client_id, first_name, last_name, address, phone_number, email, credit_card, password], (err, data) => {
        if (err) {
            console.error('Error during registration:', err);
            return response.status(500).json({ error: "Error creating account", details: err.message });
        }
        return response.json({
            success: true,
            data: data,
            client_id: client_id
        });
    });
});

// Login Endpoint
app.post('/login', (request, response) => {
    const { email, password } = request.body;

    const sql = "SELECT * FROM Clients WHERE email = ? AND password = ?";

    db.query(sql, [email, password], (err, data) => {
        if (err) {
            console.error('Error during login:', err);
            return response.status(500).json({ error: "Error during login" });
        }

        if (data.length > 0) {
            const client = data[0];  
            const client_id = client.client_id;  

            console.log("Client ID extracted:", client_id);  

            return response.json({
                success: true,
                client_id: client_id, 
                user: client,  
            });
        } else {
            return response.json({ success: false, message: "Invalid email or password" });
        }
    });
});

// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Ensure the uploads folder exists
        if (!fs.existsSync('./uploads')) {
            fs.mkdirSync('./uploads');
        }
        cb(null, './uploads'); // Save to uploads folder
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        cb(null, `quote-${Date.now()}-${file.originalname}`);
    }
});

// File filter to accept only images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
    }
};

// Multer upload configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Quote request submission endpoint
app.post('/quotes/request', upload.array('photos', 5), (req, res) => {
    const { property_address, square_feet, proposed_price, note, client_id } = req.body;

    // Check for duplicate requests in the last minute
    const checkDuplicateSQL = `
        SELECT COUNT(*) as count 
        FROM Requests 
        WHERE client_id = ? 
        AND property_address = ? 
        AND square_feet = ? 
        AND proposed_price = ? 
        AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
    `;

    db.query(checkDuplicateSQL, [client_id, property_address, square_feet, proposed_price], (err, result) => {
        if (err) {
            console.error('Error checking for duplicates:', err);
            return res.status(500).json({ error: 'Error checking for duplicates' });
        }

        if (result[0].count > 0) {
            return res.status(400).json({ error: 'Duplicate request detected' });
        }

        // Continue with the insert if no duplicate found
        const sql = `
            INSERT INTO Requests (
                client_id,
                property_address,
                square_feet,
                proposed_price,
                note,
                status,
                created_at
            ) VALUES (?, ?, ?, ?, ?, 'pending', NOW())
        `;

        const values = [
            client_id,
            property_address,
            square_feet,
            parseFloat(proposed_price),
            note
        ];

        db.query(sql, values, (err, result) => {
            if (err) {
                console.error('Error inserting quote request:', err);
                return res.status(500).json({
                    success: false,
                    error: 'Failed to submit quote request',
                    details: err.message
                });
            }

            res.status(201).json({
                success: true,
                message: 'Quote request submitted successfully',
                request_id: result.insertId
            });
        });
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/requests', (req, res) => {
  console.log('Fetching requests...');
  const sql = `
    SELECT DISTINCT
      r.request_id,
      r.client_id,
      r.property_address,
      r.square_feet,
      r.proposed_price,
      r.note,
      r.status,
      r.created_at,
      c.first_name,
      c.last_name
    FROM Requests r
    LEFT JOIN Clients c ON r.client_id = c.client_id
    ORDER BY r.created_at DESC
  `;
  
  console.log('Executing SQL:', sql);
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching requests:', err);
      return res.status(500).json({ error: 'Error fetching requests', details: err.message });
    }

    console.log('Number of raw requests:', data.length);

    // Format the data and handle nulls
    const formattedData = data.map(request => ({
      request_id: request.request_id,
      client_id: request.client_id,
      property_address: request.property_address || '',
      square_feet: request.square_feet || 0,
      proposed_price: request.proposed_price || 0,
      note: request.note || '',
      status: request.status || 'pending',
      created_at: request.created_at || new Date(),
      first_name: request.first_name || 'Unknown',
      last_name: request.last_name || 'Client'
    }));

    // Remove any duplicates based on all fields
    const uniqueRequests = formattedData.filter((request, index, self) =>
      index === self.findIndex((r) => (
        r.client_id === request.client_id &&
        r.property_address === request.property_address &&
        r.square_feet === request.square_feet &&
        r.proposed_price === request.proposed_price &&
        r.created_at.getTime() === request.created_at.getTime()
      ))
    );

    console.log('Number of unique requests:', uniqueRequests.length);
    res.json(uniqueRequests);
  });
});

// Update the bills endpoint
app.get('/api/bills', (req, res) => {
  console.log('Bills endpoint hit');
  const sql = `
    SELECT DISTINCT
      b.bill_id,
      b.order_id,
      b.amount_due,
      b.status,
      b.created_at,
      o.quote_id
    FROM bills b
    LEFT JOIN orders o ON b.order_id = o.order_id
    WHERE b.bill_id > 0
    ORDER BY b.created_at DESC
  `;
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching bills:', err);
      return res.status(500).json({ error: 'Error fetching bills' });
    }
    console.log('Bills data:', data);
    res.json(data);
  });
});

// Delete bill endpoint
app.delete('/api/bills/:billId', (req, res) => {
  const billId = req.params.billId;

  console.log(`Received request to delete bill with ID: ${billId}`);

  // Validate billId
  if (!billId || isNaN(billId)) {
    console.log('Invalid bill ID received');
    return res.status(400).json({ error: 'Invalid bill ID' });
  }

  const sql = 'DELETE FROM bills WHERE bill_id = ?';

  db.query(sql, [billId], (err, result) => {
    if (err) {
      console.error('Error deleting bill:', err);
      return res.status(500).json({ error: 'Error deleting bill', details: err.message });
    }

    console.log('Delete result:', result);
    if (result.affectedRows === 0) {
      console.log(`No bill found with ID: ${billId}`);
      return res.status(404).json({ error: 'Bill not found' });
    }

    console.log(`Bill with ID ${billId} deleted successfully`);
    res.status(200).json({ message: 'Bill deleted successfully' });
  });
});

app.post('/api/submit-dispute', (req, res) => {
  const { bill_id, note } = req.body;

  // Validate inputs
  if (!bill_id || !note) {
    return res.status(400).json({ error: 'Bill ID and note are required' });
  }

  const sql = `
    UPDATE bills
    SET note = ?
    WHERE bill_id = ?
  `;

  db.query(sql, [note, bill_id], (err, result) => {
    if (err) {
      console.error('Error submitting dispute:', err);
      return res.status(500).json({ message: 'Failed to submit dispute', details: err.message });
    }

    if (result.affectedRows === 0) {
      console.log(`No bill found with ID: ${bill_id}`);
      return res.status(404).json({ error: 'Bill not found' });
    }

    console.log(`Dispute submitted for bill with ID: ${bill_id}`);
    res.status(200).json({ message: 'Dispute submitted successfully' });
  });
});


// Orders endpoint
app.get('/api/orders', (req, res) => {
  console.log('Fetching orders...');
  const sql = `
    SELECT 
      order_id,
      quote_id,
      work_start,
      work_end,
      final_price,
      status,
      created_at
    FROM orders
    WHERE order_id > 0
    ORDER BY created_at DESC
  `;
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching orders:', err);
      return res.status(500).json({ error: 'Error fetching orders' });
    }
    console.log('Orders data:', data);
    res.json(data);
  });
});

// Group all quote-related endpoints together
app.get('/api/quotes', (req, res) => {
  console.log('Fetching quotes...');
  const sql = `
    SELECT 
      quote_id,
      request_id,
      counter_price,
      work_start,
      work_end,
      status,
      note,
      created_at
    FROM quotes
    WHERE quote_id > 0
    ORDER BY created_at DESC
  `;
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching quotes:', err);
      return res.status(500).json({ error: 'Error fetching quotes' });
    }
    console.log('Quotes data:', data);
    res.json(data);
  });
});

// Add the accept quote endpoint right after the GET endpoint
app.post('/api/quotes/:id/accept', async (req, res) => {
  const { id } = req.params;
  const { final_price, work_start, work_end } = req.body;
  
  console.log('Quote acceptance request:', { id, final_price, work_start, work_end });

  try {
    // First check if the quote exists
    const [quote] = await new Promise((resolve, reject) => {
      db.query('SELECT * FROM quotes WHERE quote_id = ?', [id], (err, results) => {
        if (err) {
          console.error('Error checking quote:', err);
          reject(err);
        } else {
          console.log('Quote check results:', results);
          resolve(results);
        }
      });
    });

    if (!quote) {
      console.log('Quote not found:', id);
      return res.status(404).json({ 
        success: false, 
        error: 'Quote not found' 
      });
    }

    // Start transaction
    await new Promise((resolve, reject) => {
      db.beginTransaction(err => {
        if (err) {
          console.error('Transaction start error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    try {
      // 1. Update quote status
      await new Promise((resolve, reject) => {
        const updateQuoteSQL = 'UPDATE quotes SET status = "accepted" WHERE quote_id = ?';
        db.query(updateQuoteSQL, [id], (err) => {
          if (err) {
            console.error('Quote update error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // 2. Create order
      const orderResult = await new Promise((resolve, reject) => {
        const createOrderSQL = `
          INSERT INTO orders (
            quote_id,
            work_start,
            work_end,
            final_price,
            status
          ) VALUES (?, ?, ?, ?, "pending")
        `;
        
        const values = [id, work_start, work_end, final_price];
        console.log('Creating order with values:', values);
        
        db.query(createOrderSQL, values, (err, result) => {
          if (err) {
            console.error('Order creation error:', err);
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      // 3. Create bill
      await new Promise((resolve, reject) => {
        const createBillSQL = `
          INSERT INTO bills (
            order_id,
            amount_due,
            status
          ) VALUES (?, ?, "pending")
        `;
        
        db.query(createBillSQL, [orderResult.insertId, final_price], (err) => {
          if (err) {
            console.error('Bill creation error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // Commit transaction
      await new Promise((resolve, reject) => {
        db.commit(err => {
          if (err) {
            console.error('Commit error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log('Quote accepted successfully, order created with ID:', orderResult.insertId);

      res.json({
        success: true,
        message: 'Quote accepted and order created successfully',
        order_id: orderResult.insertId
      });

    } catch (error) {
      console.error('Transaction error:', error);
      await new Promise(resolve => db.rollback(() => resolve()));
      throw error;
    }

  } catch (error) {
    console.error('Error in quote acceptance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process quote acceptance',
      details: error.message
    });
  }
});

app.post('/api/quotes/:id/negotiate', (req, res) => {
  const { id } = req.params;
  const { note, proposed_price, preferred_start, preferred_end } = req.body;
  
  const sql = `
    UPDATE quotes 
    SET status = 'negotiating',
        note = ?,
        counter_price = ?,
        work_start = ?,
        work_end = ?
    WHERE quote_id = ?
  `;

  db.query(sql, [note, proposed_price, preferred_start, preferred_end, id], (err, result) => {
    if (err) {
      console.error('Error updating quote:', err);
      return res.status(500).json({ error: 'Error updating quote' });
    }
    res.json({ success: true, message: 'Negotiation submitted successfully' });
  });
});

// Add this test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Add endpoint to handle quote request responses
app.post('/api/requests/:id/respond', (req, res) => {
  const { id } = req.params;
  const { status, note, counter_price, work_start, work_end } = req.body;
  
  // Start a transaction
  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Error processing response' });
    }

    // Update request status
    const updateRequestSql = `
      UPDATE requests 
      SET status = ?, 
          note = ?
      WHERE request_id = ?
    `;

    db.query(updateRequestSql, [status, note, id], (err, result) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error updating request:', err);
          res.status(500).json({ error: 'Error updating request' });
        });
      }

      // If accepting and creating quote
      if (status === 'accepted') {
        // Check for existing quote IDs and generate a unique one
        const checkQuoteId = () => {
          return new Promise((resolve, reject) => {
            const generateId = () => Math.floor(Math.random() * 999) + 1;
            let quoteId = generateId();
            
            const checkSql = "SELECT quote_id FROM quotes WHERE quote_id = ?";
            db.query(checkSql, [quoteId], (err, result) => {
              if (err) {
                reject(err);
              } else if (result.length > 0) {
                // ID exists, try again
                resolve(checkQuoteId());
              } else {
                resolve(quoteId);
              }
            });
          });
        };
        
        checkQuoteId().then(randomQuoteId => {
          console.log('Generated quote ID:', randomQuoteId);  // Debug log

          const createQuoteSql = `
            INSERT INTO quotes (
              quote_id,
              request_id, 
              counter_price, 
              work_start, 
              work_end, 
              status,
              note,
              created_at
            ) VALUES (?, ?, ?, ?, ?, 'pending', ?, CURRENT_TIMESTAMP)
          `;

          const values = [
            randomQuoteId,
            id,
            counter_price || 0,
            work_start || new Date(),
            work_end || new Date(),
            'pending',
            note || ''  // Add note with empty string default
          ];
          console.log('Insert values:', values);  // Debug log

          db.query(createQuoteSql, values, (err, result) => {
            if (err) {
              console.error('SQL Error:', err);  // Debug log
              console.error('Failed SQL:', createQuoteSql);
              console.error('Failed values:', values);
              return db.rollback(() => {
                console.error('Error creating quote:', err);
                res.status(500).json({ error: 'Error creating quote' });
              });
            }
            console.log('Quote created successfully:', result);

            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  console.error('Error committing transaction:', err);
                  res.status(500).json({ error: 'Error completing response' });
                });
              }
              res.json({ 
                success: true, 
                message: 'Quote created successfully',
                quote_id: randomQuoteId
              });
            });
          });
        }).catch(err => {
          console.error('Error generating quote ID:', err);
          return res.status(500).json({ error: 'Error generating quote ID' });
        });
      } else {
        // If rejecting, just commit the request update
        db.commit(err => {
          if (err) {
            return db.rollback(() => {
              console.error('Error committing transaction:', err);
              res.status(500).json({ error: 'Error completing response' });
            });
          }
          res.json({ 
            success: true, 
            message: 'Request rejected successfully' 
          });
        });
      }
    });
  });
});

// Add endpoint to update quotes
app.post('/api/quotes/:id/update', (req, res) => {
  const { id } = req.params;
  const { counter_price, work_start, work_end, note, status } = req.body;
  
  console.log('Updating quote:', { id, counter_price, work_start, work_end, note, status });

  // Ensure all required fields have values
  const updateData = {
    counter_price: counter_price || 0,
    work_start: work_start || new Date().toISOString().slice(0, 16).replace('T', ' ') + ':00',
    work_end: work_end || new Date().toISOString().slice(0, 16).replace('T', ' ') + ':00',
    note: note || '',
    status: status || 'pending'
  };

  const sql = `
    UPDATE quotes 
    SET counter_price = ?,
        work_start = ?,
        work_end = ?,
        note = ?,
        status = ?
    WHERE quote_id = ?
  `;

  db.query(sql, [
    updateData.counter_price,
    updateData.work_start,
    updateData.work_end,
    updateData.note,
    updateData.status,
    id
  ], (err, result) => {
    if (err) {
      console.error('Error updating quote:', err);
      console.error('Failed SQL:', sql);
      console.error('Failed values:', [
        updateData.counter_price,
        updateData.work_start,
        updateData.work_end,
        updateData.note,
        updateData.status,
        id
      ]);
      return res.status(500).json({ error: 'Error updating quote' });
    }
    console.log('Quote updated successfully:', result);
    res.json({ success: true, message: 'Quote updated successfully' });
  });
});

// Add this helper function at the top of your file
const generateQuoteId = async (db) => {
  while (true) {
    const randomId = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
    
    // Check if this ID already exists
    const [existing] = await new Promise((resolve, reject) => {
      db.query('SELECT quote_id FROM quotes WHERE quote_id = ?', [randomId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!existing) {
      return randomId;
    }
  }
};

// Update the quote creation endpoint
app.post('/api/requests/:id/quote', async (req, res) => {
  const { id } = req.params;
  const { counter_price, work_start, work_end, note } = req.body;
  
  console.log('Creating quote from request:', { id, counter_price, work_start, work_end, note });

  // Validate input
  if (!id || id === '0') {
    return res.status(400).json({
      success: false,
      error: 'Invalid request ID'
    });
  }

  try {
    // Generate a unique quote ID
    const quoteId = await generateQuoteId(db);
    console.log('Generated quote ID:', quoteId);

    // First check if the request exists
    const [request] = await new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM Requests WHERE request_id = ?';
      console.log('Checking request with SQL:', sql, [id]);
      
      db.query(sql, [id], (err, results) => {
        if (err) {
          console.error('Error checking request:', err);
          reject(err);
        } else {
          console.log('Request check results:', results);
          resolve(results);
        }
      });
    });

    if (!request) {
      return res.status(404).json({ 
        success: false, 
        error: 'Request not found' 
      });
    }

    // Start transaction
    await new Promise((resolve, reject) => {
      db.beginTransaction(err => {
        if (err) {
          console.error('Transaction start error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    try {
      // 1. Update request status
      await new Promise((resolve, reject) => {
        const sql = 'UPDATE Requests SET status = ? WHERE request_id = ?';
        console.log('Updating request with SQL:', sql, ['accepted', id]);
        
        db.query(sql, ['accepted', id], (err) => {
          if (err) {
            console.error('Request update error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      // 2. Create quote
      const quoteResult = await new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO quotes (
            quote_id,
            request_id,
            counter_price,
            work_start,
            work_end,
            status,
            note
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const values = [
          quoteId,
          id,
          counter_price,
          work_start,
          work_end,
          'pending',
          note || ''
        ];
        
        console.log('Creating quote with SQL:', sql, values);
        
        db.query(sql, values, (err, result) => {
          if (err) {
            console.error('Quote creation error:', err);
            reject(err);
          } else {
            resolve(result);
          }
        });
      });

      // Commit transaction
      await new Promise((resolve, reject) => {
        db.commit(err => {
          if (err) {
            console.error('Commit error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log('Quote created successfully, quote ID:', quoteId);

      res.json({
        success: true,
        message: 'Quote created successfully',
        quote_id: quoteId
      });

    } catch (error) {
      console.error('Transaction error:', error);
      await new Promise(resolve => db.rollback(() => resolve()));
      throw error;
    }

  } catch (error) {
    console.error('Error creating quote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create quote',
      details: error.message,
      stack: error.stack
    });
  }
});

// Add this helper function at the top of your file
const generateBillId = async (db) => {
  while (true) {
    const randomId = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
    
    // Check if this ID already exists
    const [existing] = await new Promise((resolve, reject) => {
      db.query('SELECT bill_id FROM bills WHERE bill_id = ?', [randomId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (!existing) {
      return randomId;
    }
  }
};

// Update the bill creation endpoint
app.post('/api/bills/create', async (req, res) => {
  const { order_id, amount_due } = req.body;
  
  console.log('Creating bill with data:', { order_id, amount_due });

  if (!order_id || !amount_due) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields'
    });
  }

  try {
    // Start transaction
    await new Promise((resolve, reject) => {
      db.beginTransaction(err => {
        if (err) {
          console.error('Transaction start error:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    try {
      // Generate unique bill ID
      const billId = Math.floor(Math.random() * (999 - 100 + 1)) + 100;
      console.log('Generated bill ID:', billId);

      // Create bill with status explicitly set to 'pending'
      await new Promise((resolve, reject) => {
        const sql = `
          INSERT INTO bills 
          (bill_id, order_id, amount_due, status, created_at) 
          VALUES (?, ?, ?, 'pending', NOW())
        `;
        
        const values = [billId, order_id, amount_due];
        console.log('Creating bill with values:', values);
        
        db.query(sql, values, (err, result) => {
          if (err) {
            console.error('Bill creation error:', err);
            console.error('SQL Error:', err.sqlMessage);
            reject(err);
          } else {
            console.log('Bill created with status: pending');
            resolve(result);
          }
        });
      });

      // Update order status to 'billed'
      await new Promise((resolve, reject) => {
        const sql = `
          UPDATE orders 
          SET status = 'billed' 
          WHERE order_id = ?
        `;
        
        db.query(sql, [order_id], (err, result) => {
          if (err) {
            console.error('Order update error:', err);
            console.error('SQL Error:', err.sqlMessage);
            reject(err);
          } else {
            console.log('Order status updated to: billed');
            resolve(result);
          }
        });
      });

      // Commit transaction
      await new Promise((resolve, reject) => {
        db.commit(err => {
          if (err) {
            console.error('Commit error:', err);
            reject(err);
          } else {
            resolve();
          }
        });
      });

      console.log('Bill created successfully with ID:', billId);
      res.json({
        success: true,
        message: 'Bill created successfully',
        bill_id: billId,
        status: 'pending'
      });

    } catch (error) {
      // Rollback on error
      await new Promise(resolve => db.rollback(() => resolve()));
      throw error;
    }

  } catch (error) {
    console.error('Error in bill creation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create bill',
      details: error.message,
      sqlMessage: error.sqlMessage
    });
  }
});

// Big clients
app.get('/api/clients/top', (req, res) => {
  const sql = `
    SELECT 
      client_id,
      first_name,
      last_name,
      total_orders
    FROM Clients
    ORDER BY total_orders DESC
    LIMIT 3;
  `;

  console.log('Executing top clients query:', sql);

  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching top clients:', err);
      return res.status(500).json({ 
        error: 'Error fetching top clients',
        details: err.message 
      });
    }

    console.log('Top clients data:', data);
    
    // Handle case where no orders exist
    if (data.length === 0) {
      console.log('No top clients found.');
      return res.json([{
        client_id: 'N/A',
        first_name: 'No',
        last_name: 'Orders',
        total_orders: 0
      }]);
    }

    // Format the response
    const formattedData = data.map(client => ({
      client_id: client.client_id,
      first_name: client.first_name,
      last_name: client.last_name,
      total_orders: parseInt(client.total_orders)
    }));

    res.json(formattedData);
  });
});


// Add endpoint for difficult clients (3 requests, no follow-up)
app.get('/api/clients/difficult', (req, res) => {
  console.log('Difficult clients endpoint hit');
  
  const sql = `
    SELECT 
      c.client_id,
      c.first_name,
      c.last_name,
      COUNT(r.request_id) as request_count
    FROM clients c
    INNER JOIN requests r ON c.client_id = r.client_id
    WHERE r.status = 'pending'
    GROUP BY c.client_id, c.first_name, c.last_name
    HAVING COUNT(r.request_id) >= 3
  `;

  console.log('Executing query:', sql);

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ 
        error: 'Database error', 
        details: err.message 
      });
    }

    console.log('Query results:', results);

    if (results.length === 0) {
      return res.json([{
        client_id: 'N/A',
        first_name: 'No',
        last_name: 'Difficult Clients',
        request_count: 0
      }]);
    }

    res.json(results);
  });
});

// Update the this month's quotes endpoint to count total quotes
app.get('/api/quotes/month', (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) as total_quotes,
      COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_quotes,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_quotes
    FROM quotes
  `;

  console.log('Executing quotes count query:', sql);

  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error counting quotes:', err);
      return res.status(500).json({ 
        error: 'Error counting quotes',
        details: err.message 
      });
    }

    console.log('Quotes count data:', data);

    const stats = {
      total_quotes: data[0].total_quotes,
      accepted_quotes: data[0].accepted_quotes,
      pending_quotes: data[0].pending_quotes
    };

    res.json([{
      quote_id: 'TOTAL',
      first_name: 'Total',
      last_name: 'Quotes',
      counter_price: 0,
      work_start: null,
      work_end: null,
      created_at: new Date(),
      status: `${stats.total_quotes} (${stats.accepted_quotes} accepted, ${stats.pending_quotes} pending)`
    }]);
  });
});

// Add endpoint for prospective clients (registered but no requests)
app.get('/api/clients/prospective', (req, res) => {
  const sql = `
    SELECT 
      c.client_id,
      c.first_name,
      c.last_name,
      c.email
    FROM clients c
    LEFT JOIN requests r ON c.client_id = r.client_id
    WHERE r.request_id IS NULL
    ORDER BY c.first_name, c.last_name
  `;

  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching prospective clients:', err);
      return res.status(500).json({ error: 'Error fetching prospective clients' });
    }
    res.json(data);
  });
});

// Add endpoint for largest driveways
app.get('/api/driveways/largest', (req, res) => {
  const sql = `
    WITH MaxSquareFeet AS (
      SELECT MAX(square_feet) as max_feet
      FROM requests
      WHERE status = 'accepted'
    )
    SELECT 
      r.request_id,
      r.property_address,
      r.square_feet,
      c.first_name,
      c.last_name
    FROM requests r
    JOIN clients c ON r.client_id = c.client_id
    JOIN MaxSquareFeet msf ON r.square_feet = msf.max_feet
    WHERE r.status = 'accepted'
    ORDER BY r.property_address
  `;

  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching largest driveways:', err);
      return res.status(500).json({ error: 'Error fetching largest driveways' });
    }
    res.json(data);
  });
});

// Add endpoint for overdue bills (>1 week old)
app.get('/api/bills/overdue', (req, res) => {
  const sql = `
    SELECT 
      b.bill_id,
      b.amount_due,
      b.created_at,
      DATEDIFF(CURRENT_DATE(), b.created_at) as days_overdue,
      c.first_name,
      c.last_name
    FROM bills b
    JOIN orders o ON b.order_id = o.order_id
    JOIN quotes q ON o.quote_id = q.quote_id
    JOIN requests r ON q.request_id = r.request_id
    JOIN clients c ON r.client_id = c.client_id
    WHERE b.status = 'pending'
    AND DATEDIFF(CURRENT_DATE(), b.created_at) > 7
    ORDER BY days_overdue DESC
  `;

  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching overdue bills:', err);
      return res.status(500).json({ error: 'Error fetching overdue bills' });
    }
    res.json(data);
  });
});

// Add endpoint for bad clients (never paid within a week)
app.get('/api/clients/bad', (req, res) => {
  const sql = `
    SELECT DISTINCT
      c.client_id,
      c.first_name,
      c.last_name,
      COUNT(b.bill_id) as unpaid_bills
    FROM clients c
    JOIN requests r ON c.client_id = r.client_id
    JOIN quotes q ON r.request_id = q.request_id
    JOIN orders o ON q.quote_id = o.quote_id
    JOIN bills b ON o.order_id = b.order_id
    WHERE b.status = 'pending'
    AND DATEDIFF(CURRENT_DATE(), b.created_at) > 7
    GROUP BY c.client_id, c.first_name, c.last_name
    ORDER BY unpaid_bills DESC
  `;

  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching bad clients:', err);
      return res.status(500).json({ error: 'Error fetching bad clients' });
    }
    res.json(data);
  });
});

// Update the good clients endpoint
app.get('/api/clients/good', (req, res) => {
  const sql = `
    SELECT 
      c.client_id,
      c.first_name,
      c.last_name,
      COUNT(b.bill_id) as quick_payments
    FROM clients c
    JOIN requests r ON c.client_id = r.client_id
    JOIN quotes q ON r.request_id = q.request_id
    JOIN orders o ON q.quote_id = o.quote_id
    JOIN bills b ON o.order_id = b.order_id
    WHERE b.status = 'paid'
    GROUP BY c.client_id, c.first_name, c.last_name
    ORDER BY quick_payments DESC
  `;

  console.log('Executing good clients query:', sql);

  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching good clients:', err);
      console.error('SQL Error:', err);
      return res.status(500).json({ 
        error: 'Error fetching good clients',
        details: err.message 
      });
    }

    console.log('Good clients data:', data);

    // Handle empty results
    if (data.length === 0) {
      return res.json([{
        client_id: 'N/A',
        first_name: 'No',
        last_name: 'Good Clients',
        quick_payments: 0
      }]);
    }

    // Format the response
    const formattedData = data.map(client => ({
      client_id: client.client_id,
      first_name: client.first_name,
      last_name: client.last_name,
      quick_payments: parseInt(client.quick_payments)
    }));

    res.json(formattedData);
  });
});

// This should be the last line in your file
app.listen(5050, () => {
    console.log("Server is listening on port 5050.");
});
