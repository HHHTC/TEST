const axios = require('axios');
const crypto = require('crypto-js');
const qs = require('querystring');

// 百度翻译API配置
const BAIDU_APP_ID = process.env.BAIDU_APPID;
const BAIDU_SECRET_KEY = process.env.BAIDU_KEY;
const BAIDU_API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

exports.handler = async function(event, context) {
  // 添加CORS头
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // 调试日志：检查环境变量
  console.log('Environment check:', {
    hasAppId: !!BAIDU_APP_ID,
    hasSecretKey: !!BAIDU_SECRET_KEY
  });

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
    // 调试日志：输出请求体
    console.log('Request body:', event.body);

    const { text, from, to } = JSON.parse(event.body);

    // 验证必要参数
    if (!text || !to) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: '缺少必要参数', params: { text: !!text, to: !!to } })
      };
    }

    // 验证API配置
    if (!BAIDU_APP_ID || !BAIDU_SECRET_KEY) {
      console.error('Missing API configuration');
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API配置错误' })
      };
    }

    // 生成随机数
    const salt = Math.round(Date.now() / 1000).toString();
    
    // 按照文档要求生成签名：appid+q+salt+密钥
    const signStr = `${BAIDU_APP_ID}${text}${salt}${BAIDU_SECRET_KEY}`;
    const sign = crypto.MD5(signStr).toString().toLowerCase();

    // 准备请求参数
    const params = {
      q: text, // 不在这里进行URL编码
      from: from || 'auto',
      to: to,
      appid: BAIDU_APP_ID,
      salt: salt,
      sign: sign
    };

    // 调试日志：输出请求参数
    console.log('Request params:', {
      ...params,
      q: text,
      appid: '***',
      sign: '***'
    });

    // 发送翻译请求
    const response = await axios({
      method: 'post',
      url: BAIDU_API_URL,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: qs.stringify(params) // querystring会自动处理URL编码
    });

    // 调试日志：输出API响应
    console.log('API Response:', response.data);

    // 处理翻译结果
    if (response.data && response.data.trans_result) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          translatedText: response.data.trans_result[0].dst,
          from: response.data.from,
          to: response.data.to
        })
      };
    } else if (response.data.error_code) {
      // 处理百度API的错误响应
      const errorMessage = `百度翻译API错误: ${response.data.error_code} - ${response.data.error_msg}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    } else {
      throw new Error('翻译失败：未收到有效的翻译结果');
    }

  } catch (error) {
    // 详细的错误日志
    console.error('Translation error:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    // 返回更详细的错误信息
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: '翻译服务出错',
        details: error.message,
        errorCode: error.response?.data?.error_code,
        errorMsg: error.response?.data?.error_msg
      })
    };
  }
}; 