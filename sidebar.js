// sidebar.js - logic UI trong iframe
(async function() {
  const aiToolSelect = document.getElementById('ai-tool');
  const promptEl = document.getElementById('prompt');
  const btnSend = document.getElementById('btn-send');
  const btnUploadImage = document.getElementById('btn-upload-image');
  const btnCaptureRegion = document.getElementById('btn-capture-region');
  const imageInput = document.getElementById('image-input');
  const responseContent = document.getElementById('response-content');
  const historyList = document.getElementById('history-list');
  const btnUploadPdf = document.getElementById('btn-upload-pdf');
  const pdfInput = document.getElementById('pdf-input');
  const btnSettings = document.getElementById('btn-settings');
  const btnClose = document.getElementById('btn-close');
  const btnClearHistory = document.getElementById('btn-clear-history');

  // overlay crop elements
  const overlay = document.getElementById('overlay-crop');
  const overlayCanvas = document.getElementById('overlay-canvas');
  const cropOk = document.getElementById('crop-ok');
  const cropCancel = document.getElementById('crop-cancel');

  function escapeHtml(unsafe) {
    return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function renderHistory(history) {
    historyList.innerHTML = history.map(h => `<li><strong>${escapeHtml(h.tool)}</strong>: ${escapeHtml(h.prompt.substring(0, 50))}... -> ${escapeHtml(h.response.substring(0, 50))}...</li>`).join('');
  }

  async function pushHistory(tool, prompt, response) {
    const data = await chrome.storage.local.get('proSideHistory');
    let history = data.proSideHistory || [];
    history.push({ t: Date.now(), tool, prompt, response });
    // Limit history to last 50 entries
    if (history.length > 50) history = history.slice(-50);
    await chrome.storage.local.set({ proSideHistory: history });
    renderHistory(history);
  }

  async function loadTools() {
    const data = await chrome.storage.local.get('aiTools');
    const tools = data.aiTools || [
      { id: 'openai', name: 'ChatGPT (OpenAI)', enabled: true },
      { id: 'google', name: 'Gemini (Google)', enabled: false },
      { id: 'anthropic', name: 'Claude (Anthropic)', enabled: false }
    ];
    aiToolSelect.innerHTML = tools.filter(t => t.enabled).map(t => `<option value="${t.id}">${t.name}</option>`).join('');
  }

  async function sendToAI(toolId, prompt) {
    const data = await chrome.storage.local.get('apiKeys');
    const keys = data.apiKeys || {};
    let url, headers, body;

    if (toolId === 'openai') {
      if (!keys.openai) throw new Error('No OpenAI API key set');
      url = 'https://api.openai.com/v1/chat/completions';
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keys.openai}`
      };
      body = JSON.stringify({
        model: 'gpt-4o-mini', // Hoặc thay bằng 'gpt-3.5-turbo' nếu cần
        messages: [{ role: 'user', content: prompt }]
      });
    } else if (toolId === 'anthropic') {
      if (!keys.anthropic) throw new Error('No Anthropic API key set');
      url = 'https://api.anthropic.com/v1/messages';
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': keys.anthropic,
        'anthropic-version': '2023-06-01'
      };
      body = JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
      });
    } else if (toolId === 'google') {
      if (!keys.google) throw new Error('No Google API key set');
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${keys.google}`;
      headers = {
        'Content-Type': 'application/json'
      };
      body = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      });
    } else {
      throw new Error('Unsupported tool');
    }

    const res = await fetch(url, { method: 'POST', headers, body });
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);
    const json = await res.json();

    if (toolId === 'openai') {
      return json.choices[0].message.content.trim();
    } else if (toolId === 'anthropic') {
      return json.content[0].text.trim();
    } else if (toolId === 'google') {
      return json.candidates[0].content.parts[0].text.trim();
    }
  }

  btnSend.addEventListener('click', async () => {
    const tool = aiToolSelect.value;
    const prompt = promptEl.value.trim();
    if (!prompt) return;
    responseContent.textContent = 'Đang xử lý...';
    try {
      const response = await sendToAI(tool, prompt);
      responseContent.textContent = response;
      await pushHistory(tool, prompt, response);
    } catch (err) {
      responseContent.textContent = `Lỗi: ${err.message}`;
    }
  });

  btnUploadImage.addEventListener('click', () => imageInput.click());
  imageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const { createWorker } = Tesseract;
        const worker = await createWorker('eng'); // Thêm 'vie' nếu cần tiếng Việt: await createWorker(['eng', 'vie']);
        const { data: { text } } = await worker.recognize(ev.target.result);
        await worker.terminate();
        promptEl.value += `\nOCR text: ${text.trim()}`;
      } catch (err) {
        alert(`OCR error: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  });

  btnCaptureRegion.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'captureVisibleTab' }, (resp) => {
      if (!resp.success) return alert(resp.error);
      overlay.classList.remove('hidden');
      const img = new Image();
      img.src = resp.dataUrl;
      img.onload = () => {
        overlayCanvas.width = img.width / 2; // Scale down for performance if needed
        overlayCanvas.height = img.height / 2;
        const ctx = overlayCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, overlayCanvas.width, overlayCanvas.height);
        let startX = 0, startY = 0, endX = 0, endY = 0;
        let drawing = false;

        overlayCanvas.addEventListener('mousedown', (e) => {
          startX = e.offsetX;
          startY = e.offsetY;
          drawing = true;
        });

        overlayCanvas.addEventListener('mousemove', (e) => {
          if (!drawing) return;
          endX = e.offsetX;
          endY = e.offsetY;
          ctx.drawImage(img, 0, 0, overlayCanvas.width, overlayCanvas.height);
          ctx.strokeStyle = 'red';
          ctx.lineWidth = 2;
          ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        });

        overlayCanvas.addEventListener('mouseup', () => drawing = false);

        cropCancel.addEventListener('click', () => {
          overlay.classList.add('hidden');
          ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }, { once: true });

        cropOk.addEventListener('click', async () => {
          const cropW = Math.abs(endX - startX);
          const cropH = Math.abs(endY - startY);
          const cropX = Math.min(startX, endX);
          const cropY = Math.min(startY, endY);
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = cropW;
          tempCanvas.height = cropH;
          const tempCtx = tempCanvas.getContext('2d');
          tempCtx.drawImage(overlayCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          const croppedUrl = tempCanvas.toDataURL('image/png');
          try {
            const { createWorker } = Tesseract;
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(croppedUrl);
            await worker.terminate();
            promptEl.value += `\nOCR text: ${text.trim()}`;
          } catch (err) {
            alert(`OCR error: ${err.message}`);
          }
          overlay.classList.add('hidden');
          ctx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        }, { once: true });
      };
    });
  });

  btnUploadPdf.addEventListener('click', () => pdfInput.click());
  pdfInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(file));
      const pdf = await loadingTask.promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      promptEl.value += `\nPDF content: ${text.trim()}`;
    } catch (err) {
      alert(`PDF error: ${err.message}`);
    }
  });

  btnSettings.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'openOptions' });
  });

  btnClose.addEventListener('click', () => {
    try {
      parent.postMessage({ type: 'collapseProSideAI' }, '*');
    } catch (err) {
      try { window.frameElement.remove(); } catch (e) {}
    }
  });

  btnClearHistory.addEventListener('click', async () => {
    await chrome.storage.local.set({ proSideHistory: [] });
    renderHistory([]);
  });

  window.addEventListener('message', (ev) => {
    if (ev.data && ev.data.type === 'closeProSideAI') {
      try { window.frameElement.remove(); } catch (e) {}
    }
  });

  await loadTools();
  const histData = await chrome.storage.local.get('proSideHistory');
  renderHistory(histData.proSideHistory || []);
})();
