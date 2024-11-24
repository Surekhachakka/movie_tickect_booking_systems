const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const path = require('path');
const session = require('express-session');
const fetch = require('node-fetch'); // Required for sending HTTP requests

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configure session middleware
app.use(session({
    secret: 'your_secret_key', // Replace with your secret key
    resave: false,
    saveUninitialized: true
}));

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '211104',
    database: 'signup'
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1); // Exit the application if unable to connect to the database
    }
    console.log('Connected to MySQL');
});

function authenticate(req, res, next) {
    // Check if user is authenticated
    if (req.session && req.session.user) {
        // User is authenticated, set user details in req.user
        req.user = req.session.user;
        next();
    } else {
        // User is not authenticated, redirect to login page
        res.redirect('/login.html');
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    const sql = `INSERT INTO users (username, email, password) VALUES (?, ?, ?)`;
    connection.query(sql, [username, email, password], (err, result) => {
        if (err) {
            console.error('Error signing up user:', err);
            return res.status(500).send('Error signing up user');
        }
        console.log('User signed up successfully');

        // Set user details in session
        req.session.user = { username, email };

        // Redirect to home.html after successful signup
        res.redirect('/home.html');
    });
});

app.post('/signin', (req, res) => {
    const { email, password } = req.body;
    const sql = `SELECT * FROM users WHERE email = ? AND password = ?`;
    connection.query(sql, [email, password], (err, results) => {
        if (err) {
            console.error('Error retrieving user from database:', err);
            return res.status(500).send('Error retrieving user from database');
        }

        if (results.length === 1) {
            // Set user details in session upon successful signin
            req.session.user = results[0];
            res.redirect('/home.html');
        } else {
            // User does not exist or credentials are incorrect
            res.status(401).send('User does not exist or invalid credentials');
        }
    });
});

// Route to fetch user details (protected route)
app.get('/user-details', authenticate, (req, res) => {
    // Retrieve user details from req.user
    const userDetails = req.user;
    res.json(userDetails);
});

// Mock endpoint for processing UPI transactions
app.post('/api/processUPITransaction', (req, res) => {
    const { upiId, amount, upiApp } = req.body;
    if (upiId && amount && upiApp) {
        // Mock successful transaction response
        const response = {
            status: 'success',
            message: 'UPI transaction processed successfully',
            transactionId: 'MOCK987654321'
        };

        // Send message to the UPI app
        sendMessageToUPIApp(upiId, amount, upiApp);

        res.json(response);
    } else {
        res.status(400).json({ error: 'Invalid request' });
    }
});

// Mock endpoint for processing credit card transactions
app.post('/api/processCreditCardTransaction', (req, res) => {
    const { cardNumber, nameOnCard, expirationDate, cvv, amount, phoneNumber } = req.body;
    if (cardNumber && nameOnCard && expirationDate && cvv && amount && phoneNumber) {
        // Mock successful transaction response
        const response = {
            status: 'success',
            message: 'Credit card transaction processed successfully',
            transactionId: 'MOCK123456789'
        };

        // Send message to the phone number
        sendMessageToPhoneNumber(phoneNumber, amount);

        res.json(response);
    } else {
        res.status(400).json({ error: 'Invalid request' });
    }
});

// Function to send message to the UPI app
function sendMessageToUPIApp(upiId, amount, upiApp) {
    // Logic to send message to the UPI app (mocked for demonstration)
    console.log(`Message sent to ${upiApp} with UPI ID: ${upiId} for amount: ${amount}`);
}

// Function to send message to the phone number
function sendMessageToPhoneNumber(phoneNumber, amount) {
    // Logic to send message to the phone number (mocked for demonstration)
    console.log(`Message sent to ${phoneNumber} for payment of amount: ${amount}`);
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
