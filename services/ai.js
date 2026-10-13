// services/ai.js

const DEFAULT_TEMPLATES = {
  remedio: [
    "Oi {nome}! Passando pra te lembrar de tomar o seu remédio agora! Já tomou? Te amo! 💊❤️",
    "Alarme do amor ativado: hora do seu remédio, {nome}! Cuida de você que eu cuido de te amar. Beijo! 💧🥰",
    "Passando rapidinho só pra conferir se você já tomou o remédio, princesa. Não esquece! Amo você! 💊✨",
    "Oi vida! Hora do remedinho! Toma agora com bastante água pra não passar da hora, tá bom? Te amo! 🌸💊",
    "Lembrete carinhoso: seu remédio te espera! Se cuida, meu bem. Beijo grande! 💖💊",
    "Passando pra ser o seu alarme particular: hora do remédio, {nome}! Toma aí com água. Te amo muito! ⏰❤️"
  ],
  romantico: [
    "Oi {nome}! Passando no meio da tarde só pra te lembrar do quanto você é especial pra mim. Te amo demais! ❤️",
    "Passando rapidinho pra te dar um beijo virtual e dizer que meu dia fica muito mais leve quando penso em você, {nome}! ✨",
    "Oi vida! Só queria te lembrar que você é o melhor presente que a vida me deu. Tenha uma tarde maravilhosa! 💖",
    "Pensando em você aqui agora... Mal posso esperar pra gente se ver e eu te abraçar forte. Te amo muito, {nome}! 🥰",
    "Oi meu amor! Só uma paradinha no dia pra te dizer que sou completamente apaixonado por você. Beijo grande! 🌹",
    "Passando pra roubar um sorriso seu nessa tarde! Você é a razão dos meus melhores sorrisos, {nome}. ❤️",
    "Oi princesa! Espero que seu dia esteja sendo tão lindo quanto você. Te amo infinitamente! ✨",
    "Cada dia ao seu lado é uma sorte danada. Passando só pra te lembrar disso, {nome}! Amo você! 💘"
  ],
  fofo: [
    "Oii meu bem! Passando pra mandar um cheiro e desejar uma tarde bem quentinha e tranquila pra você. Te amo! 🌸",
    "Tô aqui pensando no seu abraço... que saudade! Força aí no restinho da tarde, {nome}. Beijinho! 🐰💕",
    "Oi amorzinho! Só passando pra te lembrar de tomar água, respirar fundo e lembrar que tem alguém aqui que te ama muito! 🥤❤️",
    "Passando pra deixar um beijinho na sua bochecha e dizer que você é a coisinha mais linda desse mundo todinho! 🥰",
    "Oi vida! Se você pudesse ver o sorrisinho bobo que eu dou quando lembro de você... Tenha uma tarde fofa! 🍓✨",
    "Mandando um abraço bem apertado daqueles de urso pelo WhatsApp! Te amo, {nome}! 🐻💖"
  ],
  engracado: [
    "Alô? É da polícia do amor? Passando pra avisar que você roubou meu coração e não tem fiança que te solte! Te amo, {nome}! 😂❤️",
    "Oi gata! Passando pra avisar que você está no meu pensamento sem pagar aluguel desde a hora que eu acordei. Beijo! 😜💖",
    "Só passei pra te lembrar que entre você e uma pizza de chocolate... eu ainda escolho você (por pouco, mas escolho!). Amo você! 🍕❤️",
    "Pausa no seu trabalho/estudo pra lembrar que você tem o namorado mais sortudo do mundo por ter você. Beijo, vida! 💅✨",
    "Dizem que pensar na pessoa amada queima calorias. Se for verdade, eu devo estar sequinho hoje só de pensar em você! 😂🥰"
  ],
  motivador: [
    "Oi meu amor! Sei que a rotina cansa, mas você é incrível e muito forte. Falta pouco pro dia terminar, força aí! Te amo! 💪❤️",
    "Passando pra te lembrar do quanto eu me orgulho da sua dedicação e do seu esforço. Você vai longe, {nome}! Tô sempre torcendo por você. ✨",
    "Respira fundo, toma uma aguinha e confia no seu potencial! Você arrasa em tudo que faz. Te amo muito, princesa! 🌟💖",
    "Oi vida! Se a tarde estiver pesada, lembra que mais tarde tem a gente pra conversar e relaxar. Força aí! 🥰",
    "Nunca duvide da sua capacidade. Você é brilhante, esforçada e a pessoa mais incrível que conheço. Um beijo enorme! 🚀❤️"
  ],
  poetico: [
    "No meio do barulho do mundo, pensar em você é a minha paz favorita. Tenha uma linda tarde, {nome}. 🌿❤️",
    "Se o amor fosse medido em pensamentos, eu já teria construído um universo inteiro pra você hoje. Te amo muito! 🌌✨",
    "Você ilumina até as tardes mais cinzentas. Obrigado por existir e por ser meu porto seguro, meu bem. 🕊️💖",
    "A vida ficou muito mais colorida e bonita desde o dia em que você chegou. Um beijo suave nessa sua tarde! 🎨❤️"
  ]
};

