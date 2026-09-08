(() => {
  if (document.getElementById('mvt-capture-button')) return;
  const button = document.createElement('button');
  button.id = 'mvt-capture-button';
  button.type = 'button';
  button.textContent = 'Enviar para MVT';
  Object.assign(button.style, {
    position: 'fixed',
    right: '20px',
    bottom: '20px',
    zIndex: '2147483647',
    padding: '12px 16px',
    border: '0',
    borderRadius: '8px',
    background: '#2563eb',
    color: '#fff',
    font: '600 14px Segoe UI, sans-serif',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,0,.25)'
  });
  button.addEventListener('click', () => {
    const text = document.body?.innerText || '';
    const count = (text.match(/\d+\)\s*Q\d+/gi) || []).length;
    if (!count) {
      button.textContent = 'Nenhuma questao encontrada';
      setTimeout(() => { button.textContent = 'Enviar para MVT'; }, 2500);
      return;
    }
    chrome.runtime.sendMessage({ type: 'MVT_CAPTURE_APPROVA', text, sourceUrl: location.href });
    button.textContent = `${count} questoes enviadas`;
    setTimeout(() => { button.textContent = 'Enviar para MVT'; }, 2500);
  });
  document.body.appendChild(button);
})();
