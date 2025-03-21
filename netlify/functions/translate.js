const crypto = require('crypto');
const axios = require('axios');

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

        // 生成随机数
        const salt = Date.now().toString();
        const appid = process.env.BAIDU_APP_ID;
        const key = process.env.BAIDU_SECRET_KEY;

        // 生成签名字符串：appid + q + salt + 密钥
        const signStr = appid + q + salt + key;
        
        // 计算MD5签名
        const sign = crypto
            .createHash('md5')
            .update(signStr)
            .digest('hex');

        // 构建请求参数
        const params = new URLSearchParams({
            q,
            from,
            to,
            appid,
            salt,
            sign
        });

        // 发送翻译请求
        const response = await axios.get(`${BAIDU_API_URL}?${params.toString()}`);

        // 处理翻译结果
        if (response.data.error_code) {
            throw new Error(`翻译错误：${response.data.error_msg}`);
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(response.data)
        };

    } catch (error) {
        console.error('翻译错误:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: '翻译失败',
                message: error.message 
            })
        };
    }
};