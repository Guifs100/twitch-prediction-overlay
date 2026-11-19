export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { sessionId, eventType, eventTypes } = req.body || {};
  if (!sessionId) return res.status(400).json({ error: 'sessionId é obrigatório' });

  const typesToSubscribe = Array.isArray(eventTypes) && eventTypes.length > 0
    ? eventTypes
    : eventType
      ? [eventType]
      : [
          'channel.prediction.begin',
          'channel.prediction.progress',
          'channel.prediction.lock',
          'channel.prediction.end'
        ];

  const clientId = process.env.TWITCH_CLIENT_ID;
  const accessToken = process.env.TWITCH_ACCESS_TOKEN;
  const broadcasterId = process.env.TWITCH_BROADCASTER_ID;

  if (!clientId || !accessToken || !broadcasterId) {
    return res.status(500).json({
      error: 'Variáveis TWITCH_CLIENT_ID, TWITCH_ACCESS_TOKEN ou TWITCH_BROADCASTER_ID ausentes.'
    });
  }

  const twitchHeaders = {
    'Client-ID': clientId,
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  try {
    const listRes = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
      method: 'GET',
      headers: twitchHeaders
    });

    if (listRes.status === 429) {
      return res.status(429).json({ error: 'Rate limit da Twitch ao listar inscrições.' });
    }

    const listData = await listRes.json();
    const existingSubs = listData.data || [];

    // Remove inscrições antigas dos mesmos eventos de outras sessões WebSocket
    const subsToDelete = existingSubs.filter(sub =>
      typesToSubscribe.includes(sub.type) &&
      sub.transport?.method === 'websocket' &&
      sub.transport?.session_id !== sessionId
    );

    if (subsToDelete.length > 0) {
      await Promise.all(
        subsToDelete.map(sub =>
          fetch(`https://api.twitch.tv/helix/eventsub/subscriptions?id=${sub.id}`, {
            method: 'DELETE',
            headers: twitchHeaders
          })
        )
      );
    }

    // Cria as novas inscrições para a sessão atual
    const results = [];
    for (const type of typesToSubscribe) {
      const alreadyActive = existingSubs.some(
        sub =>
          sub.type === type &&
          sub.status === 'enabled' &&
          sub.transport?.session_id === sessionId
      );

      if (alreadyActive) {
        results.push({ type, status: 'already_subscribed' });
        continue;
      }

      const subRes = await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
        method: 'POST',
        headers: twitchHeaders,
        body: JSON.stringify({
          type,
          version: '1',
          condition: { broadcaster_user_id: broadcasterId },
          transport: { method: 'websocket', session_id: sessionId }
        })
      });

      if (subRes.status === 429) {
        return res.status(429).json({
          error: `Rate limit da Twitch ao inscrever em ${type}.`,
          subscribedSoFar: results
        });
      }

      const subData = await subRes.json();
      if (!subRes.ok) {
        return res.status(subRes.status).json({
          error: subData.message || `Erro ao inscrever em ${type}`,
          details: subData
        });
      }

      results.push({ type, status: 'subscribed', id: subData.data?.[0]?.id });
    }

    return res.status(200).json({
      ok: true,
      cleanedCount: subsToDelete.length,
      subscriptions: results
    });
  } catch (err) {
    console.error('Erro no /api/subscribe:', err);
    return res.status(500).json({ error: 'Erro interno ao gerenciar inscrições da Twitch.' });
  }
}
