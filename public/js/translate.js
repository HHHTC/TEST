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
    const response = await fetch('/.netlify/functions/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: sourceText,
        from: sourceLang,
        to: targetLang
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    // 显示翻译结果
    if (data.trans_result && data.trans_result.length > 0) {
      targetTextArea.value = data.trans_result[0].dst;
    } else {
      throw new Error('翻译结果为空');
    }

  } catch (error) {
    console.error('翻译错误:', error);
    targetTextArea.value = '翻译失败：' + error.message;
  } finally {
    // 移除加载状态
    translateBtn.classList.remove('loading');
  }
} 