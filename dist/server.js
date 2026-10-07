import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
app.use(express.json());
const hotelContext = `
Você é o agente de concierge do Sanctuário Hotel & Spa.
Sua missão é responder com simpatia, elegância, discrição e rapidez.
Atenda perguntas sobre check-in, check-out, restaurantes, spa, quartos, amenities e pedidos do hóspede.
Se for necessário, encaminhe para atendimento humano de forma profissional.
`;
const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;
function localFallback(message) {
    const lower = message.toLowerCase();
    if (lower.includes('socorro') || lower.includes('m��dico') || lower.includes('emerg')) {
        return {
            reply: '⚠️ Estamos mobilizando o atendimento médico e a recepção imediatamente. Mantenha a calma e aguarde o contato do time da propriedade.',
            actionType: 'handover',
            actionPayload: {
                agentName: 'Recepção & Emergência',
                phone: '+55 11 9999-9988',
                isEmergency: true,
            },
        };
    }
    if (lower.includes('check-in') || lower.includes('check out') || lower.includes('check-out') || lower.includes('chegada')) {
        return {
            reply: '🕒 O check-in padrão é a partir das 15h e o check-out até às 12h. Em casos VIP, o atendimento pode ser flexível mediante disponibilidade.',
            actionType: 'faq',
            actionPayload: { topic: 'checkin_checkout' },
        };
    }
    if (lower.includes('spa') || lower.includes('massagem') || lower.includes('terma')) {
        return {
            reply: '💆 Temos tratamentos de spa, termas e massagens com horários a partir das 09h. Posso indicar as opções mais adequadas ao seu momento.',
            actionType: 'spa_booking',
            actionPayload: { topic: 'spa' },
        };
    }
    if (lower.includes('jantar') || lower.includes('restaurante') || lower.includes('cardápio')) {
        return {
            reply: '🍽️ Posso orientar sobre restaurantes, menu e experiências gastronômicas da propriedade. Também posso ajudar com pedidos do room service.',
            actionType: 'room_service',
            actionPayload: { topic: 'dining' },
        };
    }
    return {
        reply: 'Olá! Sou o agente virtual do hotel. Posso ajudar com reservas, amenidades, spa, restaurante e atendimento para hóspedes.',
        actionType: 'faq',
        actionPayload: { topic: 'general' },
    };
}
app.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'ProjetoSenai Agent', model: GEMINI_MODEL });
});
app.get('/api/agent/status', (_req, res) => {
    res.json({
        connected: Boolean(process.env.GEMINI_API_KEY),
        service: 'Google Gemini AI',
        model: GEMINI_MODEL,
        active: true,
        hotelConnected: Boolean(process.env.HOTEL_SERVICE_URL),
    });
});
app.post('/api/agent/chat', async (req, res) => {
    try {
        const { message, history = [] } = req.body;
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ error: 'Mensagem inválida.' });
        }
        if (ai && process.env.GEMINI_API_KEY) {
            try {
                const contents = [];
                for (const item of history.slice(-6)) {
                    contents.push({
                        role: item.role === 'assistant' ? 'model' : 'user',
                        parts: [{ text: item.text || '' }],
                    });
                }
                contents.push({
                    role: 'user',
                    parts: [{ text: message }],
                });
                const response = await ai.models.generateContent({
                    model: GEMINI_MODEL,
                    contents,
                    config: {
                        systemInstruction: hotelContext,
                        temperature: 0.6,
                    },
                });
                return res.json({
                    reply: response.text || 'Não foi possível gerar resposta no momento.',
                    source: 'gemini_ai',
                    model: GEMINI_MODEL,
                });
            }
            catch (error) {
                console.warn('Gemini fallback activated:', error);
            }
        }
        const fallback = localFallback(message);
        return res.json({
            ...fallback,
            source: 'local_fallback',
            model: GEMINI_MODEL,
        });
    }
    catch (error) {
        console.error('Unexpected error:', error);
        return res.status(500).json({
            reply: 'Houve uma falha temporária. Tente novamente em instantes.',
            source: 'error',
            model: GEMINI_MODEL,
        });
    }
});
app.listen(PORT, () => {
    console.log(`ProjetoSenai agent running on http://localhost:${PORT}`);
});
