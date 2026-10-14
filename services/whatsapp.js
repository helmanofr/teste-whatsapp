// services/whatsapp.js
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');

const AUTH_FOLDER = path.join(__dirname, '..', 'auth_info_baileys');

class WhatsAppService {
  constructor() {
    this.sock = null;
    this.status = 'disconnected'; // 'disconnected' | 'connecting' | 'qr_ready' | 'connected'
    this.qrCodeDataUrl = null;
    this.qrRaw = null;
    this.user = null;
    this.listeners = [];
    this.isReconnecting = false;
  }

  onStateChange(fn) {
    this.listeners.push(fn);
  }

  notifyStateChange() {
    this.listeners.forEach((fn) => {
      try {
        fn({
          status: this.status,
          qrCodeDataUrl: this.qrCodeDataUrl,
          user: this.user
        });
      } catch (err) {
        console.error('Erro no listener de estado:', err);
      }
    });
  }

  async init() {
    if (this.sock && this.status === 'connected') {
      return;
    }

    try {
      this.status = 'connecting';
      this.notifyStateChange();

      const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
      
      let version;
      try {
        const versionInfo = await fetchLatestBaileysVersion();
        version = versionInfo.version;
      } catch (e) {
        version = undefined;
      }

      this.sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['Zap Romantico', 'Chrome', '1.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: false,
        shouldSyncHistoryMessage: () => false,
        emitOwnEvents: false
      });

      this.sock.ev.on('creds.update', saveCreds);

      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.status = 'qr_ready';
          this.qrRaw = qr;
          try {
            this.qrCodeDataUrl = await QRCode.toDataURL(qr, {
              margin: 2,
              scale: 8,
              color: {
                dark: '#1e293b',
                light: '#ffffff'
              }
            });
          } catch (qrErr) {
            console.error('Erro ao gerar imagem do QR Code:', qrErr);
          }
          console.log('⚡ Novo QR Code pronto para leitura no painel web.');
          this.notifyStateChange();
        }

        if (connection === 'close') {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          console.log(`Conexão fechada (código ${statusCode}). Auto-reconectando: ${shouldReconnect}`);
          this.status = 'disconnected';
          this.user = null;
          this.notifyStateChange();

          if (shouldReconnect) {
            if (!this.isReconnecting) {
              this.isReconnecting = true;
              setTimeout(() => {
                this.isReconnecting = false;
                this.init();
              }, 4000);
            }
          } else {
            console.log('Sessão encerrada (Logout). Limpando credenciais...');
            this.clearAuth();
            setTimeout(() => this.init(), 2000);
          }
        } else if (connection === 'open') {
          console.log('✅ WhatsApp conectado com sucesso!');
          this.status = 'connected';
          this.qrCodeDataUrl = null;
          this.qrRaw = null;
          this.user = this.sock.user;
          this.notifyStateChange();

          // Define presença como 'unavailable' (offline) para o celular receber notificações normalmente
          try {
            await this.sock.sendPresenceUpdate('unavailable');
          } catch (presenceErr) {
            // Ignora silenciosamente se houver falha na presença
          }
        }
      });
    } catch (err) {
      console.error('Erro ao inicializar WhatsApp Baileys:', err);
      this.status = 'disconnected';
      this.notifyStateChange();
    }
  }

  async logout() {
    try {
      if (this.sock) {
        await this.sock.logout();
      }
    } catch (e) {
      // Ignora erro se já estiver desconectado
    }
    this.clearAuth();
    this.status = 'disconnected';
    this.user = null;
    this.qrCodeDataUrl = null;
    this.notifyStateChange();
    // Reinicia para gerar novo QR Code
    setTimeout(() => this.init(), 1500);
  }

  clearAuth() {
    try {
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
      }
    } catch (e) {
      console.error('Erro ao remover pasta de autenticação:', e);
    }
  }

  normalizePhoneNumber(rawNumber) {
    if (!rawNumber) return null;
    // Remove tudo que não for dígito
    let clean = rawNumber.toString().replace(/\D/g, '');

    // Se começou sem DDI 55 (Brasil) e tem DDD (10 ou 11 dígitos), adiciona 55
    if (clean.length === 10 || clean.length === 11) {
      clean = '55' + clean;
    }

    return clean;
  }

  async formatAndResolveJid(rawNumber) {
    const cleanNumber = this.normalizePhoneNumber(rawNumber);
    if (!cleanNumber || cleanNumber.length < 10) {
      throw new Error(`Número de telefone inválido: "${rawNumber}". Inclua o DDD com 2 dígitos.`);
    }

    if (!this.sock || this.status !== 'connected') {
      throw new Error('WhatsApp não está conectado no momento. Escaneie o QR Code primeiro.');
    }

    // Consulta o WhatsApp para descobrir o JID canônico exato
    try {
      const results = await this.sock.onWhatsApp(cleanNumber);
      if (results && results.length > 0 && results[0].exists) {
        return results[0].jid;
      }
    } catch (e) {
      console.warn('Erro ao consultar onWhatsApp, usando JID padrão:', e.message);
    }

    // Fallback: monta jid padrão caso onWhatsApp não responda
    return `${cleanNumber}@s.whatsapp.net`;
  }

  async sendTextMessage(rawNumber, text) {
    if (this.status !== 'connected' || !this.sock) {
      throw new Error('WhatsApp desconectado. Conecte pelo QR Code antes de enviar.');
    }

    const jid = await this.formatAndResolveJid(rawNumber);
    const sent = await this.sock.sendMessage(jid, { text });
    return {
      messageId: sent?.key?.id,
      jid,
      timestamp: new Date()
    };
  }

  getStatus() {
    return {
      status: this.status,
      qrCodeDataUrl: this.qrCodeDataUrl,
      user: this.user ? {
        id: this.user.id?.split(':')[0],
        name: this.user.name || 'Conectado'
      } : null
    };
  }
}

module.exports = new WhatsAppService();
