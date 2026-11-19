let predictionState = {
  title: '',
  status: 'IDLE', // IDLE | ACTIVE | LOCKED | RESOLVED | CANCELLED
  totalDuration: 0,
  remainingTime: 0,
  winningOptionId: null,
  isVisible: false,
  options: []
};

let timerInterval = null;
let autoHideTimeout = null;
let onStateChangeCallback = null;

const broadcastChannel = new BroadcastChannel('twitch_prediction_channel');

export function getState() {
  return predictionState;
}

export function setOnStateChange(callback) {
  onStateChangeCallback = callback;
}

export function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

export function clearAutoHide() {
  if (autoHideTimeout) {
    clearTimeout(autoHideTimeout);
    autoHideTimeout = null;
  }
}

export function resetStateMachine(newStatus = 'IDLE') {
  stopTimer();
  clearAutoHide();
  predictionState.status = newStatus;
  predictionState.winningOptionId = null;
  predictionState.isVisible = newStatus !== 'IDLE';
}

export function scheduleAutoHide(delayMs = 15000) {
  clearAutoHide();
  autoHideTimeout = setTimeout(() => {
    updateState({
      isVisible: false,
      status: 'IDLE',
      winningOptionId: null,
      remainingTime: 0
    });
  }, delayMs);
}

export function updateState(newState, { broadcast = true } = {}) {
  predictionState = { ...predictionState, ...newState };

  if (broadcast) {
    try {
      localStorage.setItem('twitch_prediction_data', JSON.stringify(predictionState));
      broadcastChannel.postMessage(predictionState);
    } catch (e) {}
  }

  if (onStateChangeCallback) {
    onStateChangeCallback(predictionState);
  }
}

export function startTimerIfNeeded(onTick, onExpire) {
  stopTimer();
  if (predictionState.status === 'ACTIVE' && predictionState.remainingTime > 0) {
    timerInterval = setInterval(() => {
      if (predictionState.remainingTime > 1) {
        predictionState.remainingTime -= 1;
        try {
          localStorage.setItem('twitch_prediction_data', JSON.stringify(predictionState));
          broadcastChannel.postMessage(predictionState);
        } catch (e) {}
        if (onTick) onTick(predictionState);
      } else {
        predictionState.remainingTime = 0;
        predictionState.status = 'LOCKED';
        stopTimer();
        updateState(predictionState);
        scheduleAutoHide(15000);
        if (onExpire) onExpire();
      }
    }, 1000);
  }
}

export function hasActiveTimer() {
  return timerInterval !== null;
}

export function initCrossTabSync() {
  broadcastChannel.onmessage = (event) => {
    if (event.data) {
      updateState(event.data, { broadcast: false });
    }
  };

  window.addEventListener('storage', (event) => {
    if (event.key === 'twitch_prediction_data' && event.newValue) {
      try {
        updateState(JSON.parse(event.newValue), { broadcast: false });
      } catch (e) {}
    }
  });
}
