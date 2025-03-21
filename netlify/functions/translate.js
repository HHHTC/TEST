const axios = require('axios');
const crypto = require('crypto-js');

// 百度翻译API配置
const BAIDU_APP_ID = process.env.BAIDU_APP_ID;
const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;
const BAIDU_API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

exports.handler = async function(event, context) {
  // 添加CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 处理OPTIONS请求
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // 只允许POST请求
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: '只允许POST请求' })
    };
  }

  try {
    const { text, from, to } = JSON.parse(event.body);

    // 验证必要参数
    if (!text || !to) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '缺少必要参数' })
      };
    }

    // 生成随机数
    const salt = Date.now();
    
    // 生成签名
    const sign = crypto.MD5(BAIDU_APP_ID + text + salt + BAIDU_SECRET_KEY).toString();

    // 准备请求参数
    const params = {
      q: text,
      from: from || 'auto',
      to: to,
      appid: BAIDU_APP_ID,
      salt: salt,
      sign: sign
    };

    // 发送翻译请求
    const response = await axios.post(BAIDU_API_URL, null, { params });

    // 处理翻译结果
    if (response.data && response.data.trans_result) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          translatedText: response.data.trans_result[0].dst
        })
      };
    } else {
      throw new Error('翻译失败');
    }

  } catch (error) {
    console.error('Translation error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '翻译服务出错',
        details: error.message
      })
    };
  }
}; 