function getRandomTemplate(tone, girlfriendName, yourName) {
  const list = DEFAULT_TEMPLATES[tone] || DEFAULT_TEMPLATES.remedio || DEFAULT_TEMPLATES.romantico;
  const randomIndex = Math.floor(Math.random() * list.length);
  let text = list[randomIndex];
  text = text.replace(/{nome}/g, girlfriendName || 'amor');
  text = text.replace(/{namorado}/g, yourName || 'seu amor');
  return text;
}

async function generateMessageWithGemini({
  apiKey,
  girlfriendName,
  yourName,
  tone,
  context,
  mode
}) {
  if (!apiKey) {
    throw new Error('Chave de API do Gemini não configurada.');
  }

  const isRemedio = tone === 'remedio' || (context && context.toLowerCase().includes('remédio')) || (context && context.toLowerCase().includes('remedio'));

  const prompt = `
Você é ${yourName || 'o namorado'}, escrevendo uma mensagem rápida, carinhosa e espontânea no WhatsApp para sua namorada (${girlfriendName || 'sua namorada'}).

${isRemedio ? `OBJETIVO PRINCIPAL DA MENSAGEM:
Lembrar com carinho, cuidado e preocupação para ela TOMAR O REMÉDIO DELA AGORA!
Lembre-a de tomar com água e não esquecer/procrastinar.` : ''}

Instruções cruciais:
- Horário da mensagem: tarde (por volta das 14h30/16h).
- Tom desejado: ${tone} (${isRemedio ? 'lembrete protetor de remédio com carinho e fofura' : 'romântico e espontâneo'}).
- Informações sobre ela / piadas internas / contexto: "${context || 'Lembrete de tomar o remédio no horário certo'}".
- Estilo: Linguagem natural do WhatsApp brasileiro, como alguém real digita. Use 1 a 3 frases curtas e calorosas.
- Use poucos emojis (1 a 3 no máximo) que façam sentido (ex: 💊, ❤️, 💧, 🥰).
- NÃO invente histórias mirabolantes a não ser que estejam no contexto.
- NÃO use saudações formais ("Prezada", "Olá, espero que esta mensagem o encontre bem").
- NÃO coloque aspas no texto de retorno. Retorne EXCLUSIVAMENTE o texto exato da mensagem para ser enviada.
`.trim();

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 200
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API [${model}] status ${response.status}: ${errText}`);
      }

      const data = await response.json();
      const generated = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (generated) {
        return generated.replace(/^["']|["']$/g, '').trim();
      }
    } catch (err) {
      lastError = err;
      console.warn(`Tentativa com ${model} falhou:`, err.message);
    }
  }

  throw lastError || new Error('Não foi possível obter resposta da IA Gemini.');
}

async function createDailyMessage(config) {
  const { mode, tone, girlfriendName, yourName, customPromptContext, geminiApiKey, customMessages, fixedMessage } = config;

  // 1. Modo 'fixed': Envia EXATAMENTE o texto que você escolheu/digitou
  if (mode === 'fixed') {
    let msg = fixedMessage || 'Oi meu amor! Passando pra te lembrar de tomar o seu remédio agora! Já tomou? Te amo! 💊❤️';
    msg = msg.replace(/{nome}/g, girlfriendName || 'amor');
    msg = msg.replace(/{namorado}/g, yourName || 'seu amor');
    return { text: msg, source: 'fixed_message' };
  }

  // 2. Modo 'custom': sorteia da sua lista pessoal de frases
  if (mode === 'custom' && Array.isArray(customMessages) && customMessages.length > 0) {
    const randomIndex = Math.floor(Math.random() * customMessages.length);
    let msg = customMessages[randomIndex];
    msg = msg.replace(/{nome}/g, girlfriendName || 'amor');
    msg = msg.replace(/{namorado}/g, yourName || 'seu amor');
    return { text: msg, source: 'custom_list' };
  }

  // 3. Se tem chave Gemini e o modo é 'ai' ou 'hybrid'
  if (geminiApiKey && (mode === 'ai' || mode === 'hybrid')) {
    try {
      const aiText = await generateMessageWithGemini({
        apiKey: geminiApiKey,
        girlfriendName,
        yourName,
        tone: tone || 'remedio',
        context: customPromptContext,
        mode
      });
      return { text: aiText, source: 'gemini_ai' };
    } catch (err) {
      console.error('Falha ao gerar mensagem via Gemini, recorrendo ao fallback:', err.message);
      if (mode === 'hybrid') {
        const fallback = getRandomTemplate(tone || 'remedio', girlfriendName, yourName);
        return { text: fallback, source: 'fallback_template', errorNote: err.message };
      }
      throw err;
    }
  }

  // 4. Fallback padrão
  const fallback = getRandomTemplate(tone || 'remedio', girlfriendName, yourName);
  return { text: fallback, source: 'curated_template' };
}

module.exports = {
  createDailyMessage,
  getRandomTemplate,
  generateMessageWithGemini,
  DEFAULT_TEMPLATES
};
