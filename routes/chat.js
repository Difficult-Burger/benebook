const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const axios = require('axios');

// DeepSeek API Configuration
const DEEPSEEK_API_KEY = 'sk-95f78a6e048745e2801755a7b79f9cf2';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Store chat history
let chatHistory = [];

// Check if the message is a data request
function isDataRequest(message) {
  console.log("Checking if this is a data request:", message);
  
  // First check if it's clearly a casual chat question
  const chatPatterns = [
    /what benefit/i, /what use/i, /how is it/i, /how to operate/i, /why should/i, 
    /is it possible/i, /can you/i, /is it/i, /introduce/i, /explain/i, 
    /help me/i, /may i ask/i, /thank you/i, /hello/i, /who are you/i
  ];
  
  // If matches chat pattern, return false directly
  if (chatPatterns.some(pattern => pattern.test(message))) {
    console.log("Matched casual chat pattern");
    return false;
  }
  
  // Clear data query patterns (highest priority)
  const clearDataQueryPatterns = [
    // Book related queries
    /query.*book/i, /show.*book/i, /list.*book/i, /find.*book/i,
    /query.*price/i, /most expensive/i, /cheapest/i, /average price/i,
    /statistics.*category/i, /count.*category/i, /books in category/i, 
    /how many books/i, /which books/i, /which book/i, /which ones/i,
    
    // Author related queries
    /list.*works/i, /show.*works/i, /query.*works/i, /find.*works/i,
    /.*'s book/i, /.*'s works/i, /written by.*/i, /.*publications/i,
    
    // Donor related queries
    /which donor/i, /which benefactor/i, /donor.*most/i, /donated.*most/i,
    /contributed.*most/i, /contributed.*books/i, /donation volume/i, /donation.*ranking/i,
    /who donated/i, /whose donation/i, /who contributed/i, /donor.*ranking/i,
    /most points/i, /points.*ranking/i, /who.*points/i,
    
    // Donation and redemption record queries
    /query.*donation/i, /show.*donation/i, /donated.*books/i, /donation.*record/i,
    /redemption.*record/i, /redeemed.*what/i, /redeemed.*most/i, /redemption.*ranking/i
  ];
  
  // If clearly matches data query pattern, return true directly
  if (clearDataQueryPatterns.some(pattern => pattern.test(message))) {
    console.log("Matched clear data query pattern");
    return true;
  }
  
  // Then check if contains data query keywords
  const dataActionPatterns = [
    /query/i, /show/i, /list/i, /find/i, /statistics/i, /calculate/i, 
    /how many/i, /what are/i, /most/i, /maximum/i, /least/i, /minimum/i,
    /most expensive/i, /cheapest/i, /average/i, /total/i, /which/i, /who/i
  ];
  
  const dataObjectPatterns = [
    /database/i, /table/i, /information/i, /record/i, /how many/i, 
    /books/i, /book/i, /donation record/i, /redemption record/i, /points/i,
    /price/i, /author/i, /category/i, /publisher/i,
    /donor/i, /donation/i, /contribution/i, /redemption/i, /works/i
  ];
  
  // More likely to be a data request if contains both action and object words
  const isDataQuery = dataActionPatterns.some(pattern => pattern.test(message)) && 
         dataObjectPatterns.some(pattern => pattern.test(message));
         
  console.log(`Action word match: ${dataActionPatterns.some(pattern => pattern.test(message))}`);
  console.log(`Object word match: ${dataObjectPatterns.some(pattern => pattern.test(message))}`);
  console.log(`Final determination as data request: ${isDataQuery}`);
  
  return isDataQuery;
}

// Build prompt for data requests
function buildDataRequestPrompt(message) {
  return `You are a database expert who needs to generate an accurate SQL query based on a user's natural language request.

The database is MySQL, with the following table structure:

1. Book table - Stores book information
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

2. Donor table - Stores donor information
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

3. Donation table - Stores donation records
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

4. RewardItem table - Stores reward item information
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

5. Redemption table - Stores redemption records
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

User request: "${message}"

Return only a valid SQL query without any other explanation or text. Ensure the SQL syntax is correct and can be executed directly.`;
}

