import { OPTION_COLORS, OPTION_PRESETS } from './config.js';
import {
  getState,
  updateState,
  setOnStateChange,
  resetStateMachine,
  stopTimer,
  clearAutoHide,
  scheduleAutoHide,
  startTimerIfNeeded,
  initCrossTabSync
} from './state.js';
import { initTwitchClient, toggleTwitchConnection } from './twitch.js';
import {
  renderOptionInputs,
  renderControls,
  renderOverlayWidget,
  initPingPongScroll,
  enableOverlayOnlyMode,
  toggleViewMode,
  updateConnectionStatus,
  showToast,
  triggerConfetti,
  refreshIcons
} from './ui.js';

function renderAll(state = getState()) {
  renderControls(state);
  renderOverlayWidget(state);
  initPingPongScroll(state);
}

function handleStartPrediction(e) {
  e.preventDefault();
  resetStateMachine('ACTIVE');

  const title = document.getElementById('input-title').value;
  const duration = parseInt(document.getElementById('input-timer').value, 10);
  const optionElements = document.querySelectorAll('.option-input');

  const options = Array.from(optionElements).map((input, idx) => ({
    id: String(idx + 1),
    twitchId: '',
    title: input.value || `Opção ${idx + 1}`,
    votes: 0,
    usersCount: 0,
    color: OPTION_COLORS[idx % OPTION_COLORS.length],
    topPredictors: []
  }));

  updateState({
    title,
    status: 'ACTIVE',
    totalDuration: duration,
    remainingTime: duration,
    winningOptionId: null,
    isVisible: true,
    options
  });

  startTimerIfNeeded(renderOverlayWidget, () => showToast('Votações encerradas!'));
  showToast('Palpite Criado!');
}

function lockPrediction() {
  const state = getState();
  if (state.status === 'ACTIVE') {
    stopTimer();
    updateState({ status: 'LOCKED', remainingTime: 0, isVisible: true });
    showToast('Votações trancadas!');
    scheduleAutoHide(15000);
  }
}

function cancelPrediction() {
  resetStateMachine('CANCELLED');
  updateState({ status: 'CANCELLED', remainingTime: 0, winningOptionId: null, isVisible: true });
  showToast('Palpite cancelado!');
  scheduleAutoHide(3000);
}

function addVotes(optionId, amount) {
  const state = getState();
  if (state.status !== 'ACTIVE') return;

  const updatedOptions = state.options.map(opt =>
    opt.id === optionId
      ? { ...opt, votes: opt.votes + amount, usersCount: (opt.usersCount || 0) + 1 }
      : opt
  );
  updateState({ options: updatedOptions, isVisible: true });
}

function simulate10OptionsScenario() {
  resetStateMachine('ACTIVE');
  const optList = Array.from({ length: 10 }, (_, i) => ({
    id: String(i + 1),
    twitchId: '',
    title: `Opção ${i + 1}`,
    votes: Math.floor(Math.random() * 8000) + 1000,
    usersCount: Math.floor(Math.random() * 15) + 3,
    color: OPTION_COLORS[i % OPTION_COLORS.length],
    topPredictors: []
  }));

  updateState({
    title: 'Vamos escapar?',
    status: 'ACTIVE',
    totalDuration: 120,
    remainingTime: 120,
    winningOptionId: null,
    isVisible: true,
    options: optList
  });

  startTimerIfNeeded(renderOverlayWidget, () => showToast('Votações encerradas!'));
  showToast('Cenário de 10 Opções Simulado!');
}

