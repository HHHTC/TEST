const axios = require('axios');
const querystring = require('querystring');

exports.handler = async function(event, context) {
    // 处理 OPTIONS 请求
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
        };
    }

    // 只处理 POST 请求
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { text, from, to } = JSON.parse(event.body);

        // 参数验证
        if (!text) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: '翻译文本不能为空' })
            };
        }

        // 百度翻译API配置
        const BAIDU_APP_ID = process.env.BAIDU_APPID;
        const BAIDU_SECRET_KEY = process.env.BAIDU_KEY;

        if (!BAIDU_APP_ID || !BAIDU_SECRET_KEY) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: '翻译服务配置错误' })
            };
        }

        // 生成签名
        const salt = Date.now();
        const signStr = `${BAIDU_APP_ID}${text}${salt}${BAIDU_SECRET_KEY}`;
        const sign = require('crypto').createHash('md5').update(signStr).digest('hex');

        // 准备请求参数
        const params = {
            q: text,
            from: from || 'auto',
            to: to || 'zh',
            appid: BAIDU_APP_ID,
            salt: salt,
            sign: sign
        };

        // 发送翻译请求
        const response = await axios.post('http://api.fanyi.baidu.com/api/trans/vip/translate', 
            querystring.stringify(params),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );

        // 处理翻译结果
        if (response.data && response.data.trans_result) {
            // 合并所有翻译结果，保持原始换行
            const translatedText = response.data.trans_result
                .map(item => item.dst)
                .join('\n');

            return {
                statusCode: 200,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    translatedText: translatedText
                })
            };
        } else {
            throw new Error('翻译结果格式错误');
        }

    } catch (error) {
        console.error('翻译错误:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: error.message || '翻译服务出错'
            })
        };
    }
}; 