// Backend: application services, accessible by URIs


const express = require('express')
const cors = require ('cors')
const dotenv = require('dotenv')
dotenv.config()

const app = express();

const dbService = require('./dbService');

const mysql = require('mysql');
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "project 2",
    port: 3306
});

// Handle disconnects
function handleDisconnect() {
  db.on('error', function(err) {
    console.log('Database error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

// Test database connection
db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        return;
    }
    console.log('Connected to database');
});

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: false}));

const generateClientID = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let clientID = '';
  for (let i = 0; i < 5; i++) {
      clientID += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return clientID;
}

app.post('/Registration', (request, response) => {
  const { firstname, lastname, address, phoneNumber, email, creditCard, password } = request.body;

  const clientID = generateClientID();

  const sql = "INSERT INTO Clients (ClientID, FirstName, LastName, Address, Phone, Email, CreditCard, Password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(sql, [clientID, firstname, lastname, address, phoneNumber, email, creditCard, password], (err, data) => {
      if (err) {
          console.error(err);
          return response.status(500).json({ error: "Error creating account" });
      }
      return response.json({ success: true, data: data });
  });
});

app.post('/login', (request, response) => {
  const sql = "SELECT * FROM Clients WHERE Email = ? AND Password = ?";
  
  db.query(sql, [request.body.email, request.body.password], (err, data) => {
      if (err) {
          console.error(err);
          return response.status(500).json({ error: "Error during login" });
      }
      if (data.length > 0) {
          return response.json({ success: true, user: data[0] });
      } else {
          return response.json({ success: false });
      }
  });
});


app.post('/insert', (request, response) => {
    console.log("app: insert a row.");
    // console.log(request.body); 

    const {name} = request.body;
    const db = dbService.getDbServiceInstance();

    const result = db.insertNewName(name);
 
    // note that result is a promise
    result 
    .then(data => response.json({data: data})) // return the newly added row to frontend, which will show it
   // .then(data => console.log({data: data})) // debug first before return by response
   .catch(err => console.log(err));
});




// read 
app.get('/getAll', (request, response) => {
    const db = dbService.getDbServiceInstance();
    const result = db.getAllData();
    
    result
    .then(data => response.json({data: data}))
    .catch(err => console.log(err));
});


app.get('/search/:term', (request, response) => {
    const {term} = request.params;
    const db = dbService.getDbServiceInstance();
    
    const result = term === "all" ? db.getAllData() : db.searchUsers(term);
    
    result
    .then(data => response.json({data: data}))
    .catch(err => console.log(err));
});


// update
app.patch('/update', (request, response) => {
    console.log("app: update is called");
    const { id, userData } = request.body;
    console.log('Update request:', { id, userData });
    
    const db = dbService.getDbServiceInstance();
    const result = db.updateUserById(id, userData);

    result
    .then(data => response.json({success: true}))
    .catch(err => console.log(err)); 
});

// delete service
app.delete('/delete/:id', 
     (request, response) => {     
        const {id} = request.params;
        console.log("delete");
        console.log(id);
        const db = dbService.getDbServiceInstance();

        const result = db.deleteRowById(id);

        result.then(data => response.json({success: true}))
        .catch(err => console.log(err));
     }
)   

// debug function, will be deleted later
app.post('/debug', (request, response) => {
    // console.log(request.body); 

    const {debug} = request.body;
    console.log(debug);

    return response.json({success: true});
});   

// debug function: use http://localhost:5050/testdb to try a DB function
// should be deleted finally
app.get('/testdb', (request, response) => {
    
    const db = dbService.getDbServiceInstance();

    
    const result =  db.deleteById("14"); // call a DB function here, change it to the one you want

    result
    .then(data => response.json({data: data}))
    .catch(err => console.log(err));
});

