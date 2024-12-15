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

// Database connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database:', err);
        return;
    }
    console.log('Connected to the database');
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


// Set up the web server listener
app.listen(5050, () => {
    console.log("Server is listening on port 5050.");
});
