// services/scheduler.js
const cron = require('node-cron');
const storage = require('./storage');
const ai = require('./ai');
const whatsapp = require('./whatsapp');

class SchedulerService {
  constructor() {
    this.cronTask = null;
    this.currentTime = null;
    this.logs = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const logItem = { timestamp, message, type };
    this.logs.unshift(logItem);
    if (this.logs.length > 50) this.logs.pop();
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
  }

  getLogs() {
    return this.logs;
  }

  init() {
    const config = storage.getConfig();
    const time = config.sendTime || '14:30';
    this.schedule(time);
  }

  schedule(timeString) {
    if (this.cronTask) {
      this.cronTask.stop();
      this.cronTask = null;
    }

    const [hourStr, minuteStr] = timeString.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      this.log(`Horário inválido: "${timeString}". Usando 14:30 por padrão.`, 'warn');
      return this.schedule('14:30');
    }

    this.currentTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const cronPattern = `${minute} ${hour} * * *`;

    this.log(`Agendamento configurado para todo dia às ${this.currentTime} (Fuso horário: Brasília)`, 'info');

    this.cronTask = cron.schedule(
      cronPattern,
      async () => {
        await this.executeDailyJob();
      },
      {
        timezone: 'America/Sao_Paulo'
      }
    );
  }

  async executeDailyJob() {
    this.log('⏰ Horário agendado disparado! Iniciando envio da mensagem diária...', 'info');
    const config = storage.getConfig();

    // Checar dias ativos
    const now = new Date();
    const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    // Ajuste fuso São Paulo
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'short'
    });
    const currentDayShort = formatter.format(now).toLowerCase(); // ex: 'mon', 'tue'

    if (config.activeDays && !config.activeDays.includes(currentDayShort)) {
      this.log(`Hoje (${currentDayShort}) não está na lista de dias ativos. Envio ignorado.`, 'info');
      return;
    }

    if (!config.girlfriendPhone) {
      this.log('Número da namorada não configurado! Acesse o painel e salve o número.', 'warn');
      storage.addHistoryEntry({
        status: 'failed',
        error: 'Número de telefone não configurado nas opções.',
        phone: '',
        message: ''
      });
      return;
    }

    if (whatsapp.status !== 'connected') {
      this.log('WhatsApp não está conectado. Tentando reconectar...', 'error');
      storage.addHistoryEntry({
        status: 'failed',
        error: 'WhatsApp desconectado no horário do envio.',
        phone: config.girlfriendPhone,
        message: ''
      });
      return;
    }

    try {
      this.log('Gerando mensagem romântica...', 'info');
      const messageData = await ai.createDailyMessage(config);
      this.log(`Mensagem gerada (${messageData.source}): "${messageData.text.slice(0, 40)}..."`, 'info');

      this.log(`Enviando mensagem para ${config.girlfriendPhone}...`, 'info');
      const sendResult = await whatsapp.sendTextMessage(config.girlfriendPhone, messageData.text);

      this.log('✅ Mensagem enviada com sucesso para sua namorada!', 'success');
      storage.addHistoryEntry({
        status: 'success',
        phone: config.girlfriendPhone,
        recipient: config.girlfriendName || 'Namorada',
        message: messageData.text,
        source: messageData.source,
        messageId: sendResult.messageId
      });
    } catch (err) {
      this.log(`❌ Falha no envio: ${err.message}`, 'error');
      storage.addHistoryEntry({
        status: 'failed',
        phone: config.girlfriendPhone,
        recipient: config.girlfriendName || 'Namorada',
        error: err.message
      });
    }
  }

  getNextRunInfo() {
    const config = storage.getConfig();
    const sendTime = config.sendTime || '14:30';
    return {
      time: sendTime,
      timezone: 'America/Sao_Paulo',
      activeDays: config.activeDays || []
    };
  }
}

module.exports = new SchedulerService();
