const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// Set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Add middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'lcdk6666', // Your MySQL password
  database: 'benebook',
  waitForConnections: true,
  connectionLimit: 10
});

// Export pool first, ensuring other modules can use it when imported
module.exports = { pool };

// Import route modules
const booksRouter = require('./routes/books');
const donorsRouter = require('./routes/donors');
const donationsRouter = require('./routes/donations');
const chatRouter = require('./routes/chat');

// Use routes
app.get('/', async (req, res) => {
    try {
      const [books] = await pool.query('SELECT * FROM Book');
      res.render('index', { 
        title: 'Benebook - Book List',
        books: books 
      });
    } catch (error) {
      console.error('Failed to get books:', error);
      res.status(500).send('Server error: ' + error.message);
    }
  });
  
  app.use('/book', booksRouter);
  app.use('/donors', donorsRouter);
  app.use('/donations', donationsRouter);

// Other routes
const rewardsRouter = require('./routes/rewards');
const redemptionsRouter = require('./routes/redemptions');

app.use('/rewards', rewardsRouter);
app.use('/redemptions', redemptionsRouter);
app.use('/api/chat', chatRouter); // Add chat API route

// Start server (last step)
app.listen(port, () => {
  console.log(`Server started: http://localhost:${port}`);
});