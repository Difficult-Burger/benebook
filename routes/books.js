const express = require('express');
const router = express.Router();
const { pool } = require('../app');

// 获取所有书籍
router.get('/', async (req, res) => {
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

// 获取书籍详情
router.get('/:id', async (req, res) => {
  try {
    const [books] = await pool.query('SELECT * FROM Book WHERE book_id = ?', [req.params.id]);
    
    if (books.length === 0) {
      return res.status(404).send('未找到该书籍');
    }
    
    res.render('book', { 
      title: books[0].title,
      book: books[0] 
    });
  } catch (error) {
    console.error('获取书籍详情失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

module.exports = router;