const CryptoJS = require('crypto-js');

exports.handler = async (event) => {
    try {
        const { text } = JSON.parse(event.body);
        
        // 百度API参数（建议存储为环境变量）
        const appid = process.env.BAIDU_APPID;
        const key = process.env.BAIDU_KEY;
        const salt = Date.now();
        const sign = CryptoJS.MD5(appid + text + salt + key).toString();

        const params = new URLSearchParams({
            q: text,
            from: 'auto',
            to: 'zh',
            appid,
            salt,
            sign
        });

        const response = await fetch('https://fanyi-api.baidu.com/api/trans/vip/translate?' + params);
        const data = await response.json();
        
        return {
            statusCode: 200,
            body: JSON.stringify(data)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};