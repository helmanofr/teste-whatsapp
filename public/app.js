// public/app.js

let currentStatus = 'disconnected';
let pollInterval = null;

// Day mapping
const dayMap = {
  seg: 'mon',
  ter: 'tue',
  qua: 'wed',
  qui: 'thu',
  sex: 'fri',
  sab: 'sat',
  dom: 'sun'
};
const reverseDayMap = {
  mon: 'seg',
  tue: 'ter',
  wed: 'qua',
  thu: 'qui',
  fri: 'sex',
  sat: 'sab',
  sun: 'dom'
};

function showToast(message, icon = '✨', isError = false) {
  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toastMsg');
  const toastIcon = document.getElementById('toastIcon');

  toastMsg.textContent = message;
  toastIcon.textContent = icon;

  if (isError) {
    toast.className = 'fixed top-5 right-5 z-50 transform transition-all duration-300 translate-y-0 opacity-100 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3';
  } else {
    toast.className = 'fixed top-5 right-5 z-50 transform transition-all duration-300 translate-y-0 opacity-100 bg-white border border-slate-200 text-slate-800 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3';
  }

  setTimeout(() => {
    toast.classList.add('translate-y-[-100px]', 'opacity-0');
  }, 4000);
}

// Atualizar status do WhatsApp e QR code
async function fetchStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    updateUIWithStatus(data);
  } catch (err) {
    console.error('Erro ao buscar status:', err);
  }
}

function updateUIWithStatus(data) {
  const connectionPill = document.getElementById('connectionPill');
  const connectionText = document.getElementById('connectionText');
  const qrSection = document.getElementById('qrSection');
  const connectedSection = document.getElementById('connectedSection');
  const qrImage = document.getElementById('qrImage');
  const qrLoading = document.getElementById('qrLoading');
  const scheduleBadge = document.getElementById('scheduleBadge');
  const connectedUserInfo = document.getElementById('connectedUserInfo');

  currentStatus = data.status;

  if (data.scheduler && data.scheduler.time) {
    scheduleBadge.textContent = data.scheduler.time;
  }

  if (data.status === 'connected') {
    connectionPill.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200';
    connectionPill.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>Conectado</span>';
    
    qrSection.classList.add('hidden');
    connectedSection.classList.remove('hidden');

    if (data.user) {
      connectedUserInfo.textContent = `Conectado como ${data.user.name || data.user.id || 'WhatsApp'}`;
    }
  } else if (data.status === 'qr_ready' && data.qrCodeDataUrl) {
    connectionPill.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200';
    connectionPill.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span><span>Aguardando leitura do QR</span>';

    qrSection.classList.remove('hidden');
    connectedSection.classList.add('hidden');
    qrLoading.classList.add('hidden');
    qrImage.src = data.qrCodeDataUrl;
    qrImage.classList.remove('hidden');
  } else {
    connectionPill.className = 'flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200';
    connectionPill.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-500"></span><span>Iniciando WhatsApp...</span>';

    qrSection.classList.remove('hidden');
    connectedSection.classList.add('hidden');
    qrImage.classList.add('hidden');
    qrLoading.classList.remove('hidden');
  }
}

// Carregar configurações
async function loadConfig() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();

    document.getElementById('girlfriendPhone').value = config.girlfriendPhone || '';
    document.getElementById('sendTime').value = config.sendTime || '14:30';
    document.getElementById('girlfriendName').value = config.girlfriendName || '';
    document.getElementById('yourName').value = config.yourName || '';
    document.getElementById('tone').value = config.tone || 'remedio';
    document.getElementById('mode').value = config.mode || 'fixed';
    document.getElementById('fixedMessage').value = config.fixedMessage || 'Oi vidinha! Passando pra te lembrar de tomar o seu remédio agora! Já tomou? Não esquece da aguinha. Te amo muito! 💊❤️';
    document.getElementById('customPromptContext').value = config.customPromptContext || '';

    if (config.hasApiKey) {
      document.getElementById('geminiApiKey').placeholder = '•••••••••••••••• (Chave salva)';
    }

    // Dias ativos
    if (config.activeDays && Array.isArray(config.activeDays)) {
      const activeEn = new Set(config.activeDays);
      document.querySelectorAll('input[name="activeDay"]').forEach(cb => {
        const enDay = dayMap[cb.value];
        cb.checked = activeEn.has(enDay);
      });
    }

    // Atualiza horário na prévia
    document.getElementById('previewTime').textContent = config.sendTime || '14:30';
  } catch (err) {
    console.error('Erro ao carregar configurações:', err);
  }
}

