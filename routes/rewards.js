const express = require('express');
const router = express.Router();
const { pool } = require('../db'); // 如果你使用单独的db.js文件
// 或 const { pool } = require('../app'); // 如果你将pool导出到app.js中

// 显示所有奖励物品(商城页面)
router.get('/', async (req, res) => {
  try {
    const [rewards] = await pool.query('SELECT * FROM RewardItem WHERE stock > 0');
    res.render('rewards/index', { 
      title: 'Benebook - 积分商城',
      rewards: rewards 
    });
  } catch (error) {
    console.error('获取奖励物品失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

// 获取奖励物品详情
router.get('/:id', async (req, res) => {
  try {
    const [rewards] = await pool.query('SELECT * FROM RewardItem WHERE item_id = ?', [req.params.id]);
    
    if (rewards.length === 0) {
      return res.status(404).send('未找到该奖励物品');
    }
    
    // 获取已登录用户积分信息(实际应用中需要用户登录系统)
    // 这里为演示，我们暂时获取所有捐赠者
    const [donors] = await pool.query('SELECT donor_phone, nickname, total_points FROM Donor ORDER BY total_points DESC');
    
    res.render('rewards/show', { 
      title: rewards[0].item_name,
      reward: rewards[0],
      donors: donors
    });
  } catch (error) {
    console.error('获取奖励物品详情失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

// 处理兑换请求
router.post('/redeem', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { donor_phone, item_id, quantity } = req.body;
    
    // 调用兑换存储过程
    await connection.query('CALL RedeemReward(?, ?, ?)', [donor_phone, item_id, quantity]);
    
    await connection.commit();
    
    // 重定向到兑换记录页面或奖励详情页面
    res.redirect('/redemptions');
  } catch (error) {
    await connection.rollback();
    console.error('兑换失败:', error);
    res.status(500).send('兑换失败: ' + error.message);
  } finally {
    connection.release();
  }
});

module.exports = router;