chrome.runtime.onMessage.addListener(message => {
  if (message?.type !== 'MVT_APPROVA_CAPTURE') return;
  window.dispatchEvent(new CustomEvent('mvt-extension-capture', {
    detail: {
      source: 'mvt-extension',
      type: 'MVT_APPROVA_CAPTURE',
      text: message.text,
      sourceUrl: message.sourceUrl
    }
  }));
  window.postMessage({
    source: 'mvt-extension',
    type: 'MVT_APPROVA_CAPTURE',
    text: message.text,
    sourceUrl: message.sourceUrl
  }, '*');
});
