# Pro Side Bar - Chrome Extension (scaffold)

Mục tiêu: một assistant xuất hiện dạng cửa sổ bên phải (sidebar/floating iframe) có:
- Chọn công cụ AI (ChatGPT, Gemini, Claude, ...)
- Quản lý API keys (trên trang Options)
- Dịch, giải thích bằng AI văn bản được chọn.
- OCR: upload ảnh hoặc chụp vùng màn hình
- Chat với PDF: upload PDF -> trích xuất text -> hỏi AI
- Lưu lịch sử tương tác

Hướng dẫn cài đặt (local, unpacked):
1. Mở Chrome > chrome://extensions/
2. Bật "Developer mode".
3. "Load unpacked" -> chọn thư mục chứa các file ở trên.
4. Truy cập một trang web bất kì; extension sẽ inject sidebar bên phải.

Lưu ý triển khai:
- Các hàm gọi API (sendToAI) nay đã được triển khai cơ bản cho OpenAI, Anthropic, và Google Gemini. Bạn có thể mở rộng cho custom tools.
- Bảo mật: lưu API keys chỉ trong chrome.storage. Tránh gọi trực tiếp từ content script nếu bạn không muốn lộ key; cân nhắc proxy server nếu cần.
- OCR: sử dụng Tesseract.js (đã thêm CDN). Nếu muốn giảm kích thước, có thể xử lý trên server.
- PDF: sử dụng pdf.js (CDN).
- Đã sửa btnClose để collapse sidebar thành logo nhỏ thay vì remove iframe hoàn toàn.
- Thêm crop logic cho capture region OCR.
- Đã tách options.html và options.js đúng cách.

Storage schema (gợi ý):
- aiTools: [{id, name, enabled}, ...]
- apiKeys: { openai: "...", google: "...", anthropic: "..." }
- proSideHistory: [{t:timestamp, tool, prompt, response}, ...]

Tiếp theo bạn có thể:
- Thêm hỗ trợ cho các models khác (e.g., Deepseek).
- Thêm UI để hiển thị token usage, costs, trạng thái kết nối.
- Thêm authentication flow (OAuth) nếu muốn (vd. Google).
- Cải thiện crop UI (thêm resize handles, etc.).
