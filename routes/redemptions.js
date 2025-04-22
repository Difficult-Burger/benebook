const express = require('express');
const router = express.Router();
const { pool } = require('../db'); // 或 app.js

// 获取所有兑换记录
router.get('/', async (req, res) => {
  try {
    const [redemptions] = await pool.query(`
      SELECT r.*, d.nickname as donor_name, i.item_name, i.image_url, i.required_points
      FROM Redemption r
      JOIN Donor d ON r.donor_phone = d.donor_phone
      JOIN RewardItem i ON r.item_id = i.item_id
      ORDER BY r.redeem_time DESC
    `);
    
    res.render('redemptions/index', { 
      title: 'Benebook - 兑换记录',
      redemptions: redemptions 
    });
  } catch (error) {
    console.error('获取兑换记录失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

// 获取特定捐赠者的兑换记录
router.get('/donor/:phone', async (req, res) => {
  try {
    const [redemptions] = await pool.query(`
      SELECT r.*, i.item_name, i.image_url, i.required_points
      FROM Redemption r
      JOIN RewardItem i ON r.item_id = i.item_id
      WHERE r.donor_phone = ?
      ORDER BY r.redeem_time DESC
    `, [req.params.phone]);
    
    // 获取捐赠者信息
    const [donors] = await pool.query('SELECT * FROM Donor WHERE donor_phone = ?', [req.params.phone]);
    
    if (donors.length === 0) {
      return res.status(404).send('未找到该捐赠者');
    }
    
    res.render('redemptions/donor', { 
      title: `${donors[0].nickname} 的兑换记录`,
      redemptions: redemptions,
      donor: donors[0]
    });
  } catch (error) {
    console.error('获取捐赠者兑换记录失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

module.exports = router;