const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// 设置视图引擎
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// 添加中间件
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'lcdk6666', // 你的MySQL密码
  database: 'benebook',
  waitForConnections: true,
  connectionLimit: 10
});

// 先导出pool，确保其他模块导入时能够使用
module.exports = { pool };

// 引入路由模块
const booksRouter = require('./routes/books');
const donorsRouter = require('./routes/donors');
const donationsRouter = require('./routes/donations');
const chatRouter = require('./routes/chat');

// 使用路由
app.get('/', async (req, res) => {
    try {
      const [books] = await pool.query('SELECT * FROM Book');
      res.render('index', { 
        title: 'Benebook - 书籍列表',
        books: books 
      });
    } catch (error) {
      console.error('获取书籍失败:', error);
      res.status(500).send('服务器错误: ' + error.message);
    }
  });
  
  app.use('/book', booksRouter);
  app.use('/donors', donorsRouter);
  app.use('/donations', donationsRouter);

// 其他路由
const rewardsRouter = require('./routes/rewards');
const redemptionsRouter = require('./routes/redemptions');

app.use('/rewards', rewardsRouter);
app.use('/redemptions', redemptionsRouter);
app.use('/api/chat', chatRouter); // 添加聊天API路由

// 启动服务器（最后一步）
app.listen(port, () => {
  console.log(`服务器已启动: http://localhost:${port}`);
});