// Add these quote-related endpoints
app.get('/api/quotes', (req, res) => {
  const sql = `
    SELECT q.quote_id, q.request_id, q.counter_price, 
           q.work_start, q.work_end, q.note, q.status, 
           q.created_at, c.first_name, c.last_name, c.email,
           r.property_address, r.square_feet, r.proposed_price
    FROM quotes q
    JOIN requests r ON q.request_id = r.request_id
    JOIN clients c ON r.client_id = c.client_id
    ORDER BY q.created_at DESC
  `;
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error fetching quotes' });
    }
    res.json(data);
  });
});

app.post('/api/quotes/:id/respond', (req, res) => {
  const { id } = req.params;
  const { status, note, counter_price, work_start, work_end } = req.body;
  
  const sql = `
    UPDATE quotes 
    SET status = ?,
        note = ?,
        counter_price = ?,
        work_start = ?,
        work_end = ?,
        created_at = CURRENT_TIMESTAMP
    WHERE quote_id = ?
  `;
  
  db.query(sql, [status, note, counter_price, work_start, work_end, id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error updating quote' });
    }
    res.json({ success: true });
  });
});

// Add bills endpoint
app.get('/api/bills', (req, res) => {
  const sql = `
    SELECT b.bill_id, b.order_id, b.amount_due, b.status, b.created_at
    FROM bills b
    ORDER BY b.created_at DESC
  `;
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('MySQL Error:', {
        code: err.code,
        errno: err.errno,
        sqlMessage: err.sqlMessage,
        sqlState: err.sqlState,
        sql: err.sql
      });
      return res.status(500).json({ error: 'Error fetching bills' });
    }
    if (!data || data.length === 0) {
      console.log('No bills found');
      return res.json([]);
    }
    console.log('Bills data:', data);
    res.json(data);
  });
});

// Add orders endpoint
app.get('/api/orders', (req, res) => {
  const sql = `
    SELECT o.order_id, o.quote_id, o.work_start, o.work_end, 
           o.final_price, o.status, q.request_id
    FROM orders o
    LEFT JOIN quotes q ON o.quote_id = q.quote_id
    ORDER BY o.work_start DESC;
  `;
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error in /api/orders:', err);
      return res.status(500).json({ error: 'Error fetching orders' });
    }
    if (!data || data.length === 0) {
      return res.json([]);
    }
    res.json(data);
  });
});

// Add quote requests endpoint
app.get('/api/requests', (req, res) => {
  const sql = `
    SELECT r.request_id, r.client_id, r.property_address, 
           r.square_feet, r.proposed_price, r.note, 
           r.status, r.created_at,
           c.first_name, c.last_name, c.email,
           (
             SELECT GROUP_CONCAT(photo_path)
             FROM request_photos rp2
             WHERE rp2.request_id = r.request_id
           ) as photos
    FROM requests r
    JOIN clients c ON r.client_id = c.client_id
    ORDER BY r.created_at DESC
  `;
  
  db.query(sql, (err, data) => {
    if (err) {
      console.error('Error in /api/requests:', err);
      return res.status(500).json({ error: 'Error fetching requests' });
    }
    console.log('Requests data:', data);
    res.json(data);
  });
});

// Add endpoint to create a new quote from a request
app.post('/api/requests/:id/quote', (req, res) => {
  const { id } = req.params;
  
  const sql = `
    INSERT INTO quotes (request_id, status, created_at)
    VALUES (?, 'pending', CURRENT_TIMESTAMP)
  `;
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Error creating quote:', err);
      return res.status(500).json({ error: 'Error creating quote' });
    }
    
    // Update request status
    const updateSql = `
      UPDATE requests 
      SET status = 'accepted'
      WHERE request_id = ?
    `;
    
    db.query(updateSql, [id], (updateErr) => {
      if (updateErr) {
        console.error('Error updating request:', updateErr);
        return res.status(500).json({ error: 'Error updating request' });
      }
      res.json({ success: true, quote_id: result.insertId });
    });
  });
});

// set up the web server listener
// if we use .env to configure
/*
app.listen(process.env.PORT, 
    () => {
        console.log("I am listening on the configured port " + process.env.PORT)
    }
);
*/

// if we configure here directly
app.listen(5050, 
    () => {
        console.log("I am listening on the fixed port 5050.")
    }
);
