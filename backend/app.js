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
    database: 'project 2',
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

    const photoPaths = req.files ? req.files.map(file => file.filename) : [];

    if (!property_address || !square_feet || !proposed_price) {
        // Remove uploaded files if validation fails
        photoPaths.forEach(photo => {
            const filePath = path.join(__dirname, 'uploads', photo);
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error removing file:', err);
            });
        });

        return res.status(400).json({
            success: false,
            error: 'Missing required fields: property_address, square_feet, or proposed_price',
        });
    }


    if (isNaN(proposed_price)) {
        // Remove uploaded files if proposed price is invalid
        photoPaths.forEach(photo => {
            const filePath = path.join(__dirname, 'uploads', photo);
            fs.unlink(filePath, (err) => {
                if (err) console.error('Error removing file:', err);
            });
        });

        return res.status(400).json({
            success: false,
            error: 'Invalid proposed_price value',
        });
    }


    const sql = `
        INSERT INTO Requests (
            client_id,
            property_address,
            square_feet,
            proposed_price,
            note,
            status,
            created_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
        client_id,
        property_address,
        square_feet,
        parseFloat(proposed_price),
        note,
        'pending',
    ];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Error inserting quote request:', err);

            photoPaths.forEach(photo => {
                const filePath = path.join(__dirname, 'uploads', photo);
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error removing file:', err);
                });
            });

            return res.status(500).json({
                success: false,
                error: 'Failed to submit quote request',
                details: err.message,  
            });
        }

        res.status(201).json({
            success: true,
            message: 'Quote request submitted successfully',
            quoteId: result.insertId,
            photos: photoPaths 
        });
    });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/requests', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM Requests ORDER BY created_at DESC');
        console.log('Query result:', result); 
        
        const rows = result[0]; 

        if (!rows || rows.length === 0) {
            console.log('No requests found.');
            return res.json({ success: true, requests: [] });
        }

        res.json({ success: true, requests: rows });
    } catch (err) {
        console.error('Error fetching requests:', err.message, err.stack);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve requests',
            details: err.message
        });
    }
});

  
// Requests endpoint
app.get('/api/requests', (req, res) => {
  console.log('Fetching requests...');
  const sql = `
    SELECT 
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
    FROM requests r
    LEFT JOIN clients c ON r.client_id = c.client_id
    ORDER BY r.created_at DESC
  `;
  console.log('Executing SQL:', sql);
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching requests:', err);
      return res.status(500).json({ error: 'Error fetching requests' });
    }
    console.log('Raw request data:', data);
    
    // Get photos in a separate query
    const getPhotos = async (requestId) => {
      return new Promise((resolve, reject) => {
        const photoSql = `
          SELECT photo_path 
          FROM request_photos 
          WHERE request_id = ?
        `;
        db.query(photoSql, [requestId], (err, photoData) => {
          if (err) {
            console.error('Error fetching photos:', err);
            resolve([]);
          } else {
            resolve(photoData.map(p => p.photo_path));
          }
        });
      });
    };

    // Format the data to ensure status is correct and handle nulls
    Promise.all(data.map(async request => {
      const photos = await getPhotos(request.request_id);
      return {
        ...request,
        first_name: request.first_name || 'Unknown',
        last_name: request.last_name || 'Client',
        status: request.status?.toLowerCase() || 'pending',
        photos: photos
      };
    })).then(formattedData => {
      console.log('Formatted request data:', formattedData);
      res.json(formattedData);
    }).catch(error => {
      console.error('Error formatting data:', error);
      res.status(500).json({ error: 'Error processing requests' });
    });
  });
});

// Bills endpoint
app.get('/api/bills', (req, res) => {
  console.log('Bills endpoint hit');
  const sql = `
    SELECT * FROM bills 
    ORDER BY bill_id DESC
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
      status
    FROM orders
    ORDER BY order_id DESC
  `;
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Order fetch error:', {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sqlMessage: err.sqlMessage,
        sqlState: err.sqlState,
        sql: err.sql
      });
      return res.status(500).json({ 
        error: 'Error fetching orders',
        details: err.message 
      });
    }

    try {
      console.log('Raw orders data:', data);
      
      const formattedData = data.map(order => {
        try {
          return {
            order_id: order.order_id,
            quote_id: order.quote_id,
            work_start: order.work_start ? new Date(order.work_start).toISOString() : null,
            work_end: order.work_end ? new Date(order.work_end).toISOString() : null,
            final_price: order.final_price || 0,
            status: order.status || 'pending'
          };
        } catch (formatError) {
          console.error('Error formatting order:', order, formatError);
          return null;
        }
      }).filter(Boolean);

      console.log('Formatted orders data:', formattedData);
      res.json(formattedData);
    } catch (formatError) {
      console.error('Error formatting orders data:', formatError);
      return res.status(500).json({ 
        error: 'Error processing orders data',
        details: formatError.message 
      });
    }
  });
});

// Quotes endpoint
app.get('/api/quotes', (req, res) => {
  console.log('Fetching quotes...');
  db.ping((err) => {
    if (err) {
      console.error('Database connection error:', err);
    } else {
      console.log('Database connection is alive');
    }
  });

  const sql = `
    SELECT 
      q.quote_id,
      q.request_id,
      q.counter_price,
      q.work_start,
      q.work_end,
      q.status,
      q.note,
      q.created_at
    FROM quotes q
    ORDER BY q.created_at DESC, q.quote_id DESC
  `;
  
  console.log('Executing quotes query:', sql);
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching quotes:', err);
      console.error('SQL Error details:', err);
      return res.status(500).json({ error: 'Error fetching quotes' });
    }
    
    console.log('Raw quotes data before formatting:', data);
    console.log('Number of quotes found:', data.length);
    
    if (data.length === 0) {
      db.query('SELECT COUNT(*) as count FROM quotes', (err, countResult) => {
        if (err) {
          console.error('Error counting quotes:', err);
        } else {
          console.log('Total quotes in database:', countResult[0].count);
        }
      });
    }
    
    // Format the data to handle nulls
    const formattedData = data.map(quote => ({
      ...quote,
      status: quote.status || 'pending',
      counter_price: quote.counter_price || 0,
      work_start: quote.work_start || null,
      work_end: quote.work_end || null,
      note: quote.note || ''
    }));

    console.log('Formatted quotes data:', formattedData);
    console.log('Number of formatted quotes:', formattedData.length);
    res.json(formattedData);
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

// Set up the web server listener
app.listen(5050, () => {
    console.log("Server is listening on port 5050.");
});
