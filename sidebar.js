//sidebar.js
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const btnSend = document.getElementById('btn-send');
const btnClose = document.getElementById('btn-close');
const btnSettings = document.getElementById('btn-settings');

// Thêm tin nhắn vào khung chat
function addMessage(text, sender) {
  const div = document.createElement('div');
  div.className = `message ${sender}`;
  div.innerHTML = text.replace(/\n/g, '<br>');
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 🕵️‍♂️ HÀM THÁM TỬ: Tự tìm tên model đúng nhất
async function findBestModel(apiKey) {
  try {
    // Hỏi Google: "Có những model nào?"
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const json = await res.json();
    
    if (json.error) {
      throw new Error(json.error.message);
    }
    
    if (!json.models || json.models.length === 0) {
      throw new Error("Tài khoản này không có quyền truy cập model nào cả.");
    }

    // Tìm con Robot nào biết "tạo nội dung" (generateContent)
    const goodModel = json.models.find(m => 
      m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")
    );

    if (goodModel) {
      // Ví dụ nó tìm thấy "models/gemini-1.5-flash-001"
      // Chúng ta phải xóa chữ "models/" ở đầu đi để dùng
      return goodModel.name.replace("models/", "");
    }
    
    // Nếu không tìm thấy cái nào ưng ý, dùng tạm cái phổ biến nhất
    return "gemini-1.5-flash";
    
  } catch (err) {
    console.error("Lỗi tìm model:", err);
    // Nếu lỗi quá thì đoán mò
    return "gemini-1.5-flash";
  }
}

// Hàm gọi AI chính
async function callAI(prompt) {
  addMessage("Đang dò tìm Robot phù hợp... 🕵️", 'ai');
  const loadingMsg = chatContainer.lastElementChild;
  
  const data = await chrome.storage.local.get('apiKeys');
  const keys = data.apiKeys || {};
  const googleKey = (keys.google || '').trim();

  try {
    if (!googleKey) {
      throw new Error("Cháu chưa nhập API Key! Hãy bấm nút bánh răng ⚙️ để nhập.");
    }

    // Bước 1: Tìm tên Robot chính xác
    const modelName = await findBestModel(googleKey);
    console.log("Đã tìm thấy model:", modelName); // Xem ở Console nếu cần
    
    loadingMsg.innerHTML = `Đang kết nối với <b>${modelName}</b>...`;

    // Bước 2: Gọi Robot đó trả lời
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${googleKey}`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const json = await res.json();

    if (json.error) {
      throw new Error(json.error.message);
    }

    const reply = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) throw new Error("AI không trả lời (Lỗi lạ).");
    
    loadingMsg.innerHTML = reply.replace(/\n/g, '<br>');

  } catch (err) {
    // Dịch lỗi sang tiếng Việt cho dễ hiểu
    let msg = err.message;
    if (msg.includes("API key not valid")) msg = "API Key bị sai. Cháu kiểm tra lại xem có copy thiếu chữ không?";
    if (msg.includes("quota")) msg = "Hết lượt dùng miễn phí rồi.";
    
    loadingMsg.innerHTML = `<span style="color: red; font-weight: bold;">❌ LỖI: ${msg}</span>`;
  }
}

// Các nút bấm
btnSend.addEventListener('click', () => {
  const text = userInput.value.trim();
  if (!text) return;
  addMessage(text, 'user');
  userInput.value = '';
  callAI(text);
});

btnClose.addEventListener('click', () => {
  window.parent.postMessage({ type: 'CLOSE_SIDEBAR' }, '*');
});

btnSettings.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'openOptions' });
});

window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'AUTO_PROMPT') {
    const prompt = event.data.text;
    addMessage(prompt, 'user');
    callAI(prompt);
  }
});