// Salvar configurações
document.getElementById('settingsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btnSaveSettings');
  btn.disabled = true;
  btn.innerHTML = '<span>⏳</span><span>Salvando...</span>';

  try {
    const activeDays = [];
    document.querySelectorAll('input[name="activeDay"]:checked').forEach(cb => {
      if (dayMap[cb.value]) {
        activeDays.push(dayMap[cb.value]);
      }
    });

    const apiKeyInput = document.getElementById('geminiApiKey').value.trim();

    const payload = {
      girlfriendPhone: document.getElementById('girlfriendPhone').value.trim(),
      sendTime: document.getElementById('sendTime').value,
      girlfriendName: document.getElementById('girlfriendName').value.trim(),
      yourName: document.getElementById('yourName').value.trim(),
      tone: document.getElementById('tone').value,
      mode: document.getElementById('mode').value,
      fixedMessage: document.getElementById('fixedMessage').value.trim(),
      customPromptContext: document.getElementById('customPromptContext').value.trim(),
      activeDays
    };

    if (apiKeyInput) {
      payload.geminiApiKey = apiKeyInput;
    }

    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      showToast('Configurações salvas com sucesso! Horário e mensagem sincronizados.', '✅');
      document.getElementById('scheduleBadge').textContent = payload.sendTime;
      document.getElementById('previewTime').textContent = payload.sendTime;
      loadPreview();
    } else {
      showToast(data.error || 'Erro ao salvar', '❌', true);
    }
  } catch (err) {
    showToast('Falha na comunicação com o servidor', '❌', true);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>💾</span><span>Salvar Configurações</span>';
  }
});

// Gerar Prévia de Frase
async function loadPreview() {
  const previewText = document.getElementById('previewBubbleText');
  const sourceBadge = document.getElementById('previewSourceBadge');
  const btnRefresh = document.getElementById('btnRefreshPreview');
  const mode = document.getElementById('mode').value;
  const fixedMsg = document.getElementById('fixedMessage').value.trim();

  // Se o modo for fixo, atualiza direto sem chamar API
  if (mode === 'fixed') {
    previewText.textContent = fixedMsg || 'Oi amor! Passando pra te lembrar de tomar o seu remédio agora! 💊❤️';
    sourceBadge.textContent = '📌 Sua mensagem fixa personalizada (Lembrete do remédio)';
    previewText.style.opacity = '1';
    return;
  }

  btnRefresh.disabled = true;
  previewText.style.opacity = '0.4';

  try {
    const payload = {
      girlfriendName: document.getElementById('girlfriendName').value.trim(),
      yourName: document.getElementById('yourName').value.trim(),
      tone: document.getElementById('tone').value,
      mode: mode,
      fixedMessage: fixedMsg,
      customPromptContext: document.getElementById('customPromptContext').value.trim(),
      geminiApiKey: document.getElementById('geminiApiKey').value.trim()
    };

    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success && data.preview) {
      previewText.textContent = data.preview.text;
      
      const sourceLabels = {
        fixed_message: '📌 Sua mensagem fixa (Lembrete do remédio)',
        gemini_ai: '✨ Gerada por Inteligência Artificial (Gemini)',
        curated_template: '💖 Lembrete de remédio da curadoria',
        custom_list: '📝 Da sua lista personalizada',
        fallback_template: '🛡️ Lembrete de remédio (Backup seguro)'
      };
      sourceBadge.textContent = sourceLabels[data.preview.source] || 'Mensagem pronta';
    }
  } catch (err) {
    console.error('Erro na prévia:', err);
  } finally {
    previewText.style.opacity = '1';
    btnRefresh.disabled = false;
  }
}

