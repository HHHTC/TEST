const crypto = require('crypto');
const axios = require('axios');
const md5 = require('md5');

// 百度翻译 API 配置
const BAIDU_API_URL = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

exports.handler = async function(event, context) {
    console.log('收到请求体:', event.body);

    // 验证请求方法
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: '只支持 POST 请求' })
        };
    }

    try {
        // 解析请求体
        let requestData;
        try {
            requestData = JSON.parse(event.body);
        } catch (e) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '无效的 JSON 格式' })
            };
        }

        const { q, from, to } = requestData;

        // 详细的参数验证
        if (!q) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '缺少翻译文本 (q)' })
            };
        }

        if (!from) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '缺少源语言 (from)' })
            };
        }

        if (!to) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '缺少目标语言 (to)' })
            };
        }

        // 验证环境变量
        const appid = process.env.BAIDU_APP_ID;
        const key = process.env.BAIDU_SECRET_KEY;

        if (!appid || !key) {
            console.error('缺少环境变量:', { appid: !!appid, key: !!key });
            return {
                statusCode: 500,
                body: JSON.stringify({ error: '翻译服务配置错误 (缺少凭证)' })
            };
        }

        // 生成签名
        const salt = Date.now().toString();
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

        console.log('请求百度API参数:', { ...params, sign: '***' });

        // 发送翻译请求
        const response = await axios({
            method: 'get',
            url: BAIDU_API_URL,
            params: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log('百度API响应:', response.data);

        // 检查百度API错误
        if (response.data.error_code) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    error: `百度API错误: ${response.data.error_code}`,
                    message: response.data.error_msg
                })
            };
        }

        // 返回成功结果
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(response.data)
        };

    } catch (error) {
        console.error('服务器错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: '翻译服务错误',
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            })
        };
    }
};