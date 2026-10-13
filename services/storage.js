const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '..', 'config.json');
const HISTORY_PATH = path.join(__dirname, '..', 'history.json');

const DEFAULT_CONFIG = {
  girlfriendPhone: '',
  girlfriendName: 'Meu amor',
  yourName: 'Seu namorado',
  sendTime: '14:30',
  activeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  mode: 'fixed', // 'fixed', 'ai', 'custom', 'hybrid'
  fixedMessage: 'Oi meu amor! Passando pra te lembrar de tomar o seu remédio agora! Não esquece, toma com água. Te amo! 💊❤️',
  tone: 'remedio', // 'remedio', 'romantico', 'fofo', 'engracado', 'motivador', 'poetico'
  customPromptContext: 'Lembrete diário para ela tomar o remédio no horário certo, com muito carinho e cuidado.',
  geminiApiKey: '',
  customMessages: [
    'Oi meu amor! Passando só pra te lembrar de tomar o seu remédio agora! Já tomou? Te amo! 💊❤️',
    'Alarme do amor ativado: hora do seu remédio, princesa! Cuida de você. Beijo grande! 💧🥰',
    'Passando rapidinho só pra conferir se você já tomou o remedinho. Não esquece, vida! Te amo! 💊✨',
    'Oi linda! Hora do remédio! Toma agora pra não passar da hora, tá bom? Amo você! 🌸💊',
    'Lembrete carinhoso: seu remédio te espera! Se cuida, meu bem. Te amo muito! 💖'
  ]
};

function getConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      saveConfig(DEFAULT_CONFIG);
      return DEFAULT_CONFIG;
    }
    const data = fs.readFileSync(CONFIG_PATH, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (error) {
    console.error('Erro ao ler config.json:', error);
    return DEFAULT_CONFIG;
  }
}

function saveConfig(newConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(newConfig, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar config.json:', error);
    return false;
  }
}

function getHistory() {
  try {
    if (!fs.existsSync(HISTORY_PATH)) {
      fs.writeFileSync(HISTORY_PATH, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const data = fs.readFileSync(HISTORY_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao ler history.json:', error);
    return [];
  }
}

function addHistoryEntry(entry) {
  try {
    const history = getHistory();
    history.unshift({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      ...entry
    });
    // Manter no máximo 100 mensagens no histórico
    const trimmed = history.slice(0, 100);
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(trimmed, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Erro ao salvar no histórico:', error);
    return false;
  }
}

module.exports = {
  getConfig,
  saveConfig,
  getHistory,
  addHistoryEntry,
  DEFAULT_CONFIG
};
