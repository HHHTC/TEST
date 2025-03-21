async function translateText() {
  const sourceText = document.querySelector('.source-text').value;
  const sourceLang = document.querySelector('#source-lang').value;
  const targetLang = document.querySelector('#target-lang').value;
  const translateBtn = document.querySelector('.translate-start-btn');
  const targetTextArea = document.querySelector('.target-text');

  if (!sourceText.trim()) {
    alert('请输入要翻译的文本');
    return;
  }

  // 显示加载状态
  translateBtn.classList.add('loading');
  targetTextArea.value = '翻译中...';

  try {
    // 准备请求数据
    const requestData = {
      q: sourceText,
      from: sourceLang,
      to: targetLang
    };

    console.log('发送翻译请求数据:', requestData);

    const response = await fetch('/.netlify/functions/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    // 获取响应文本
    const responseText = await response.text();
    console.log('服务器响应:', responseText);

    // 尝试解析JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error(`响应解析失败: ${responseText}`);
    }

    // 检查错误
    if (!response.ok) {
      throw new Error(data.error || `请求失败: ${response.status}`);
    }

    // 显示翻译结果
    if (data.trans_result && data.trans_result.length > 0) {
      targetTextArea.value = data.trans_result[0].dst;
    } else {
      throw new Error('翻译结果为空');
    }

  } catch (error) {
    console.error('翻译错误详情:', error);
    targetTextArea.value = '翻译失败：' + error.message;
  } finally {
    // 移除加载状态
    translateBtn.classList.remove('loading');
  }
}

// 绑定翻译按钮事件
document.querySelector('.translate-start-btn').addEventListener('click', translateText); 