// Build prompt for casual chat
function buildChatPrompt(message, history) {
  const historyText = history.map(item => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`).join('\n');
  
  return `You are the intelligent assistant for the Benebook website, specializing in helping users understand our book donation and points redemption platform.
  
Conversation history:
${historyText}

User: ${message}

Please answer the user's question as friendly and professionally as possible.`;
}

// API endpoint for handling chat messages
router.post('/message', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    // Add user message to history
    chatHistory.push({ role: 'user', content: message });
    
    // Determine if it's a data request or casual chat
    const isDataReq = isDataRequest(message);
    
    // Build appropriate prompt
    const prompt = isDataReq 
      ? buildDataRequestPrompt(message) 
      : buildChatPrompt(message, chatHistory);
    
    console.log("Prompt sent to DeepSeek:", prompt);

    // Call DeepSeek API
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
    console.log("DeepSeek response:", aiResponse);
    
    // If it's a data request, execute SQL query
    if (isDataReq) {
      try {
        // Extract SQL statement, remove potential code block markers
        let sqlQuery = aiResponse.trim();
        if (sqlQuery.startsWith('```sql')) {
          sqlQuery = sqlQuery.replace(/```sql\n/, '').replace(/\n```$/, '');
        } else if (sqlQuery.startsWith('```')) {
          sqlQuery = sqlQuery.replace(/```\n/, '').replace(/\n```$/, '');
        }
        
        console.log("Executing SQL query:", sqlQuery);
        
        // Execute SQL query
        const [results] = await pool.query(sqlQuery);
        
        console.log("Query results:", results);
        
        // Format results in a user-friendly way
        let formattedResponse = '';
        
        if (results.length === 0) {
          formattedResponse = 'Sorry, no data matching your criteria was found.';
        } else {
          // Format response based on query type and results
          if (sqlQuery.toUpperCase().includes('GROUP BY')) {
            // Group aggregation query
            formattedResponse = 'Query results:\n\n';
            results.forEach((row, index) => {
              const keys = Object.keys(row);
              // First field is usually the grouping key (like category)
              const groupKey = keys[0];
              const groupValue = row[groupKey];
              
              formattedResponse += `${groupValue}\n`;
              
              // Add other fields (usually aggregation results)
              keys.slice(1).forEach(key => {
                const value = row[key];
                // Add currency symbol for price fields
                if (key.includes('price') || key.includes('avg') || key.includes('sum')) {
                  formattedResponse += `   ${key}: $${parseFloat(value).toFixed(2)}\n`;
                } else {
                  formattedResponse += `   ${key}: ${value}\n`;
                }
              });
              formattedResponse += '\n';
            });
          } else if (sqlQuery.toUpperCase().includes('COUNT')) {
            // Aggregation query (count)
            const countKey = Object.keys(results[0])[0];
            const countValue = results[0][countKey];
            formattedResponse = `Query result: ${countValue}`;
          } else if (sqlQuery.toUpperCase().includes('AVG') || 
                   sqlQuery.toUpperCase().includes('SUM') || 
                   sqlQuery.toUpperCase().includes('MAX') || 
                   sqlQuery.toUpperCase().includes('MIN')) {
            // Other aggregation queries
            const aggregateKey = Object.keys(results[0])[0];
            const aggregateValue = results[0][aggregateKey];
            formattedResponse = `Query result: ${aggregateValue}`;
          } else if (sqlQuery.toUpperCase().includes('BOOK') && 
                   (sqlQuery.toUpperCase().includes('SELECT *') || 
                    sqlQuery.toUpperCase().includes('TITLE'))) {
            // Book-related queries
            formattedResponse = 'Query results:\n\n';
            results.forEach((book, index) => {
              formattedResponse += `${index + 1}. "${book.title}"\n`;
              if (book.author) formattedResponse += `   Author: ${book.author}\n`;
              if (book.category) formattedResponse += `   Category: ${book.category}\n`;
              if (book.publisher) formattedResponse += `   Publisher: ${book.publisher}\n`;
              if (book.original_price) formattedResponse += `   Price: $${book.original_price}\n`;
              formattedResponse += '\n';
            });
          } else if (sqlQuery.toUpperCase().includes('DONOR')) {
            // Donor-related queries
            formattedResponse = 'Query results:\n\n';
            results.forEach((donor, index) => {
              formattedResponse += `${index + 1}. ${donor.nickname}\n`;
              if (donor.total_points !== undefined) formattedResponse += `   Points: ${donor.total_points}\n`;
              if (donor.email) formattedResponse += `   Email: ${donor.email}\n`;
              formattedResponse += '\n';
            });
          } else if (sqlQuery.toUpperCase().includes('DONATION')) {
            // Donation record related queries
            formattedResponse = 'Query results:\n\n';
            results.forEach((donation, index) => {
              formattedResponse += `${index + 1}. Donation ID: ${donation.donation_id}\n`;
              if (donation.donor_phone) formattedResponse += `   Donor: ${donation.donor_phone}\n`;
              if (donation.book_id) formattedResponse += `   Book ID: ${donation.book_id}\n`;
              if (donation.donation_quantity) formattedResponse += `   Quantity: ${donation.donation_quantity}\n`;
              if (donation.donation_time) {
                const date = new Date(donation.donation_time);
                formattedResponse += `   Time: ${date.toLocaleString('en-US')}\n`;
              }
              formattedResponse += '\n';
            });
          } else if (sqlQuery.toUpperCase().includes('REWARD')) {
            // Reward related queries
            formattedResponse = 'Query results:\n\n';
            results.forEach((reward, index) => {
              formattedResponse += `${index + 1}. ${reward.item_name || 'Reward item'}\n`;
              if (reward.required_points) formattedResponse += `   Required points: ${reward.required_points}\n`;
              if (reward.stock) formattedResponse += `   Stock: ${reward.stock}\n`;
              formattedResponse += '\n';
            });
          } else {
            // Other types of queries, generic formatting
            formattedResponse = 'Query results:\n\n';
            results.forEach((item, index) => {
              formattedResponse += `Item ${index + 1}:\n`;
              Object.entries(item).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                  // Format date types
                  if (value instanceof Date) {
                    formattedResponse += `   ${key}: ${value.toLocaleString('en-US')}\n`;
                  } else {
                    formattedResponse += `   ${key}: ${value}\n`;
                  }
                }
              });
              formattedResponse += '\n';
            });
          }
        }
        
        // Add assistant message to history
        const responseMessage = `Based on your request "${message}", ${formattedResponse}`;
        
        chatHistory.push({ 
          role: 'assistant', 
          content: responseMessage
        });
        
        // Return results and query
        return res.json({ 
          response: responseMessage,
          history: chatHistory,
          sqlQuery: sqlQuery,
          results: results
        });
      } catch (sqlError) {
        console.error('SQL execution error:', sqlError);
        
        // Response for SQL errors
        const errorMessage = `Sorry, I couldn't process your data request. Error: ${sqlError.message}`;
        
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
      // Direct return for casual chat replies
      chatHistory.push({ role: 'assistant', content: aiResponse });
      
      return res.json({ 
        response: aiResponse,
        history: chatHistory
      });
    }
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Get chat history
router.get('/history', (req, res) => {
  res.json({ history: chatHistory });
});

// Clear chat history
router.post('/clear', (req, res) => {
  chatHistory = [];
  res.json({ message: 'Chat history cleared', history: chatHistory });
});

module.exports = router;