const fs = require('fs').promises;
const path = require('path');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { folderPath } = JSON.parse(event.body);
        
        // 验证文件夹路径
        if (!folderPath || typeof folderPath !== 'string') {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    error: '无效的文件夹路径'
                })
            };
        }

        // 读取文件夹内容
        const files = await fs.readdir(folderPath);
        
        // 过滤出支持的图片文件
        const wallpapers = files
            .filter(file => {
                const ext = path.extname(file).toLowerCase();
                return ['.png', '.jpg', '.jpeg'].includes(ext);
            })
            .map(file => path.join(folderPath, file));

        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                wallpapers
            })
        };
    } catch (error) {
        console.error('加载壁纸失败:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
}; 