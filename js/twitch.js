import { VERCEL_API_URL, PREDICTION_EVENTS, OPTION_COLORS } from './config.js';
import {
  getState,
  updateState,
  resetStateMachine,
  stopTimer,
  clearAutoHide,
  scheduleAutoHide,
  startTimerIfNeeded,
  hasActiveTimer
} from './state.js';

let twitchSocket = null;
let reconnectTimeout = null;
let reconnectDelay = 5000;
let isTwitchEnabled = true;

let uiHooks = {
  onStatusChange: () => {},
  onToast: () => {},
  onTick: () => {},
  onWinnerConfetti: () => {}
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export function initTwitchClient(hooks) {
  uiHooks = { ...uiHooks, ...hooks };
  connectTwitchEventSub();
}

export function toggleTwitchConnection() {
  isTwitchEnabled = !isTwitchEnabled;

  if (isTwitchEnabled) {
    reconnectDelay = 5000;
    connectTwitchEventSub();
    uiHooks.onToast('Conectando à Twitch...');
  } else {
    clearTimeout(reconnectTimeout);
    if (twitchSocket) {
      twitchSocket.onclose = null;
      try { twitchSocket.close(); } catch (e) {}
      twitchSocket = null;
    }
    uiHooks.onStatusChange('offline', 'Twitch Pausada (Modo Local)');
    uiHooks.onToast('Conexão Twitch pausada neste painel');
  }
}

export function connectTwitchEventSub() {
  if (!isTwitchEnabled) return;

  clearTimeout(reconnectTimeout);
  if (twitchSocket) {
    twitchSocket.onclose = null;
    try { twitchSocket.close(); } catch (e) {}
  }

  uiHooks.onStatusChange('connecting', 'Conectando à Twitch...');
  twitchSocket = new WebSocket('wss://eventsub.wss.twitch.tv/ws');

  twitchSocket.onopen = () => {
    console.log('✅ Conectado ao WebSocket EventSub da Twitch!');
    reconnectDelay = 5000;
  };

  twitchSocket.onmessage = async (event) => {
    const response = JSON.parse(event.data);
    const messageType = response.metadata.message_type;

    if (messageType === 'session_welcome') {
      const sessionId = response.payload.session.id;
      uiHooks.onStatusChange('connecting', 'Limpando e inscrevendo eventos...');

      const ok = await subscribeAllEventsWithRetry(sessionId, PREDICTION_EVENTS);
      if (ok) {
        uiHooks.onStatusChange('connected', 'Conectado à Twitch');
      } else {
        uiHooks.onStatusChange('error', 'Limite de requisições (429)');
      }
    }

    if (messageType === 'session_reconnect') {
      const reconnectUrl = response.payload.session.reconnect_url;
      if (reconnectUrl) {
        twitchSocket.close();
      }
    }

    if (messageType === 'notification') {
      const subscriptionType = response.metadata.subscription_type;
      const eventData = response.payload.event;
      handleTwitchPredictionNotification(subscriptionType, eventData);
    }
  };

  twitchSocket.onerror = (err) => {
    console.error('❌ Erro WebSocket:', err);
    uiHooks.onStatusChange('error', 'Erro na Conexão');
  };

  twitchSocket.onclose = () => {
    if (!isTwitchEnabled) return;
    const secs = Math.round(reconnectDelay / 1000);
    uiHooks.onStatusChange('connecting', `Reconectando em ${secs}s...`);
    reconnectTimeout = setTimeout(() => {
      reconnectDelay = Math.min(reconnectDelay * 2, 30000);
      connectTwitchEventSub();
    }, reconnectDelay);
  };
}

async function subscribeAllEventsWithRetry(sessionId, eventTypes, attempt = 1) {
  try {
    const res = await fetch(VERCEL_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, eventTypes })
    });

    if (res.status === 429) {
      console.warn(`⏳ Erro 429 na API. Tentativa ${attempt}/3 aguardando ${5 * attempt}s...`);
      if (attempt < 3) {
        await sleep(5000 * attempt);
        return subscribeAllEventsWithRetry(sessionId, eventTypes, attempt + 1);
      }
      return false;
    }

    const data = await res.json();
    if (res.ok) {
      console.log(`🧹 ${data.cleanedCount || 0} inscrições antigas removidas.`);
      console.log('📡 Eventos inscritos:', data.subscriptions);
      return true;
    } else {
      console.error('⚠️ Falha na inscrição:', data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erro de conexão com Vercel:', error);
    return false;
  }
}

