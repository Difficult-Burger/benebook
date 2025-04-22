const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const axios = require('axios');

// DeepSeek API 配置
const DEEPSEEK_API_KEY = 'sk-95f78a6e048745e2801755a7b79f9cf2';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// 存储聊天历史
let chatHistory = [];

// 检查消息是否为数据请求
function isDataRequest(message) {
  console.log("正在判断是否为数据请求:", message);
  
  // 首先检查是否是明确的闲聊问题
  const chatPatterns = [
    /什么好处/i, /有什么用/i, /怎么样/i, /如何操作/i, /为什么要/i, 
    /可以吗/i, /能不能/i, /是不是/i, /介绍一下/i, /说明一下/i, 
    /解释一下/i, /帮助我/i, /请问你/i, /谢谢/i, /你好/i, /你是谁/i
  ];
  
  // 如果匹配到闲聊模式，直接返回false
  if (chatPatterns.some(pattern => pattern.test(message))) {
    console.log("匹配到闲聊模式");
    return false;
  }
  
  // 明确的数据查询模式（优先级最高）
  const clearDataQueryPatterns = [
    // 书籍相关查询
    /查询.*书/i, /显示.*书/i, /列出.*书/i, /找.*书/i,
    /查询.*价格/i, /最贵的/i, /最便宜的/i, /平均价格/i,
    /统计.*分类/i, /统计.*类别/i, /分类的书/i, 
    /多少本书/i, /哪些书/i, /哪本书/i, /哪几本/i,
    
    // 作者相关查询
    /列出.*作品/i, /显示.*作品/i, /查询.*作品/i, /查找.*作品/i,
    /.*的书/i, /.*的作品/i, /.*写的/i, /.*著作/i,
    
    // 捐赠者相关查询
    /哪位捐赠者/i, /哪个捐赠者/i, /捐赠者.*最多/i, /捐赠.*最多/i,
    /贡献.*最多/i, /贡献.*书籍/i, /捐赠量/i, /捐赠.*排名/i,
    /谁捐赠/i, /谁的捐赠/i, /谁贡献/i, /捐赠者.*排行/i,
    /积分最多/i, /积分.*排名/i, /哪位.*积分/i,
    
    // 捐赠和兑换记录查询
    /查询.*捐赠/i, /显示.*捐赠/i, /捐赠了.*书/i, /捐赠.*记录/i,
    /兑换.*记录/i, /兑换了.*什么/i, /兑换.*最多/i, /兑换.*排名/i
  ];
  
  // 如果明确匹配数据查询模式，直接返回true
  if (clearDataQueryPatterns.some(pattern => pattern.test(message))) {
    console.log("匹配到明确的数据查询模式");
    return true;
  }
  
  // 然后检查是否包含数据查询关键词
  const dataActionPatterns = [
    /查询/i, /显示/i, /列出/i, /找出/i, /统计/i, /计算/i, 
    /多少/i, /有哪些/i, /最多/i, /最大/i, /最少/i, /最小/i,
    /最贵/i, /最便宜/i, /平均/i, /总共/i, /哪位/i, /哪个/i, /谁/i
  ];
  
  const dataObjectPatterns = [
    /数据库/i, /表格/i, /信息/i, /记录/i, /几本/i, 
    /书籍/i, /书/i, /捐赠记录/i, /兑换记录/i, /积分/i,
    /价格/i, /作者/i, /分类/i, /类别/i, /出版社/i,
    /捐赠者/i, /捐赠/i, /贡献/i, /兑换/i, /作品/i
  ];
  
  // 同时包含动作词和对象词更可能是数据请求
  const isDataQuery = dataActionPatterns.some(pattern => pattern.test(message)) && 
         dataObjectPatterns.some(pattern => pattern.test(message));
         
  console.log(`动作词匹配: ${dataActionPatterns.some(pattern => pattern.test(message))}`);
  console.log(`对象词匹配: ${dataObjectPatterns.some(pattern => pattern.test(message))}`);
  console.log(`最终判断为数据请求: ${isDataQuery}`);
  
  return isDataQuery;
}

