// server.js
const express = require('express');
const path = require('path');
const whatsapp = require('./services/whatsapp');
const scheduler = require('./services/scheduler');
const storage = require('./services/storage');
const ai = require('./services/ai');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Status geral do sistema
app.get('/api/status', (req, res) => {
  const waStatus = whatsapp.getStatus();
  const nextRun = scheduler.getNextRunInfo();
  res.json({
    ...waStatus,
    scheduler: nextRun,
    serverTime: new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  });
});

// Desconectar / Gerar novo QR Code
app.post('/api/logout', async (req, res) => {
  try {
    scheduler.log('Solicitada desconexão do WhatsApp pelo painel.', 'info');
    await whatsapp.logout();
    res.json({ success: true, message: 'WhatsApp desconectado com sucesso.' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Obter configurações salvas
app.get('/api/config', (req, res) => {
  const config = storage.getConfig();
  // Não exibir a chave completa por segurança, mas indicar se está preenchida
  const safeConfig = {
    ...config,
    hasApiKey: Boolean(config.geminiApiKey)
  };
  res.json(safeConfig);
});

// Salvar configurações
app.post('/api/config', (req, res) => {
  try {
    const current = storage.getConfig();
    const update = req.body;

    // Se veio geminiApiKey vazio e current já tinha, preserva se for placeholder
    let apiKey = update.geminiApiKey;
    if (apiKey === undefined || apiKey === '******') {
      apiKey = current.geminiApiKey;
    }

    const merged = {
      ...current,
      ...update,
      geminiApiKey: apiKey
    };

    const saved = storage.saveConfig(merged);
    if (!saved) {
      return res.status(500).json({ success: false, error: 'Erro ao salvar no arquivo de configuração.' });
    }

    // Atualiza agendador se o horário mudou
    if (merged.sendTime) {
      scheduler.schedule(merged.sendTime);
    }

    scheduler.log('Configurações atualizadas e salvas com sucesso.', 'info');
    res.json({ success: true, config: merged });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Gerar prévia de mensagem (sem enviar)
app.post('/api/preview', async (req, res) => {
  try {
    const currentConfig = storage.getConfig();
    // Mescla com eventuais opções enviadas no corpo para testar na hora
    const configToUse = { ...currentConfig, ...(req.body || {}) };
    
    // Se a chave não veio no body, usa a salva
    if (!configToUse.geminiApiKey) {
      configToUse.geminiApiKey = currentConfig.geminiApiKey;
    }

    const preview = await ai.createDailyMessage(configToUse);
    res.json({ success: true, preview });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enviar mensagem de teste agora
app.post('/api/send-test', async (req, res) => {
  try {
    const config = storage.getConfig();
    const { targetPhone, customText } = req.body || {};

    const phoneToSend = targetPhone || config.girlfriendPhone;

    if (!phoneToSend) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum número de telefone informado. Digite o número da sua namorada nas opções.'
      });
    }

    let messageToSend = customText;
    let source = 'manual_test';

    if (!messageToSend) {
      const generated = await ai.createDailyMessage(config);
      messageToSend = generated.text;
      source = generated.source;
    }

    scheduler.log(`Enviando mensagem de teste para ${phoneToSend}...`, 'info');
    const sendResult = await whatsapp.sendTextMessage(phoneToSend, messageToSend);

    storage.addHistoryEntry({
      status: 'success',
      phone: phoneToSend,
      recipient: config.girlfriendName || 'Namorada',
      message: messageToSend,
      source: `teste_${source}`,
      messageId: sendResult.messageId
    });

    scheduler.log('✅ Mensagem de teste enviada com sucesso!', 'success');
    res.json({
      success: true,
      message: messageToSend,
      recipient: phoneToSend,
      details: sendResult
    });
  } catch (error) {
    scheduler.log(`❌ Erro no envio de teste: ${error.message}`, 'error');
    res.status(500).json({ success: false, error: error.message });
  }
});

// Histórico de mensagens
app.get('/api/history', (req, res) => {
  const history = storage.getHistory();
  res.json(history);
});

// Logs do agendador
app.get('/api/logs', (req, res) => {
  res.json(scheduler.getLogs());
});

// Inicialização
app.listen(PORT, () => {
  console.log(`\n=================================================`);
  console.log(`💌 Zap Romântico iniciado na porta http://localhost:${PORT}`);
  console.log(`Acesse o navegador para escanear o QR Code e configurar!`);
  console.log(`=================================================\n`);

  // Inicia serviços
  scheduler.init();
  whatsapp.init();
});
