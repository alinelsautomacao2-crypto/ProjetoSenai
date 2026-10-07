# Guia de Testes - ProjetoSenai Agent + Hotel

Este guia explica como testar os dois serviços integrados localmente e depois publicar em GitHub Pages.

## Teste Local (Desenvolvimento)

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Chave do Gemini API configurada

### Passo 1: Iniciar o Agente ProjetoSenai (Port 3001)

No repositório `alinelsautomacao2-crypto/ProjetoSenai`:

```bash
# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# Adicionar sua chave do Gemini
echo "GEMINI_API_KEY=your_actual_gemini_api_key_here" >> .env
echo "GEMINI_MODEL=gemini-2.5-flash" >> .env
echo "PORT=3001" >> .env

# Rodar em desenvolvimento
npm run dev
```

Saída esperada:
```
ProjetoSenai agent running on http://localhost:3001
```

### Passo 2: Iniciar o Hotel (Port 3000)

Em outro terminal, no repositório `alinelsautomacao2-crypto/hotel`:

```bash
# Instalar dependências
npm install

# Criar arquivo .env
cp .env.example .env

# Configurar gateway externo
echo "GEMINI_API_KEY=your_actual_gemini_api_key_here" >> .env
echo "PROJETO_SENAI_URL=http://localhost:3001" >> .env
echo "PORT=3000" >> .env

# Rodar em desenvolvimento
npm run dev
```

Saída esperada:
```
Sanctuário 5★ Full-Stack server running with Gemini AI at http://0.0.0.0:3000
External ProjectSenai bridge active: http://localhost:3001
```

### Passo 3: Testar os Endpoints

#### 3.1 Verificar Status do Agente

```bash
curl http://localhost:3001/health
```

Resposta esperada:
```json
{
  "ok": true,
  "service": "ProjetoSenai Agent",
  "model": "gemini-2.5-flash"
}
```

#### 3.2 Verificar Status do Hotel

```bash
curl http://localhost:3000/api/concierge/status
```

Resposta esperada:
```json
{
  "connected": true,
  "service": "Google Gemini AI",
  "model": "gemini-3.8-flash",
  "active": true,
  "hasApiKey": true,
  "connectedToProjectSenai": true
}
```

#### 3.3 Enviar Mensagem via Hotel → Agente

```bash
curl -X POST http://localhost:3000/api/concierge/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Quero reservar um jantar para duas pessoas no restaurante Éos",
    "history": []
  }'
```

Resposta esperada:
```json
{
  "reply": "🍽️ Terei satisfação em reservar uma mesa no Restaurante Éos para você. Qual horário prefere?",
  "source": "projectosenai_agent",
  "model": "gemini-2.5-flash",
  "actionType": "room_service",
  "actionPayload": {
    "topic": "dining"
  }
}
```

#### 3.4 Testar Fallback (Sem Chave do Gemini)

Remova a chave do Gemini do `.env`:
```bash
echo "GEMINI_API_KEY=" > .env
```

Refaça a requisição e verá a resposta do fallback local:
```json
{
  "reply": "🍽️ Posso orientar sobre restaurantes, menu e experiências gastronômicas da propriedade...",
  "source": "local_fallback",
  "model": "gemini-2.5-flash"
}
```

---

## Teste via GitHub Pages (Publicação)

GitHub Pages **não permite** executar backends Node.js diretamente. Você precisa fazer o deploy em um serviço externo como:

### Opção 1: Deploy em Render.com (Recomendado - Grátis)

#### 1.1 Fazer Deploy do ProjetoSenai