// 构建数据请求的 prompt
function buildDataRequestPrompt(message) {
  return `你是一个数据库专家，需要根据用户的自然语言请求生成一个准确的SQL查询语句。

数据库是MySQL，包含以下表结构：

1. Book表 - 存储书籍信息
\`\`\`sql
CREATE TABLE Book (
  book_id int NOT NULL AUTO_INCREMENT,
  title varchar(255) NOT NULL,
  author varchar(100) DEFAULT NULL,
  publisher varchar(100) DEFAULT NULL,
  category varchar(50) DEFAULT NULL,
  image_url varchar(255) DEFAULT NULL,
  location varchar(50) DEFAULT NULL,
  original_price decimal(10,2) NOT NULL,
  condition_ratio decimal(3,2) DEFAULT '1.00',
  unsold_count int DEFAULT '0',
  PRIMARY KEY (book_id)
)
\`\`\`

2. Donor表 - 存储捐赠者信息
\`\`\`sql
CREATE TABLE Donor (
  donor_phone varchar(20) NOT NULL,
  email varchar(255) DEFAULT NULL,
  nickname varchar(50) NOT NULL,
  wechat_id varchar(50) DEFAULT NULL,
  payment_qr varchar(255) DEFAULT NULL,
  total_points int DEFAULT '0',
  PRIMARY KEY (donor_phone)
)
\`\`\`

3. Donation表 - 存储捐赠记录
\`\`\`sql
CREATE TABLE Donation (
  donation_id int NOT NULL AUTO_INCREMENT,
  donor_phone varchar(20) NOT NULL,
  book_id int NOT NULL,
  donation_quantity int NOT NULL,
  donation_time timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (donation_id),
  FOREIGN KEY (donor_phone) REFERENCES Donor (donor_phone),
  FOREIGN KEY (book_id) REFERENCES Book (book_id)
)
\`\`\`

4. RewardItem表 - 存储奖励商品信息
\`\`\`sql
CREATE TABLE RewardItem (
  item_id int NOT NULL AUTO_INCREMENT,
  item_name varchar(255) NOT NULL,
  image_url varchar(255) DEFAULT NULL,
  required_points int NOT NULL,
  stock int DEFAULT '0',
  redeemed_count int DEFAULT '0',
  PRIMARY KEY (item_id)
)
\`\`\`

5. Redemption表 - 存储兑换记录
\`\`\`sql
CREATE TABLE Redemption (
  redemption_id int NOT NULL AUTO_INCREMENT,
  donor_phone varchar(20) NOT NULL,
  item_id int NOT NULL,
  redeem_quantity int NOT NULL,
  redeem_time timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (redemption_id),
  FOREIGN KEY (donor_phone) REFERENCES Donor (donor_phone),
  FOREIGN KEY (item_id) REFERENCES RewardItem (item_id)
)
\`\`\`

用户请求: "${message}"

只返回一个有效的SQL查询语句，不要包含任何其他解释或文本。确保SQL语句语法正确且可以直接执行。`;
}

// 构建闲聊的 prompt
function buildChatPrompt(message, history) {
  const historyText = history.map(item => `${item.role === 'user' ? '用户' : '助手'}: ${item.content}`).join('\n');
  
  return `你是Benebook网站的智能助手，专门帮助用户了解关于我们书籍捐赠和积分兑换平台的信息。
  
对话历史:
${historyText}

用户: ${message}

请尽可能友好和专业地回答用户的问题。`;
}

