const express = require('express');
const router = express.Router();
const { pool } = require('../app');

// 获取所有捐赠者
router.get('/', async (req, res) => {
  try {
    const [donors] = await pool.query('SELECT * FROM Donor');
    res.render('donors/index', { 
      title: 'Benebook - 捐赠者列表',
      donors: donors 
    });
  } catch (error) {
    console.error('获取捐赠者失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

// 显示添加捐赠者表单
router.get('/new', (req, res) => {
  res.render('donors/new', { title: '添加新捐赠者' });
});

// 处理添加捐赠者表单
router.post('/', async (req, res) => {
  try {
    const { donor_phone, email, nickname, wechat_id } = req.body;
    
    await pool.query(
      'INSERT INTO Donor (donor_phone, email, nickname, wechat_id) VALUES (?, ?, ?, ?)',
      [donor_phone, email, nickname, wechat_id]
    );
    
    res.redirect('/donors');
  } catch (error) {
    console.error('添加捐赠者失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

// 获取捐赠者详情
router.get('/:phone', async (req, res) => {
  try {
    const [donors] = await pool.query('SELECT * FROM Donor WHERE donor_phone = ?', [req.params.phone]);
    
    if (donors.length === 0) {
      return res.status(404).send('未找到该捐赠者');
    }
    
    // 获取该捐赠者的捐赠记录
    const [donations] = await pool.query(`
      SELECT d.*, b.title as book_title 
      FROM Donation d 
      JOIN Book b ON d.book_id = b.book_id 
      WHERE d.donor_phone = ?
    `, [req.params.phone]);
    
    res.render('donors/show', { 
      title: donors[0].nickname,
      donor: donors[0],
      donations: donations
    });
  } catch (error) {
    console.error('获取捐赠者详情失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

module.exports = router;