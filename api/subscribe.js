export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { sessionId, eventType } = req.body;

  // Variáveis salvas com segurança no painel da Vercel
  const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
  const OAUTH_TOKEN = process.env.TWITCH_OAUTH_TOKEN;
  const BROADCASTER_ID = process.env.TWITCH_BROADCASTER_ID;

  if (!sessionId || !eventType) {
    return res.status(400).json({ error: 'Parâmetros ausentes' });
  }

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
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