function mapTwitchOutcomes(outcomes = [], existingOptions = [], winningId = null) {
  return outcomes.map((o, idx) => {
    const prevOpt = existingOptions.find(prev => prev.twitchId && prev.twitchId === o.id) || existingOptions[idx];
    const isWinnerOpt = Boolean(winningId && o.id === winningId);

    let predictors = [];
    if (Array.isArray(o.top_predictors) && o.top_predictors.length > 0) {
      predictors = o.top_predictors.map(p => {
        const used = Number(p.channel_points_used) || 0;
        const won = p.channel_points_won != null ? Number(p.channel_points_won) : 0;
        return {
          userId: p.user_id || '',
          name: p.user_name || p.user_login || 'Usuário',
          points: used,
          won: isWinnerOpt ? won : 0,
          lost: isWinnerOpt ? 0 : used
        };
      });
    } else if (prevOpt && Array.isArray(prevOpt.topPredictors)) {
      predictors = prevOpt.topPredictors.map(p => ({
        ...p,
        won: isWinnerOpt ? (p.won || 0) : 0,
        lost: isWinnerOpt ? 0 : (p.points || 0)
      }));
    }

    return {
      id: prevOpt ? prevOpt.id : String(idx + 1),
      twitchId: o.id || (prevOpt ? prevOpt.twitchId : ''),
      title: o.title || (prevOpt ? prevOpt.title : `Opção ${idx + 1}`),
      votes: Number(o.channel_points ?? prevOpt?.votes ?? 0),
      usersCount: Number(o.users ?? prevOpt?.usersCount ?? 0),
      color: prevOpt ? prevOpt.color : OPTION_COLORS[idx % OPTION_COLORS.length],
      topPredictors: predictors
    };
  });
}

function handleTwitchPredictionNotification(type, event) {
  const currentState = getState();

  if (type === 'channel.prediction.begin') {
    resetStateMachine('ACTIVE');

    const mappedOptions = mapTwitchOutcomes(event.outcomes || [], [], null);

    let remainingSecs = 120;
    if (event.locks_at) {
      const lockTime = new Date(event.locks_at).getTime();
      remainingSecs = Math.max(0, Math.floor((lockTime - Date.now()) / 1000));
    }

    updateState({
      title: event.title,
      status: 'ACTIVE',
      totalDuration: remainingSecs,
      remainingTime: remainingSecs,
      winningOptionId: null,
      isVisible: true,
      options: mappedOptions
    });

    startTimerIfNeeded(uiHooks.onTick, () => uiHooks.onToast('Votações encerradas!'));
    uiHooks.onToast(`Novo Palpite: "${event.title}"`);
  }

  if (type === 'channel.prediction.progress') {
    const mappedOptions = mapTwitchOutcomes(event.outcomes || [], currentState.options, null);

    let remainingSecs = currentState.remainingTime;
    if (event.locks_at && currentState.status === 'ACTIVE') {
      const lockTime = new Date(event.locks_at).getTime();
      remainingSecs = Math.max(0, Math.floor((lockTime - Date.now()) / 1000));
    }

    const nextStatus = currentState.status === 'IDLE' ? 'ACTIVE' : currentState.status;

    updateState({
      title: event.title || currentState.title,
      status: nextStatus,
      remainingTime: remainingSecs,
      isVisible: true,
      options: mappedOptions
    });

    if (!hasActiveTimer() && nextStatus === 'ACTIVE' && remainingSecs > 0) {
      startTimerIfNeeded(uiHooks.onTick, () => uiHooks.onToast('Votações encerradas!'));
    }
  }

  if (type === 'channel.prediction.lock') {
    stopTimer();
    const mappedOptions = event.outcomes
      ? mapTwitchOutcomes(event.outcomes, currentState.options, null)
      : currentState.options;

    updateState({
      title: event.title || currentState.title,
      status: 'LOCKED',
      remainingTime: 0,
      options: mappedOptions,
      isVisible: true
    });
    uiHooks.onToast('Votações encerradas!');
    scheduleAutoHide(15000);
  }

  if (type === 'channel.prediction.end') {
    stopTimer();
    clearAutoHide();

    const winningTwitchId = event.winning_outcome_id || null;
    const rawStatus = String(event.status || '').toUpperCase();
    const isResolved = rawStatus === 'RESOLVED' || Boolean(winningTwitchId);
    const status = isResolved ? 'RESOLVED' : 'CANCELLED';

    const updatedOptions = mapTwitchOutcomes(
      event.outcomes || [],
      currentState.options,
      winningTwitchId
    );

    const winnerOpt = updatedOptions.find(
      o => (winningTwitchId && o.twitchId === winningTwitchId) || o.id === String(winningTwitchId)
    );
    const resolvedWinnerId = winnerOpt ? winnerOpt.id : null;

    updateState({
      title: event.title || currentState.title,
      status,
      remainingTime: 0,
      winningOptionId: resolvedWinnerId,
      options: updatedOptions,
      isVisible: true
    });

    if (status === 'RESOLVED') {
      uiHooks.onWinnerConfetti();
      uiHooks.onToast('Palpite Encerrado!');
      scheduleAutoHide(15000);
    } else {
      uiHooks.onToast('Palpite Cancelado!');
      scheduleAutoHide(5000);
    }
  }
}