function resolvePrediction(winnerId) {
  stopTimer();
  clearAutoHide();

  const state = getState();
  const updatedOptions = state.options.map(opt => {
    if (opt.id === winnerId) {
      return {
        ...opt,
        votes: opt.votes || 40500,
        usersCount: opt.usersCount || 24,
        topPredictors: [
          { name: 'Gaules', points: 10000, won: 25000 },
          { name: 'Alanzoka', points: 7500, won: 18750 },
          { name: 'Guifs', points: 5000, won: 12500 },
          { name: 'Mount', points: 4000, won: 10000 },
          { name: 'Cellbit', points: 3500, won: 8750 },
          { name: 'Rayan', points: 3000, won: 7500 },
          { name: 'Smitt', points: 2500, won: 6250 },
          { name: 'Xandig', points: 2000, won: 5000 }
        ]
      };
    }
    return {
      ...opt,
      votes: opt.votes || 32500,
      usersCount: opt.usersCount || 18,
      topPredictors: [
        { name: 'Casimiro', points: 8000, lost: 8000 },
        { name: 'Nobru', points: 6000, lost: 6000 },
        { name: 'PaulinhoOkb', points: 5000, lost: 5000 },
        { name: 'Coringa', points: 4000, lost: 4000 },
        { name: 'Loud_Luan', points: 3500, lost: 3500 },
        { name: 'Tequila', points: 2500, lost: 2500 },
        { name: 'Cerol', points: 2000, lost: 2000 },
        { name: 'Babi', points: 1500, lost: 1500 }
      ]
    };
  });

  updateState({
    status: 'RESOLVED',
    remainingTime: 0,
    winningOptionId: winnerId,
    options: updatedOptions,
    isVisible: true
  });

  triggerConfetti();
  showToast('Palpite Encerrado!');
}

function simulateHeavyResult() {
  simulate10OptionsScenario();
  setTimeout(() => {
    const firstOpt = getState().options[0];
    if (firstOpt) resolvePrediction(firstOpt.id);
  }, 500);
}

function copyOverlayUrl() {
  const url = `${window.location.origin}${window.location.pathname}?overlay=true`;
  navigator.clipboard?.writeText(url).catch(() => {});
  showToast('URL do OBS copiada!');
}

function bindEvents() {
  document.getElementById('btn-twitch-toggle')?.addEventListener('click', toggleTwitchConnection);
  document.getElementById('view-mode-btn')?.addEventListener('click', toggleViewMode);
  document.getElementById('btn-copy-url')?.addEventListener('click', copyOverlayUrl);
  document.getElementById('prediction-form')?.addEventListener('submit', handleStartPrediction);
  document.getElementById('btn-lock')?.addEventListener('click', lockPrediction);
  document.getElementById('btn-cancel')?.addEventListener('click', cancelPrediction);
  document.getElementById('btn-sim-10')?.addEventListener('click', simulate10OptionsScenario);
  document.getElementById('btn-sim-heavy')?.addEventListener('click', simulateHeavyResult);

  // Botões de tempo rápido
  document.querySelectorAll('[data-timer-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('input-timer').value = btn.dataset.timerPreset;
    });
  });

  // Botões de preset de opções
  document.querySelectorAll('[data-option-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const count = parseInt(btn.dataset.optionPreset, 10);
      renderOptionInputs(OPTION_PRESETS[count] || OPTION_PRESETS[2]);
    });
  });

  // Delegação de eventos dinâmicos (remover opção, simular voto, escolher vencedor)
  document.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove-option]');
    if (removeBtn) {
      const inputs = Array.from(document.querySelectorAll('.option-input')).map(i => i.value);
      const idx = parseInt(removeBtn.dataset.removeOption, 10);
      if (inputs.length > 2) {
        inputs.splice(idx, 1);
        renderOptionInputs(inputs);
      }
      return;
    }

    const voteBtn = e.target.closest('[data-sim-vote]');
    if (voteBtn) {
      addVotes(voteBtn.dataset.simVote, parseInt(voteBtn.dataset.amount, 10));
      return;
    }

    const resolveBtn = e.target.closest('[data-resolve-winner]');
    if (resolveBtn) {
      resolvePrediction(resolveBtn.dataset.resolveWinner);
    }
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('overlay') === 'true') {
    enableOverlayOnlyMode();
  }

  setOnStateChange(renderAll);
  initCrossTabSync();

  renderOptionInputs(['Sim', 'Não']);
  renderAll();
  bindEvents();

  initTwitchClient({
    onStatusChange: updateConnectionStatus,
    onToast: showToast,
    onTick: renderOverlayWidget,
    onWinnerConfetti: triggerConfetti
  });

  refreshIcons();
});
