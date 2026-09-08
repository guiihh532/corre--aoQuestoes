function isMvtPage(url) {
  return /^https:\/\/[^/]+\.github\.io\//.test(url) || /^https?:\/\/(localhost|127\.0\.0\.1):8765\//.test(url) || /^file:\/\/\//.test(url);
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message?.type !== 'MVT_CAPTURE_APPROVA') return;
  console.info('[MVT] Captura recebida do Aprova:', (message.text?.match(/\d+\)\s*Q\d+/gi) || []).length, 'questoes');
  chrome.tabs.query({}, tabs => {
    const targets = tabs.filter(tab => tab.id !== sender.tab?.id && isMvtPage(tab.url || ''));
    console.info('[MVT] Abas de destino:', targets.map(tab => tab.url));
    targets.forEach(tab => {
      const payload = { source: 'mvt-extension', type: 'MVT_APPROVA_CAPTURE', text: message.text, sourceUrl: message.sourceUrl };
      chrome.scripting.executeScript({ target: { tabId: tab.id }, func: data => { window.dispatchEvent(new CustomEvent('mvt-extension-capture', { detail: data })); window.postMessage(data, '*'); }, args: [payload] }).then(() => console.info('[MVT] Captura injetada em:', tab.url)).catch(error => console.warn('[MVT] Falha ao injetar:', tab.url, error));
    });
  });
});
