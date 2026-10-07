# ProjetoSenai

Agente de atendimento do hotel usando Gemini AI, pronto para conectar ao repositório `alinelsautomacao2-crypto/hotel`.

## Visão geral

Este projeto cria um serviço HTTP isolado para o agente de concierge do hotel, com integração com a API do Google Gemini e fallback local quando a chave não estiver disponível.

## Configuração

1. Crie um arquivo `.env` a partir de `.env.example`
2. Adicione sua chave do Gemini em `GEMINI_API_KEY`
3. Execute:

```bash
npm install
npm run dev
```

## Endpoints

- `GET /health`
- `GET /api/agent/status`
- `POST /api/agent/chat`

## Exemplo de uso

```bash
curl -X POST http://localhost:3000/api/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Quero reservar um jantar para duas pessoas"}'
```

## Integração com o hotel

O projeto foi estruturado para receber as mensagens do app do hotel via HTTP e responder com inteligência de IA com contexto hoteleiro.

Se o repositório `hotel` estiver em execução e quiser enviar as conversas para este agente, configure a variável:

```env
HOTEL_SERVICE_URL=http://localhost:3000
```

ou use o endpoint desta API como backend central do concierge.
