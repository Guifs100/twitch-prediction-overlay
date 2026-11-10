export default async function handler(req, res) {
  // 1. Configurar CORS para permitir requisições do seu frontend/OBS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Tratar requisição preflight de CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId, eventType } = req.body;

  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  let OAUTH_TOKEN = process.env.TWITCH_OAUTH_TOKEN || '';
  const BROADCASTER_ID = process.env.TWITCH_BROADCASTER_ID;

  if (!sessionId || !eventType) {
    return res.status(400).json({ error: 'Parâmetros ausentes (sessionId ou eventType)' });
  }

  // 2. Limpar o token caso ele tenha vindo com 'oauth:' ou 'Bearer ' duplicado
  OAUTH_TOKEN = OAUTH_TOKEN.replace(/^oauth:/i, '').replace(/^bearer\s+/i, '').trim();

  try {
    const response = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'POST',
      headers: {
        'Client-ID': CLIENT_ID,
        'Authorization': `Bearer ${OAUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: eventType,
        version: '1',
        condition: { broadcaster_user_id: BROADCASTER_ID },
        transport: {
          method: 'websocket',
          session_id: sessionId
        }
      })
    });

    const data = await response.json();

    // Se a Twitch retornar erro, exibe nos logs da Vercel para fácil depuração
    if (!response.ok) {
      console.error('Erro retornado pela Twitch Helix API:', data);
    }

    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Erro de conexão no handler:', error);
    return res.status(500).json({ error: error.message });
  }
}
