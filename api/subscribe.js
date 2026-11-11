// api/subscribe.js

// Guarda o token renovado em memória temporária da instância Serverless
let cachedAccessToken = process.env.TWITCH_OAUTH_TOKEN;

/**
 * Função para obter um Access Token válido da Twitch.
 * Se o token atual estiver expirado, utiliza o Refresh Token para obter um novo.
 */
async function getValidAccessToken() {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const refreshToken = process.env.TWITCH_REFRESH_TOKEN;
  let currentToken = cachedAccessToken || process.env.TWITCH_OAUTH_TOKEN;

  // Remove o prefixo "oauth:" se tiver sido adicionado por engano
  if (currentToken && currentToken.startsWith('oauth:')) {
    currentToken = currentToken.replace('oauth:', '');
  }

  // 1. Valida o token atual na API da Twitch
  try {
    const validateRes = await fetch('https://id.twitch.tv/oauth2/validate', {
      headers: {
        'Authorization': `OAuth ${currentToken}`
      }
    });

    if (validateRes.ok) {
      cachedAccessToken = currentToken;
      return currentToken;
    }
  } catch (err) {
    console.warn('⚠️ Falha ao validar token atual da Twitch:', err.message);
  }

  // 2. Se o token expirou ou falhou, e temos o Refresh Token + Secret, tenta renovar
  if (refreshToken && clientSecret && clientId) {
    console.log('🔄 Token expirado. A tentar renovar via Refresh Token...');

    try {
      const refreshRes = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret
        })
      });

      const refreshData = await refreshRes.json();

      if (refreshRes.ok && refreshData.access_token) {
        console.log('✅ Novo Access Token gerado com sucesso via Refresh Token!');
        cachedAccessToken = refreshData.access_token;
        return refreshData.access_token;
      } else {
        console.error('❌ Erro ao renovar com Refresh Token:', refreshData);
      }
    } catch (err) {
      console.error('❌ Erro de rede na renovação do token:', err);
    }
  }

  // Retorna o token original em memória se a renovação falhar
  return currentToken;
}

export default async function handler(req, res) {
  // Configuração de CORS (permite requisições do seu frontend)
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responde imediatamente a requisições de preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas aceita chamadas do tipo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  const { sessionId, eventType } = req.body || {};

  // Validação basica de entrada
  if (!sessionId || !eventType) {
    return res.status(400).json({ 
      error: 'Parâmetros ausentes. Forneça sessionId e eventType no corpo da requisição.' 
    });
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const broadcasterId = process.env.TWITCH_BROADCASTER_ID;

  if (!clientId || !broadcasterId) {
    return res.status(500).json({ 
      error: 'Variáveis de ambiente TWITCH_CLIENT_ID ou TWITCH_BROADCASTER_ID não configuradas na Vercel.' 
    });
  }

  try {
    // Obter um Access Token válido (auto-refreshed se necessário)
    const token = await getValidAccessToken();

    // Faz a inscrição do evento EventSub diretamente na API Helix da Twitch
    const twitchRes = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: eventType,
        version: '1',
        condition: {
          broadcaster_user_id: broadcasterId
        },
        transport: {
          method: 'websocket',
          session_id: sessionId
        }
      })
    });

    const data = await twitchRes.json();

    if (!twitchRes.ok) {
      console.error(`❌ Erro da API da Twitch (${twitchRes.status}):`, data);
      return res.status(twitchRes.status).json(data);
    }

    console.log(`📡 Inscrição concluída com sucesso para o evento ${eventType}`);
    return res.status(200).json(data);

  } catch (error) {
    console.error('❌ Erro interno no servidor:', error);
    return res.status(500).json({ 
      error: 'Erro interno ao processar a inscrição na Twitch.',
      details: error.message 
    });
  }
}
