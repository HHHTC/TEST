const crypto = require('crypto');
const axios = require('axios');
const md5 = require('md5');

// 百度翻译 API 配置
const BAIDU_API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

exports.handler = async function(event, context) {
    // 只允许 POST 请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: '方法不允许' })
        };
    }

    try {
        const { q, from, to } = JSON.parse(event.body);
        
        // 参数验证
        if (!q || !from || !to) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '参数不完整' })
            };
        }

        // 检查环境变量
        const appid = process.env.BAIDU_APP_ID;
        const key = process.env.BAIDU_SECRET_KEY;
        
        if (!appid || !key) {
            console.error('环境变量未设置：BAIDU_APP_ID 或 BAIDU_SECRET_KEY');
            return {
                statusCode: 500,
                body: JSON.stringify({ error: '翻译服务配置错误' })
            };
        }

        // 生成随机数
        const salt = Date.now().toString();

        // 生成签名
        const sign = md5(appid + q + salt + key);

        // 构建请求参数
        const params = {
            q,
            from,
            to,
            appid,
            salt,
            sign
        };

        console.log('请求参数:', params); // 调试日志

        // 发送翻译请求
        const response = await axios({
            method: 'get',
            url: BAIDU_API_URL,
            params: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('百度API响应:', response.data); // 调试日志

        // 检查API错误
        if (response.data.error_code) {
            throw new Error(`百度API错误: ${response.data.error_code} - ${response.data.error_msg}`);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(response.data)
        };

    } catch (error) {
        console.error('翻译服务错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: '翻译请求失败',
                message: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};