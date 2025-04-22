const express = require('express');
const router = express.Router();
const { pool } = require('../app');

// 获取所有捐赠记录
router.get('/', async (req, res) => {
  try {
    const [donations] = await pool.query(`
      SELECT d.*, b.title as book_title, dn.nickname as donor_name
      FROM Donation d
      JOIN Book b ON d.book_id = b.book_id
      JOIN Donor dn ON d.donor_phone = dn.donor_phone
      ORDER BY d.donation_time DESC
    `);
    
    res.render('donations/index', { 
      title: 'Benebook - 捐赠记录',
      donations: donations 
    });
  } catch (error) {
    console.error('获取捐赠记录失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

// 显示添加捐赠记录表单
router.get('/new', async (req, res) => {
  try {
    const [books] = await pool.query('SELECT * FROM Book');
    const [donors] = await pool.query('SELECT * FROM Donor');
    
    let selectedDonor = null;
    if (req.query.donor) {
      const [donorResult] = await pool.query('SELECT * FROM Donor WHERE donor_phone = ?', [req.query.donor]);
      if (donorResult.length > 0) {
        selectedDonor = donorResult[0];
      }
    }
    
    res.render('donations/new', { 
      title: '添加新捐赠记录',
      books,
      donors,
      selectedDonor
    });
  } catch (error) {
    console.error('获取添加捐赠表单数据失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  }
});

// 处理添加捐赠记录表单
router.post('/', async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { donor_phone, book_id, donation_quantity } = req.body;
    
    // 插入捐赠记录
    const [result] = await connection.query(
      'INSERT INTO Donation (donor_phone, book_id, donation_quantity) VALUES (?, ?, ?)',
      [donor_phone, book_id, donation_quantity]
    );
    
    const donationId = result.insertId;
    
    // 生成感谢信
    await connection.query('CALL GenerateThankYouLetter(?)', [donationId]);
    
    await connection.commit();
    
    res.redirect('/donations');
  } catch (error) {
    await connection.rollback();
    console.error('添加捐赠记录失败:', error);
    res.status(500).send('服务器错误: ' + error.message);
  } finally {
    connection.release();
  }
});

// 获取捐赠记录详情
router.get('/:id', async (req, res) => {
    try {
      const [donations] = await pool.query(`
        SELECT d.*, b.title as book_title, dn.nickname as donor_name, dn.donor_phone
        FROM Donation d
        JOIN Book b ON d.book_id = b.book_id
        JOIN Donor dn ON d.donor_phone = dn.donor_phone
        WHERE d.donation_id = ?
      `, [req.params.id]);
      
      if (donations.length === 0) {
        return res.status(404).send('未找到该捐赠记录');
      }
      
      // 获取感谢信
      const [letters] = await pool.query(`
        SELECT * FROM ThankYouLetter WHERE donation_id = ?
      `, [req.params.id]);
      
      // 确保letter对象的各属性都是数字类型
      let letter = null;
      if (letters.length > 0) {
        letter = {
          ...letters[0],
          // 确保这些属性是数字类型
          extended_lifecycle: letters[0].extended_lifecycle !== null ? Number(letters[0].extended_lifecycle) : null,
          saved_co2: letters[0].saved_co2 !== null ? Number(letters[0].saved_co2) : null,
          saved_trees: letters[0].saved_trees !== null ? Number(letters[0].saved_trees) : null,
          public_fund: letters[0].public_fund !== null ? Number(letters[0].public_fund) : null
        };
      }
      
      res.render('donations/show', { 
        title: '捐赠详情',
        donation: donations[0],
        letter
      });
    } catch (error) {
      console.error('获取捐赠详情失败:', error);
      res.status(500).send('服务器错误: ' + error.message);
    }
  });
// 生成并显示感谢信
router.get('/:id/thankyou', async (req, res) => {
    try {
      // 获取捐赠信息
      const [donations] = await pool.query(`
        SELECT d.*, b.title as book_title, dn.nickname as donor_name
        FROM Donation d
        JOIN Book b ON d.book_id = b.book_id
        JOIN Donor dn ON d.donor_phone = dn.donor_phone
        WHERE d.donation_id = ?
      `, [req.params.id]);
      
      if (donations.length === 0) {
        return res.status(404).send('未找到该捐赠记录');
      }
      
      // 获取感谢信数据
      const [letters] = await pool.query(`
        SELECT * FROM ThankYouLetter WHERE donation_id = ?
      `, [req.params.id]);
      
      if (letters.length === 0) {
        return res.status(404).send('未找到相关感谢信');
      }
      
      const donation = donations[0];
      const letter = letters[0];
      
      // 格式化数据，确保是数字类型
      const impact = {
        extendedLifecycle: Number(letter.extended_lifecycle || 0).toFixed(1),
        savedCO2: Number(letter.saved_co2 || 0).toFixed(1),
        savedTrees: Number(letter.saved_trees || 0).toFixed(1),
        publicFund: Number(letter.public_fund || 0).toFixed(2)
      };
      
      // 生成感谢信内容
      const letterContent = generateThankYouContent(donation, impact);
      
      res.render('donations/thankyou', {
        title: '感谢信',
        donation,
        impact,
        letterContent,
        currentDate: new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
      });
    } catch (error) {
      console.error('生成感谢信失败:', error);
      res.status(500).send('服务器错误: ' + error.message);
    }
  });
  
  // 感谢信内容生成函数
  function generateThankYouContent(donation, impact) {
    // 随机选择一些感谢语句和环保影响描述
    const thanksTemplates = [
      `尊敬的${donation.donor_name}：`,
      `亲爱的${donation.donor_name}：`,
      `敬爱的${donation.donor_name}爱心人士：`
    ];
    
    const introTemplates = [
      `感谢您向Benebook捐赠了${donation.donation_quantity}本《${donation.book_title}》，您的善举将为更多读者带来知识与快乐。`,
      `非常感谢您对Benebook的支持，您捐赠的${donation.donation_quantity}本《${donation.book_title}》将继续传递阅读的力量。`,
      `衷心感谢您捐赠的${donation.donation_quantity}本《${donation.book_title}》，您的慷慨为图书循环利用注入了新活力。`
    ];
    
    const impactTemplates = [
      `您的这次捐赠将帮助延长图书生命周期${impact.extendedLifecycle}年，减少碳排放${impact.savedCO2}公斤，相当于保护了${impact.savedTrees}棵树木，同时为公益基金贡献了¥${impact.publicFund}。`,
      `通过这次捐赠，您成功延长了图书的生命周期${impact.extendedLifecycle}年，减少了${impact.savedCO2}公斤的碳排放，保护了约${impact.savedTrees}棵树木，并为公益事业捐献了¥${impact.publicFund}。`,
      `您这次捐书的环保价值令人瞩目：延长了书籍生命${impact.extendedLifecycle}年，节约了${impact.savedCO2}公斤碳排放，保护了${impact.savedTrees}棵珍贵的树木，同时为公益基金增加了¥${impact.publicFund}的善款。`
    ];
    
    const closingTemplates = [
      `您的每一次捐赠都在为环保和知识传播做出重要贡献。感谢您与Benebook一起，让书籍流动起来，让知识生生不息。`,
      `每一本书都承载着智慧，每一次捐赠都传递着温暖。感谢您与Benebook同行，共同守护我们的绿色家园和知识宝库。`,
      `您的慷慨不仅传递了知识，更为我们的地球减轻了负担。Benebook感谢您的支持，期待与您继续携手，共创更美好的未来。`
    ];
    
    const signatureTemplates = [
      `此致\n环保问候\n\nBenebook团队`,
      `此致\n诚挚感谢\n\nBenebook团队`,
      `此致\n敬礼\n\nBenebook团队`
    ];
    
    // 随机选择模板
    const getRandomItem = arr => arr[Math.floor(Math.random() * arr.length)];
    
    // 组装感谢信内容
    return `${getRandomItem(thanksTemplates)}\n\n${getRandomItem(introTemplates)}\n\n${getRandomItem(impactTemplates)}\n\n${getRandomItem(closingTemplates)}\n\n${getRandomItem(signatureTemplates)}`;
  }

module.exports = router;