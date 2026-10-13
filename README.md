# 💌 Zap Romântico - Mensagens Diárias para Ela

Um painel web completo e automatizado que envia uma mensagem de carinho todo dia às **14:30** (ou no horário que você escolher) para a sua namorada no WhatsApp.

---

## ✨ Funcionalidades

- **📱 Conexão via QR Code:** Escaneie uma única vez pelo WhatsApp (igual ao WhatsApp Web). A sessão fica salva no seu computador.
- **⏰ Agendador Diário:** Dispara todo dia no horário escolhido (padrão: 14:30, horário de Brasília).
- **🤖 Inteligência Artificial (Google Gemini) ou Backup:** Gera frases carinhosas, inéditas e espontâneas todos os dias, considerando o jeitinho dela, apelidos e piadas internas.
- **🛡️ 100% à Prova de Falhas:** Se a internet ou a IA falhar, o sistema ativa automaticamente uma curadoria de mais de 50 mensagens românticas selecionadas.
- **⚡ Teste Imediato:** Botão no painel para disparar uma mensagem de teste na hora e ver se deu certo.
- **👁️ Prévia ao Vivo:** Veja como a mensagem vai aparecer no WhatsApp dela antes de enviar.
- **📜 Histórico:** Registro de todas as mensagens enviadas e horários.

---

## 🚀 Como Iniciar

1. Abra o terminal na pasta do projeto:
   ```bash
   cd zap-namorada
   ```

2. Inicie o servidor:
   ```bash
   npm start
   ```

3. Abra o seu navegador e acesse:
   👉 **[http://localhost:3001](http://localhost:3001)**

---

## 📲 Passo a Passo para Conectar

1. No painel em `http://localhost:3001`, você verá um **QR Code**.
2. Abra o **WhatsApp** no seu celular:
   - No iPhone: **Configurações** > **Aparelhos Conectados** > **Conectar um aparelho**.
   - No Android: Menu de 3 pontinhos > **Aparelhos Conectados** > **Conectar um aparelho**.
3. Aponte a câmera para o QR Code na tela.
4. Pronto! O painel exibirá o selo verde **"Conectado"**.
5. Preencha o **número de telefone dela** (com DDD, ex: `11999998888`), seus apelidos, e clique em **Salvar Configurações**.
6. Clique no botão roxo **"Enviar Teste no WhatsApp Dela"** para testar na hora!

---

## 🤖 Como colocar a Inteligência Artificial (Opcional, 100% Grátis)

O sistema já vem com dezenas de frases prontas e funciona perfeitamente sem nenhuma configuração extra.

Mas se você quiser que a IA crie mensagens **100% inéditas todos os dias**:
1. Acesse o [Google AI Studio](https://aistudio.google.com/app/apikey) (é grátis).
2. Clique em **Create API key** e copie a chave.
3. Cole no campo correspondente no painel web e clique em **Salvar Configurações**.

---

## 🔄 Como deixar rodando 24 horas por dia

Para que a mensagem das 14:30 seja enviada, o computador precisa estar ligado com o processo rodando:

### Opção A: No terminal simples
Basta deixar a aba do terminal aberta com `npm start`.

### Opção B: Em segundo plano (PM2)
Se quiser que o robô rode sem precisar de terminal aberto e reinicie sozinho se o Mac reiniciar:
```bash
npm install -g pm2
pm2 start server.js --name "zap-namorada"
pm2 save
```
Para ver o status:
```bash
pm2 status
```
Para parar:
```bash
pm2 stop zap-namorada
```