1. Acesse [render.com](https://render.com)
2. Crie uma conta e faça login
3. Clique em **New** → **Web Service**
4. Conecte o repositório `alinelsautomacao2-crypto/ProjetoSenai`
5. Configure:
   - **Name**: `projetosenai-agent`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     GEMINI_API_KEY=your_actual_key
     GEMINI_MODEL=gemini-2.5-flash
     PORT=3000
     ```
6. Clique em **Create Web Service**
7. Aguarde o deploy (cerca de 2-3 min)
8. Copie a URL gerada (ex: `https://projetosenai-agent.onrender.com`)

#### 1.2 Fazer Deploy do Hotel

1. Crie um novo Web Service no Render
2. Conecte o repositório `alinelsautomacao2-crypto/hotel`
3. Configure:
   - **Name**: `sanctuario-hotel`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     ```
     GEMINI_API_KEY=your_actual_key
     PROJETO_SENAI_URL=https://projetosenai-agent.onrender.com
     PORT=3000
     ```
4. Clique em **Create Web Service**
5. Aguarde o deploy
6. A URL será algo como: `https://sanctuario-hotel.onrender.com`

#### 1.3 Testar via URL do Render

```bash
# Testar agente
curl https://projetosenai-agent.onrender.com/health

# Testar hotel conectado ao agente externo
curl -X POST https://sanctuario-hotel.onrender.com/api/concierge/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá, preciso de um atendimento especial",
    "history": []
  }'
```

---

### Opção 2: Deploy em Vercel (Com Serverless Functions)

#### 2.1 Modificar ProjetoSenai para Vercel

Crie arquivo `vercel.json`:

```json
{
  "buildCommand": "npm install",
  "devCommand": "npm run dev",
  "outputDirectory": "dist",
  "env": {
    "GEMINI_API_KEY": "@gemini_key",
    "GEMINI_MODEL": "gemini-2.5-flash"
  }
}
```

Deploy:
```bash
npm i -g vercel
vercel
```

---

### Opção 3: Usar GitHub Pages + API Mock (Apenas para Demonstração)

Se você quiser usar **GitHub Pages** para o frontend (sem backend), crie uma página de teste estática:

#### 3.1 Criar Página de Teste em GitHub Pages

No repositório `hotel`, crie:

```bash
mkdir -p docs
cd docs
```

Arquivo `docs/index.html`:

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sanctuário Hotel - Concierge AI</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 600px;
      padding: 40px;
    }
    h1 {
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }
    .subtitle {
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .status {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .status-dot.active { background: #4CAF50; }
    .status-dot.inactive { background: #f44336; }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }
    .chat-box {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;
      height: 400px;
    }
    .messages {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #fafafa;
    }
    .message {
      margin-bottom: 15px;
      display: flex;
      gap: 10px;
    }
    .message.user {
      justify-content: flex-end;
    }
    .message-bubble {
      max-width: 70%;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
    }
    .message.user .message-bubble {
      background: #667eea;
      color: white;
    }
    .message.assistant .message-bubble {
      background: #e0e0e0;
      color: #333;
    }
    .input-area {
      border-top: 1px solid #e0e0e0;
      padding: 15px;
      display: flex;
      gap: 10px;
      background: white;
    }
    input {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 10px 12px;
      font-size: 14px;
      font-family: inherit;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      background: #667eea;\n      color: white;
      border: none;
      border-radius: 6px;
      padding: 10px 20px;
      cursor: pointer;
      font-weight: 600;
      transition: background 0.3s;
    }
    button:hover {
      background: #5568d3;
    }
    button:disabled {
      background: #ccc;
      cursor: not-allowed;
    }
    .config-section {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
    }
    .config-section label {
      display: block;
      margin-bottom: 10px;
      font-size: 12px;
      font-weight: 600;
      color: #666;
    }
    .config-section input {
      width: 100%;
      margin-bottom: 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🏨 Sanctuário Hotel</h1>
    <p class=\"subtitle\">Concierge Virtual com Gemini AI</p>
    
    <div class=\"status\">
      <div class=\"status-dot active\"></div>
      <span id=\"status-text\">Conectando ao agente...</span>
    </div>

    <div class=\"chat-box\">
      <div class=\"messages\" id=\"messages\">
        <div class=\"message assistant\">
          <div class=\"message-bubble\">
            👋 Olá! Sou o concierge virtual do Sanctuário Hotel. Como posso ajudá-lo?
          </div>
        </div>
      </div>
      <div class=\"input-area\">
        <input type=\"text\" id=\"message-input\" placeholder=\"Digite sua mensagem...\">
        <button id=\"send-btn\" onclick=\"sendMessage()\">Enviar</button>
      </div>
    </div>

    <div class=\"config-section\">
      <label>URL do Servidor (ProjetoSenai):</label>
      <input type=\"text\" id=\"server-url\" placeholder=\"https://projetosenai-agent.onrender.com\" value=\"http://localhost:3001\">
      <button onclick=\"updateServerUrl()\" style=\"width: 100%; margin-top: 10px;\">Atualizar URL</button>
    </div>
  </div>

  <script>
    let serverUrl = localStorage.getItem('serverUrl') || 'http://localhost:3001';
    let messageHistory = [];

    document.getElementById('server-url').value = serverUrl;
    checkStatus();

    async function checkStatus() {
      try {
        const response = await fetch(`${serverUrl}/health`);
        if (response.ok) {
          document.getElementById('status-text').textContent = '✅ Agente conectado';
          document.querySelector('.status-dot').className = 'status-dot active';
        } else {
          throw new Error('Agent offline');
        }
      } catch (error) {
        document.getElementById('status-text').textContent = '❌ Agente desconectado';
        document.querySelector('.status-dot').className = 'status-dot inactive';
      }
    }

    function updateServerUrl() {
      serverUrl = document.getElementById('server-url').value.replace(/\\/$/, '');
      localStorage.setItem('serverUrl', serverUrl);
      checkStatus();
    }

    async function sendMessage() {
      const input = document.getElementById('message-input');
      const message = input.value.trim();

      if (!message) return;

      // Adicionar mensagem do usuário
      addMessage(message, 'user');
      input.value = '';
      document.getElementById('send-btn').disabled = true;

      messageHistory.push({ role: 'user', text: message });

      try {
        const response = await fetch(`${serverUrl}/api/agent/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history: messageHistory })
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        const reply = data.reply || 'Desculpe, não consegui processar sua solicitação.';

        addMessage(reply, 'assistant');
        messageHistory.push({ role: 'assistant', text: reply });
      } catch (error) {
        addMessage(`❌ Erro: ${error.message}`, 'assistant');
      } finally {
        document.getElementById('send-btn').disabled = false;
        document.getElementById('message-input').focus();
      }
    }

    function addMessage(text, role) {
      const messagesDiv = document.getElementById('messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${role}`;
      messageDiv.innerHTML = `<div class=\"message-bubble\">${escapeHtml(text)}</div>`;
      messagesDiv.appendChild(messageDiv);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }

    function escapeHtml(text) {
      const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;', \"'\": '&#039;' };
      return text.replace(/[&<>\"']/g, m => map[m]);
    }

    document.getElementById('message-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  </script>
</body>
</html>
```

#### 3.2 Ativar GitHub Pages

No repositório `hotel`:
1. Vá para **Settings** → **Pages**
2. Em "Source", selecione **Deploy from a branch**
3. Selecione **main** e pasta **docs**
4. Clique em **Save**

A página estará disponível em:
```
https://alinelsautomacao2-crypto.github.io/hotel/
```

---

## Fluxo de Teste Completo

### Teste 1: Local (Desenvolvimento)
```bash
# Terminal 1
cd ProjetoSenai
npm run dev  # Port 3001

# Terminal 2
cd hotel
npm run dev  # Port 3000

# Terminal 3 - Teste
curl -X POST http://localhost:3000/api/concierge/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Olá, como você está?", "history": []}'
```

### Teste 2: Produção (Render + GitHub Pages)

1. Deploy no Render dos dois serviços ✅
2. Acesse GitHub Pages no navegador
3. Configure a URL do servidor em `Sanctuário Hotel`
4. Envie uma mensagem de teste

---

## Checklist de Testes

- [ ] ProjetoSenai respondendo em `/health`
- [ ] Hotel conectando ao ProjetoSenai
- [ ] Mensagem sendo processada via Gemini
- [ ] Fallback funcionando sem chave
- [ ] GitHub Pages carregando interface
- [ ] Interface se conectando ao servidor remoto
- [ ] Conversa salvando histórico
- [ ] Emojis e formatação funcionando
- [ ] Responsivo em mobile

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| CORS error | Adicione `Access-Control-Allow-Origin: *` no servidor |
| 404 no /health | Verifique se ProjetoSenai está rodando na porta correta |
| Timeout na resposta | Chave do Gemini expirou ou limite de taxa atingido |
| GitHub Pages não atualiza | Force refresh (Ctrl+Shift+R) e limpe cache |

---

## Documentação Oficial

- [Render Deployment](https://render.com/docs)
- [GitHub Pages](https://pages.github.com/)
- [Google Gemini API](https://ai.google.dev/)
- [Express.js](https://expressjs.com/)