// 处理聊天消息的API接口
router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }
    
    // 添加用户消息到历史
    chatHistory.push({ role: 'user', content: message });
    
    // 判断是数据请求还是闲聊
    const isDataReq = isDataRequest(message);
    
    // 构建适当的prompt
    const prompt = isDataReq 
      ? buildDataRequestPrompt(message) 
      : buildChatPrompt(message, chatHistory);
    
    console.log("发送到DeepSeek的prompt:", prompt);

    // 调用DeepSeek API
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }]
      },
      {
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const aiResponse = response.data.choices[0].message.content;
    console.log("DeepSeek返回:", aiResponse);
    
    // 如果是数据请求，执行SQL查询
    if (isDataReq) {
      try {
        // 提取SQL语句，去除可能的代码块标记
        let sqlQuery = aiResponse.trim();
        if (sqlQuery.startsWith('```sql')) {
          sqlQuery = sqlQuery.replace(/```sql\n/, '').replace(/\n```$/, '');
        } else if (sqlQuery.startsWith('```')) {
          sqlQuery = sqlQuery.replace(/```\n/, '').replace(/\n```$/, '');
        }
        
        console.log("执行SQL查询:", sqlQuery);
        
        // 执行SQL查询
        const [results] = await pool.query(sqlQuery);
        
        console.log("查询结果:", results);
        
        // 格式化结果为用户友好的格式
        let formattedResponse = '';
        
        if (results.length === 0) {
          formattedResponse = '抱歉，没有找到符合条件的数据。';
        } else {
          // 根据查询类型和结果格式化响应
          if (sqlQuery.toUpperCase().includes('GROUP BY')) {
            // 分组聚合查询
            formattedResponse = '查询结果：\n\n';
            results.forEach((row, index) => {
              const keys = Object.keys(row);
              // 第一个字段通常是分组的键(如category)
              const groupKey = keys[0];
              const groupValue = row[groupKey];
              
              formattedResponse += `${groupValue}\n`;
              
              // 添加其他字段（通常是聚合结果）
              keys.slice(1).forEach(key => {
                const value = row[key];
                // 如果是价格字段，添加货币符号
                if (key.includes('price') || key.includes('avg') || key.includes('sum')) {
                  formattedResponse += `   ${key}: ¥${parseFloat(value).toFixed(2)}\n`;
                } else {
                  formattedResponse += `   ${key}: ${value}\n`;
                }
              });
              formattedResponse += '\n';
            });
          } else if (sqlQuery.toUpperCase().includes('COUNT')) {
            // 聚合查询（计数）
            const countKey = Object.keys(results[0])[0];
            const countValue = results[0][countKey];
            formattedResponse = `查询结果：${countValue}`;
          } else if (sqlQuery.toUpperCase().includes('AVG') || 
                   sqlQuery.toUpperCase().includes('SUM') || 
                   sqlQuery.toUpperCase().includes('MAX') || 
                   sqlQuery.toUpperCase().includes('MIN')) {
            // 其他聚合查询
            const aggregateKey = Object.keys(results[0])[0];
            const aggregateValue = results[0][aggregateKey];
            formattedResponse = `查询结果：${aggregateValue}`;
          } else if (sqlQuery.toUpperCase().includes('BOOK') && 
                   (sqlQuery.toUpperCase().includes('SELECT *') || 
                    sqlQuery.toUpperCase().includes('TITLE'))) {
            // 书籍相关查询
            formattedResponse = '查询结果：\n\n';
            results.forEach((book, index) => {
              formattedResponse += `${index + 1}. 《${book.title}》\n`;
              if (book.author) formattedResponse += `   作者：${book.author}\n`;
              if (book.category) formattedResponse += `   分类：${book.category}\n`;
              if (book.publisher) formattedResponse += `   出版社：${book.publisher}\n`;
              if (book.original_price) formattedResponse += `   价格：¥${book.original_price}\n`;
              formattedResponse += '\n';
            });
          } else if (sqlQuery.toUpperCase().includes('DONOR')) {
            // 捐赠者相关查询
            formattedResponse = '查询结果：\n\n';
            results.forEach((donor, index) => {
              formattedResponse += `${index + 1}. ${donor.nickname}\n`;
              if (donor.total_points !== undefined) formattedResponse += `   积分：${donor.total_points}\n`;
              if (donor.email) formattedResponse += `   邮箱：${donor.email}\n`;
              formattedResponse += '\n';
            });
          } else if (sqlQuery.toUpperCase().includes('DONATION')) {
            // 捐赠记录相关查询
            formattedResponse = '查询结果：\n\n';
            results.forEach((donation, index) => {
              formattedResponse += `${index + 1}. 捐赠ID：${donation.donation_id}\n`;
              if (donation.donor_phone) formattedResponse += `   捐赠者：${donation.donor_phone}\n`;
              if (donation.book_id) formattedResponse += `   书籍ID：${donation.book_id}\n`;
              if (donation.donation_quantity) formattedResponse += `   数量：${donation.donation_quantity}\n`;
              if (donation.donation_time) {
                const date = new Date(donation.donation_time);
                formattedResponse += `   时间：${date.toLocaleString('zh-CN')}\n`;
              }
              formattedResponse += '\n';
            });
          } else if (sqlQuery.toUpperCase().includes('REWARD')) {
            // 奖励相关查询
            formattedResponse = '查询结果：\n\n';
            results.forEach((reward, index) => {
              formattedResponse += `${index + 1}. ${reward.item_name || '奖品'}\n`;
              if (reward.required_points) formattedResponse += `   所需积分：${reward.required_points}\n`;
              if (reward.stock) formattedResponse += `   库存：${reward.stock}\n`;
              formattedResponse += '\n';
            });
          } else {
            // 其他类型查询，通用格式化
            formattedResponse = '查询结果：\n\n';
            results.forEach((item, index) => {
              formattedResponse += `项目 ${index + 1}:\n`;
              Object.entries(item).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                  // 格式化日期类型
                  if (value instanceof Date) {
                    formattedResponse += `   ${key}: ${value.toLocaleString('zh-CN')}\n`;
                  } else {
                    formattedResponse += `   ${key}: ${value}\n`;
                  }
                }
              });
              formattedResponse += '\n';
            });
          }
        }
        
        // 添加助手消息到历史
        const responseMessage = `根据您的请求"${message}"，${formattedResponse}`;
        
        chatHistory.push({ 
          role: 'assistant', 
          content: responseMessage
        });
        
        // 返回结果和查询
        return res.json({ 
          response: responseMessage,
          history: chatHistory,
          sqlQuery: sqlQuery,
          results: results
        });
      } catch (sqlError) {
        console.error('SQL执行错误:', sqlError);
        
        // SQL错误时的响应
        const errorMessage = `抱歉，我无法处理您的数据请求。错误信息: ${sqlError.message}`;
        
        chatHistory.push({ 
          role: 'assistant', 
          content: errorMessage
        });
        
        return res.json({ 
          response: errorMessage,
          history: chatHistory,
          error: sqlError.message
        });
      }
    } else {
      // 闲聊回复直接返回
      chatHistory.push({ role: 'assistant', content: aiResponse });
      
      return res.json({ 
        response: aiResponse,
        history: chatHistory
      });
    }
  } catch (error) {
    console.error('处理聊天消息时出错:', error);
    res.status(500).json({ error: '服务器错误', details: error.message });
  }
});

// 获取聊天历史
router.get('/history', (req, res) => {
  res.json({ history: chatHistory });
});

// 清除聊天历史
router.post('/clear', (req, res) => {
  chatHistory = [];
  res.json({ message: '聊天历史已清除', history: chatHistory });
});

module.exports = router;