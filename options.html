// options.js - quản lý tools & API keys (đã làm rõ logic thêm/xóa/lưu)
(async function(){
  const keyOpen = document.getElementById('key-openai');
  const keyGoogle = document.getElementById('key-google');
  const keyAnthropic = document.getElementById('key-anthropic');
  const toolsContainer = document.getElementById('tools-container');
  const addToolBtn = document.getElementById('add-tool');
  const saveBtn = document.getElementById('save');
  const status = document.getElementById('status');

  // Helper: render list of tools (preserve tool.id)
  function renderTools(list){
    toolsContainer.innerHTML = '';
    list.forEach((t, idx)=>{
      const div = document.createElement('div');
      div.className = 'tool-row';
      // store the tool id in data-id so we keep it across edits
      div.innerHTML = `<input type="text" data-id="${t.id}" class="tool-name" value="${t.name}"/>
        <select data-id="${t.id}" class="tool-enabled"><option value="1">Enabled</option><option value="0">Disabled</option></select>
        <button data-id="${t.id}" class="remove">X</button>`;
      const sel = div.querySelector('.tool-enabled');
      sel.value = t.enabled ? '1' : '0';
      toolsContainer.appendChild(div);

      // remove button
      div.querySelector('.remove').addEventListener('click', ()=>{
        // remove this tool from DOM and leave re-render to caller by reconstructing list
        const current = getCurrentTools();
        const filtered = current.filter(tool => tool.id !== t.id);
        renderTools(filtered);
      });
    });
  }

  // Helper: read current tools from DOM into an array (preserve ids)
  function getCurrentTools(){
    const rows = toolsContainer.querySelectorAll('.tool-row');
    const tools = [];
    rows.forEach((r)=>{
      const nameEl = r.querySelector('.tool-name');
      const enabledEl = r.querySelector('.tool-enabled');
      const id = nameEl.dataset.id || ('custom-'+Date.now());
      const name = (nameEl.value || '').trim() || 'Unnamed tool';
      const enabled = enabledEl.value === '1';
      tools.push({ id, name, enabled });
    });
    return tools;
  }

  async function load() {
    const data = await chrome.storage.local.get(['aiTools','apiKeys']);
    const tools = data.aiTools || [
      { id: 'openai', name: 'ChatGPT (OpenAI)', enabled: true },
      { id: 'google', name: 'Gemini (Google)', enabled: false },
      { id: 'anthropic', name: 'Claude (Anthropic)', enabled: false }
    ];
    renderTools(tools);

    const keys = data.apiKeys || {};
    keyOpen.value = keys.openai || '';
    keyGoogle.value = keys.google || '';
    keyAnthropic.value = keys.anthropic || '';
  }

  addToolBtn.addEventListener('click', ()=>{
    // get current list and append a new tool
    const current = getCurrentTools();
    const newTool = { id: 'custom-' + Date.now(), name: 'New Tool', enabled: true };
    current.push(newTool);
    renderTools(current);
    // focus the new tool's name field
    setTimeout(() => {
      const last = toolsContainer.querySelector('.tool-row:last-child .tool-name');
      if (last) last.focus();
    }, 20);
  });

  saveBtn.addEventListener('click', async ()=>{
    const tools = getCurrentTools();

    const apiKeys = {
      openai: keyOpen.value.trim(),
      google: keyGoogle.value.trim(),
      anthropic: keyAnthropic.value.trim()
    };

    await chrome.storage.local.set({ aiTools: tools, apiKeys });
    status.textContent = 'Đã lưu';
    setTimeout(()=> status.textContent = '', 2500);
  });

  await load();
})();
