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
    let clientID = '';
    for (let i = 0; i < 5; i++) {
        clientID += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return clientID;
};

// Registration Endpoint
app.post('/Registration', (request, response) => {
    const { firstname, lastname, address, phoneNumber, email, creditCard, password } = request.body;

    const clientID = generateClientID();

    const sql = "INSERT INTO Clients (ClientID, FirstName, LastName, Address, Phone, Email, CreditCard, Password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

    db.query(sql, [clientID, firstname, lastname, address, phoneNumber, email, creditCard, password], (err, data) => {
        if (err) {
            console.error('Error during registration:', err);
            return response.status(500).json({ error: "Error creating account", details: err.message });
        }
        return response.json({
            success: true,
            data: data,
            clientID: clientID
        });
    });
});

// Login Endpoint
app.post('/login', (request, response) => {
    const { email, password } = request.body;

    const sql = "SELECT * FROM Clients WHERE Email = ? AND Password = ?";

    db.query(sql, [email, password], (err, data) => {
        if (err) {
            console.error('Error during login:', err);
            return response.status(500).json({ error: "Error during login" });
        }

        // If user found, return the ClientID and other user data
        if (data.length > 0) {
            const client = data[0];  
            const clientID = client.ClientID;  

            console.log("Client ID extracted:", clientID);  

            return response.json({
                success: true,
                clientID: clientID,  // Send the ClientID to the frontend
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

// Requests endpoint
app.get('/api/requests', (req, res) => {
  console.log('Fetching requests...');
  const sql = `
    SELECT r.*, c.first_name, c.last_name 
    FROM requests r
    JOIN clients c ON r.client_id = c.client_id
    ORDER BY r.created_at DESC
  `;
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching requests:', err);
      return res.status(500).json({ error: 'Error fetching requests' });
    }
    console.log('Requests found:', data.length);
    res.json(data);
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
  const sql = `
    SELECT q.*, r.property_address, r.square_feet, r.proposed_price,
           c.first_name, c.last_name
    FROM quotes q
    JOIN requests r ON q.request_id = r.request_id
    JOIN clients c ON r.client_id = c.client_id
    ORDER BY q.quote_id DESC
  `;
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error fetching quotes:', err);
      return res.status(500).json({ error: 'Error fetching quotes' });
    }
    console.log('Quotes found:', data.length);
    res.json(data);
  });
});

// Add this test endpoint
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running' });
});

// Set up the web server listener
app.listen(5050, () => {
    console.log("Server is listening on port 5050.");
});