// Botão Enviar Teste
document.getElementById('btnSendTest').addEventListener('click', async () => {
  if (currentStatus !== 'connected') {
    showToast('Conecte o WhatsApp escaneando o QR Code antes de testar!', '⚠️', true);
    return;
  }

  const phone = document.getElementById('girlfriendPhone').value.trim();
  if (!phone) {
    showToast('Preencha o número dela nas configurações antes de testar!', '⚠️', true);
    return;
  }

  const btn = document.getElementById('btnSendTest');
  const btnText = document.getElementById('btnSendTestText');
  const btnIcon = document.getElementById('btnSendTestIcon');

  btn.disabled = true;
  btnIcon.textContent = '⏳';
  btnText.textContent = 'Enviando teste no WhatsApp...';

  try {
    const res = await fetch('/api/send-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        targetPhone: phone
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast('Mensagem de teste enviada com sucesso! Ela já recebeu!', '💌');
      loadHistory();
    } else {
      showToast(data.error || 'Falha ao enviar teste.', '❌', true);
    }
  } catch (err) {
    showToast('Erro ao disparar mensagem de teste.', '❌', true);
  } finally {
    btn.disabled = false;
    btnIcon.textContent = '💌';
    btnText.textContent = 'Enviar Teste no WhatsApp Dela';
  }
});

// Desconectar / Trocar de conta
document.getElementById('btnLogout').addEventListener('click', async () => {
  if (!confirm('Deseja realmente desconectar esta conta do WhatsApp?')) return;

  try {
    const res = await fetch('/api/logout', { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('WhatsApp desconectado. Aguarde o novo QR Code...', '👋');
      fetchStatus();
    }
  } catch (err) {
    showToast('Erro ao desconectar.', '❌', true);
  }
});

// Carregar Histórico
async function loadHistory() {
  const container = document.getElementById('historyContainer');
  try {
    const res = await fetch('/api/history');
    const items = await res.json();

    if (!items || items.length === 0) {
      container.innerHTML = '<p class="text-xs text-slate-400 text-center py-6">Nenhuma mensagem enviada ainda. Faça um teste acima!</p>';
      return;
    }

    container.innerHTML = items.map(item => {
      const date = new Date(item.timestamp).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const isSuccess = item.status === 'success';

      return `
        <div class="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs space-y-1.5 transition hover:bg-slate-100/60">
          <div class="flex items-center justify-between">
            <span class="font-bold text-slate-700 flex items-center gap-1">
              ${isSuccess ? '<span class="text-emerald-500">●</span> Enviado para' : '<span class="text-rose-500">●</span> Falha para'} 
              ${item.recipient || item.phone}
            </span>
            <span class="text-[10px] text-slate-400 font-mono">${date}</span>
          </div>
          <p class="text-slate-600 italic break-words">
            "${item.message || item.error || 'Sem conteúdo'}"
          </p>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Erro ao carregar histórico:', err);
  }
}

// Listeners
document.getElementById('btnRefreshPreview').addEventListener('click', loadPreview);
document.getElementById('btnRefreshStatus').addEventListener('click', fetchStatus);
document.getElementById('btnRefreshHistory').addEventListener('click', loadHistory);

// Atualização em tempo real ao digitar a mensagem fixa
document.getElementById('fixedMessage').addEventListener('input', () => {
  const mode = document.getElementById('mode').value;
  if (mode === 'fixed') {
    const val = document.getElementById('fixedMessage').value.trim();
    document.getElementById('previewBubbleText').textContent = val || 'Digite sua mensagem...';
    document.getElementById('previewSourceBadge').textContent = '📌 Sua mensagem fixa (Lembrete do remédio)';
  }
});

// Ao trocar o modo de envio
document.getElementById('mode').addEventListener('change', () => {
  loadPreview();
});

// Chips de sugestão rápida
document.querySelectorAll('.btn-template-chip').forEach(btn => {
  btn.addEventListener('click', () => {
    const text = btn.getAttribute('data-text');
    document.getElementById('fixedMessage').value = text;
    document.getElementById('mode').value = 'fixed';
    loadPreview();
    showToast('Sugestão aplicada na sua mensagem!', '💊');
  });
});

// Inicialização
window.addEventListener('DOMContentLoaded', async () => {
  await fetchStatus();
  await loadConfig();
  await loadPreview();
  await loadHistory();

  // Polling para atualizar status/QR code suavemente
  pollInterval = setInterval(fetchStatus, 4000);
});
