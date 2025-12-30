//content.js
(function() {
  // Kiểm tra để tránh chạy 2 lần
  if (window.hasProSiderLoaded) return;
  window.hasProSiderLoaded = true;

  let sidebarIframe = null;
  let toggleButton = null;
  let textMenu = null;

  // 1. Tạo khung Sidebar (chứa Chat AI)
  function createSidebar() {
    sidebarIframe = document.createElement('iframe');
    sidebarIframe.src = chrome.runtime.getURL('sidebar.html');
    sidebarIframe.style.cssText = `
      position: fixed; top: 0; right: 0; width: 400px; height: 100vh;
      border: none; z-index: 2147483647; background: #fff;
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      transition: transform 0.3s ease; transform: translateX(100%);
    `;
    document.body.appendChild(sidebarIframe);
  }

  // 2. Tạo nút tròn nhỏ (Logo) để mở lại khi đóng
  function createToggleButton() {
    toggleButton = document.createElement('div');
    toggleButton.innerHTML = '🤖'; // Hoặc dùng thẻ img nếu muốn
    toggleButton.style.cssText = `
      position: fixed; bottom: 20px; right: 20px; width: 50px; height: 50px;
      background: linear-gradient(135deg, #667eea, #764ba2); color: white;
      border-radius: 50%; display: flex; align-items: center; justify-content: center;
      font-size: 24px; cursor: pointer; z-index: 2147483646;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2); transition: transform 0.2s;
      display: none; /* Mặc định ẩn */
    `;
    toggleButton.onclick = () => toggleSidebar(true);
    document.body.appendChild(toggleButton);
  }

  // 3. Hàm đóng/mở Sidebar
  function toggleSidebar(show) {
    if (show) {
      sidebarIframe.style.transform = 'translateX(0)';
      toggleButton.style.display = 'none';
    } else {
      sidebarIframe.style.transform = 'translateX(100%)';
      toggleButton.style.display = 'flex';
    }
  }

  // 4. Xử lý bôi đen văn bản (Menu thông minh)
  function handleTextSelection(event) {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    // Xóa menu cũ nếu có
    if (textMenu) {
      textMenu.remove();
      textMenu = null;
    }

    if (text.length > 0) {
      // Tạo menu nhỏ gần chuột
      textMenu = document.createElement('div');
      textMenu.style.cssText = `
        position: absolute; left: ${event.pageX + 10}px; top: ${event.pageY + 10}px;
        background: #333; color: #fff; padding: 5px; border-radius: 8px;
        z-index: 2147483648; display: flex; gap: 5px; font-family: sans-serif; font-size: 13px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      `;

      const btnTranslate = document.createElement('button');
      btnTranslate.innerText = 'Dịch';
      btnTranslate.style.cssText = 'background:none; border:none; color:#fff; cursor:pointer; padding: 5px;';
      
      const btnExplain = document.createElement('button');
      btnExplain.innerText = 'Giải thích';
      btnExplain.style.cssText = 'background:none; border:none; color:#fff; cursor:pointer; padding: 5px; border-left: 1px solid #555;';

      btnTranslate.onclick = () => sendToSidebar('Dịch đoạn này sang tiếng Việt: ' + text);
      btnExplain.onclick = () => sendToSidebar('Giải thích đoạn này dễ hiểu cho học sinh lớp 7: ' + text);

      textMenu.appendChild(btnTranslate);
      textMenu.appendChild(btnExplain);
      document.body.appendChild(textMenu);
    }
  }

  function sendToSidebar(promptText) {
    toggleSidebar(true); // Mở sidebar lên
    // Gửi tin nhắn vào bên trong iframe
    sidebarIframe.contentWindow.postMessage({ type: 'AUTO_PROMPT', text: promptText }, '*');
    // Xóa menu sau khi chọn
    if (textMenu) textMenu.remove();
    window.getSelection().removeAllRanges();
  }

  // Khởi chạy
  createSidebar();
  createToggleButton();

  // Lắng nghe sự kiện chuột
  document.addEventListener('mouseup', handleTextSelection);
  document.addEventListener('mousedown', (e) => {
    // Nếu click ra ngoài menu thì ẩn menu đi
    if (textMenu && !textMenu.contains(e.target)) {
      textMenu.remove();
      textMenu = null;
    }
  });

  // Lắng nghe tin nhắn từ Sidebar gửi ra (để đóng)
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLOSE_SIDEBAR') {
      toggleSidebar(false);
    }
  });

})();
