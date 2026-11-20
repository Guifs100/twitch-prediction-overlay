import { OPTION_COLORS } from './config.js';
import { getState } from './state.js';

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

export function triggerConfetti() {
  try {
    if (window.confetti) {
      window.confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
    }
  } catch (e) {}
}

export function showToast(message) {
  if (document.body.classList.contains('overlay-only')) return;

  const toast = document.getElementById('toast');
  const toastMsg = document.getElementById('toast-message');
  if (!toast || !toastMsg) return;

  toastMsg.innerText = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

export function updateConnectionStatus(type, text) {
  const dot = document.getElementById('status-dot');
  const label = document.getElementById('status-text');
  if (!dot || !label) return;

  label.innerText = text;
  if (type === 'connected') {
    dot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
  } else if (type === 'connecting') {
    dot.className = 'w-2 h-2 rounded-full bg-amber-500 animate-pulse';
  } else if (type === 'offline') {
    dot.className = 'w-2 h-2 rounded-full bg-gray-500';
  } else {
    dot.className = 'w-2 h-2 rounded-full bg-red-500';
  }
}

export function enableOverlayOnlyMode() {
  document.body.classList.add('overlay-only');
  document.getElementById('app-header')?.classList.add('hidden');
  document.getElementById('dual-view')?.classList.add('hidden');
  document.getElementById('overlay-only-view')?.classList.remove('hidden');
  const btnText = document.getElementById('view-mode-text');
  if (btnText) btnText.innerText = 'Voltar ao Painel Admin';
}

export function disableOverlayOnlyMode() {
  document.body.classList.remove('overlay-only');
  document.getElementById('app-header')?.classList.remove('hidden');
  document.getElementById('dual-view')?.classList.remove('hidden');
  document.getElementById('overlay-only-view')?.classList.add('hidden');
  const btnText = document.getElementById('view-mode-text');
  if (btnText) btnText.innerText = 'Apenas Overlay (OBS)';
}

export function toggleViewMode() {
  if (document.body.classList.contains('overlay-only')) {
    disableOverlayOnlyMode();
  } else {
    enableOverlayOnlyMode();
  }
}

export function renderOptionInputs(initialValues = ['Sim', 'Não']) {
  const container = document.getElementById('options-input-container');
  if (!container) return;
  container.innerHTML = '';

  initialValues.forEach((val, idx) => {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2';
    const color = OPTION_COLORS[idx % OPTION_COLORS.length];

    div.innerHTML = `
      <div class="w-3.5 h-3.5 rounded-full ${color.bg} shrink-0"></div>
      <input type="text" value="${escapeHtml(val)}" required placeholder="Opção ${idx + 1}" class="option-input flex-1 bg-[#0e0e10] border border-twitch-border focus:border-twitch-purple rounded-xl p-2.5 text-sm text-white focus:outline-none">
      ${initialValues.length > 2 ? `
        <button type="button" data-remove-option="${idx}" class="p-2 text-gray-500 hover:text-red-400">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      ` : ''}
    `;
    container.appendChild(div);
  });

  refreshIcons();
}

export function renderControls(state) {
  const titleInput = document.getElementById('input-title');
  if (titleInput && !titleInput.value) {
    titleInput.value = state.title;
  }

  const simContainer = document.getElementById('vote-simulation-controls');
  if (simContainer) {
    simContainer.innerHTML = '';
    state.options.forEach(opt => {
      const div = document.createElement('div');
      div.className = 'flex items-center justify-between gap-2 bg-[#0e0e10] p-2 rounded-xl border border-twitch-border';
      div.innerHTML = `
        <span class="text-xs font-semibold flex items-center gap-1.5 truncate">
          <span class="w-2.5 h-2.5 rounded-full ${opt.color.bg}"></span>
          ${escapeHtml(opt.title)}
        </span>
        <div class="flex items-center gap-1">
          <button data-sim-vote="${opt.id}" data-amount="100" class="bg-twitch-card hover:bg-gray-800 text-[10px] font-bold py-1 px-2 rounded-lg border border-twitch-border text-gray-300">+100</button>
          <button data-sim-vote="${opt.id}" data-amount="1000" class="bg-twitch-card hover:bg-gray-800 text-[10px] font-bold py-1 px-2 rounded-lg border border-twitch-border text-twitch-purple">+1k</button>
          <button data-sim-vote="${opt.id}" data-amount="5000" class="bg-twitch-card hover:bg-gray-800 text-[10px] font-bold py-1 px-2 rounded-lg border border-twitch-border text-emerald-400">+5k</button>
        </div>
      `;
      simContainer.appendChild(div);
    });
  }

  const resolveContainer = document.getElementById('resolve-controls');
  if (resolveContainer) {
    resolveContainer.innerHTML = '';
    state.options.forEach(opt => {
      const isWinner = state.winningOptionId === opt.id;
      const btn = document.createElement('button');
      btn.dataset.resolveWinner = opt.id;
      btn.className = `w-full text-xs font-bold py-2 px-3 rounded-xl border transition-all flex items-center justify-between ${
        isWinner
          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
          : 'bg-[#0e0e10] hover:bg-twitch-purple/20 border-twitch-border text-gray-300'
      }`;
      btn.innerHTML = `
        <span class="flex items-center gap-2">
          <i data-lucide="trophy" class="w-4 h-4 ${isWinner ? 'text-emerald-400' : 'text-gray-500'}"></i>
          Vencedor: "${escapeHtml(opt.title)}"
        </span>
        ${isWinner ? '<span class="text-[10px] uppercase bg-emerald-500/30 px-2 py-0.5 rounded font-black">Ativo</span>' : ''}
      `;
      resolveContainer.appendChild(btn);
    });
    refreshIcons();
  }

  const btnLock = document.getElementById('btn-lock');
  if (btnLock) {
    btnLock.disabled = state.status !== 'ACTIVE';
  }
}

export function renderOverlayWidget(state = getState()) {
  const containerDual = document.getElementById('overlay-widget-container');
  const containerStandalone = document.getElementById('overlay-standalone-container');

  const visibilityClass = state.isVisible && state.status !== 'IDLE' ? 'widget-visible' : 'widget-hidden';

  if (containerDual) containerDual.className = `w-full overlay-box-fixed widget-animated ${visibilityClass}`;
  if (containerStandalone) containerStandalone.className = `w-full overlay-box-fixed widget-animated ${visibilityClass}`;

  if (!state.options || state.options.length === 0) return;

  const totalVotes = state.options.reduce((acc, curr) => acc + curr.votes, 0);
  const totalParticipants = state.options.reduce((acc, curr) => acc + (curr.usersCount || 0), 0);

  const mins = Math.floor(state.remainingTime / 60);
  const secs = state.remainingTime % 60;
  const formattedTime = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

  const winnerOption = state.options.find(o => o.id === state.winningOptionId);
  const loserOptions = state.options.filter(o => o.id !== state.winningOptionId);

  const loserVotes = loserOptions.reduce((sum, o) => sum + o.votes, 0);
  const winnerVotes = winnerOption ? winnerOption.votes : 0;

  const returnRatio = winnerVotes > 0 ? (totalVotes / winnerVotes).toFixed(2) : '1.00';
  const returnPer1k = Math.round(1000 * parseFloat(returnRatio));

  const progressBarSegments = state.options
    .map(opt => {
      const pct = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(1) : (100 / state.options.length).toFixed(1);
      return `<div style="width: ${pct}%" class="h-full ${opt.color.bg} transition-all duration-500 relative"></div>`;
    })
    .join('');

  let statusBadge = '';
  if (state.status === 'ACTIVE') {
    statusBadge = `
      <div class="flex items-center gap-2 bg-purple-900/70 text-purple-200 border border-purple-500/50 px-4 py-1 rounded-full text-sm md:text-base font-bold animate-pulse whitespace-nowrap shadow">
        <i data-lucide="clock" class="w-4.5 h-4.5 text-twitch-accent"></i>
        <span>${formattedTime}</span>
      </div>`;
  } else if (state.status === 'LOCKED') {
    statusBadge = `
      <div class="flex items-center gap-2 bg-amber-900/70 text-amber-200 border border-amber-500/50 px-4 py-1 rounded-full text-sm md:text-base font-bold whitespace-nowrap shadow">
        <i data-lucide="lock" class="w-4.5 h-4.5"></i>
        <span>VOTAÇÕES ENCERRADAS</span>
      </div>`;
  } else if (state.status === 'RESOLVED') {
    statusBadge = `
      <div class="flex items-center gap-2 bg-emerald-900/70 text-emerald-200 border border-emerald-500/50 px-4 py-1 rounded-full text-sm md:text-base font-bold whitespace-nowrap shadow">
        <i data-lucide="trophy" class="w-4.5 h-4.5"></i>
        <span>RESULTADO FINAL</span>
      </div>`;
  } else {
    statusBadge = `
      <div class="flex items-center gap-2 bg-red-900/70 text-red-200 border border-red-500/50 px-4 py-1 rounded-full text-sm md:text-base font-bold whitespace-nowrap shadow">
        <i data-lucide="x-circle" class="w-4.5 h-4.5"></i>
        <span>CANCELADO</span>
      </div>`;
  }

  let resultDetailsHTML = '';
  if (state.status === 'RESOLVED' && winnerOption) {
    const sortedWinners = [...(winnerOption.topPredictors || [])].sort((a, b) => (b.won || b.points) - (a.won || a.points));
    const top3Winners = sortedWinners.slice(0, 3);
    const restWinners = sortedWinners.slice(3);

    const top3WinnersHTML = top3Winners
      .map((p, idx) => {
        const rank = idx + 1;
        const totalGanhos = p.won > 0
          ? p.won
          : (winnerVotes > 0 ? Math.round((p.points / winnerVotes) * totalVotes) : p.points);
        const lucroLiquido = Math.max(0, totalGanhos - p.points);

        let badgeColor = 'bg-amber-400 text-black border-amber-300';
        let rowBg = 'bg-emerald-950/90 border-emerald-500/50';
        if (rank === 2) {
          badgeColor = 'bg-gray-300 text-black border-gray-100';
          rowBg = 'bg-emerald-950/70 border-emerald-500/40';
        } else if (rank === 3) {
          badgeColor = 'bg-amber-700 text-white border-amber-600';
          rowBg = 'bg-emerald-950/60 border-emerald-500/30';
        }

        return `
          <div class="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 text-sm md:text-base ${rowBg} border px-3.5 py-2 rounded-xl shadow-md">
            <div class="w-5 h-5 md:w-6 md:h-6 rounded-full ${badgeColor} border font-black text-xs md:text-sm flex items-center justify-center shrink-0">${rank}º</div>
            <div class="min-w-0">
              <div class="font-bold text-white truncate text-xs md:text-base">${escapeHtml(p.name)}</div>
              <div class="text-[11px] md:text-xs text-gray-300 truncate">Apostou ${p.points.toLocaleString('pt-BR')} pts</div>
            </div>
            <div class="text-right whitespace-nowrap pl-2">
              <span class="font-extrabold text-emerald-400 block text-xs md:text-base">+${totalGanhos.toLocaleString('pt-BR')} pts</span>
              <span class="text-[10px] md:text-xs text-emerald-300 font-semibold">(Lucro: +${lucroLiquido.toLocaleString('pt-BR')})</span>
            </div>
          </div>`;
      })
      .join('');

    let restWinnersScrollHTML = '';
    if (restWinners.length > 0) {
      const listItems = restWinners
        .map((p, i) => {
          const rank = i + 4;
          const totalGanhos = p.won > 0
            ? p.won
            : (winnerVotes > 0 ? Math.round((p.points / winnerVotes) * totalVotes) : p.points);
          return `
            <div class="inline-flex items-center gap-1.5 bg-emerald-950/95 border border-emerald-500/50 px-3 py-1 rounded-lg text-xs md:text-sm whitespace-nowrap shrink-0 shadow">
              <strong class="text-emerald-400 text-xs md:text-sm">${rank}º</strong>
              <span class="text-white font-bold">${escapeHtml(p.name)}</span>
              <span class="text-emerald-300 font-extrabold">+${totalGanhos.toLocaleString('pt-BR')} pts</span>
            </div>`;
        })
        .join('');

      restWinnersScrollHTML = `
        <div class="mt-2 auto-scroll-container bg-black/70 p-2 rounded-xl border border-emerald-500/30 shadow-inner" data-pingpong>
          <div class="auto-scroll-track">${listItems}</div>
        </div>`;
    }

    const loserPredictors = loserOptions.flatMap(o =>
      (o.topPredictors || []).map(p => ({
        name: p.name,
        points: Number(p.points || p.lost || 0),
        optionTitle: o.title
      }))
    );
    const sortedLosers = [...loserPredictors].sort((a, b) => b.points - a.points);
    const top3Losers = sortedLosers.slice(0, 3);
    const restLosers = sortedLosers.slice(3);

    const top3LosersHTML = top3Losers
      .map((p, idx) => {
        const rank = idx + 1;
        return `
          <div class="grid grid-cols-[auto_1fr_auto] items-center gap-2.5 text-sm md:text-base bg-red-950/60 border border-red-500/40 px-3.5 py-2 rounded-xl shadow-md">
            <div class="w-5 h-5 md:w-6 md:h-6 rounded-full bg-red-900/90 text-red-200 border border-red-500/50 font-black text-xs md:text-sm flex items-center justify-center shrink-0">${rank}º</div>
            <div class="min-w-0">
              <div class="font-bold text-gray-100 truncate text-xs md:text-base">${escapeHtml(p.name)}</div>
              <div class="text-[11px] md:text-xs text-gray-400 truncate">Apostou em: ${escapeHtml(p.optionTitle || 'Outra opção')}</div>
            </div>
            <div class="text-right whitespace-nowrap pl-2">
              <span class="font-extrabold text-red-400 block text-xs md:text-base">-${p.points.toLocaleString('pt-BR')} pts</span>
            </div>
          </div>`;
      })
      .join('');

    let restLosersScrollHTML = '';
    if (restLosers.length > 0) {
      const listItems = restLosers
        .map((p, i) => {
          const rank = i + 4;
          return `
            <div class="inline-flex items-center gap-1.5 bg-red-950/80 border border-red-500/40 px-3 py-1 rounded-lg text-xs md:text-sm whitespace-nowrap shrink-0 shadow">
              <strong class="text-red-400 text-xs md:text-sm">${rank}º</strong>
              <span class="text-gray-200 font-bold">${escapeHtml(p.name)}</span>
              <span class="text-red-400 font-extrabold">-${p.points.toLocaleString('pt-BR')} pts</span>
            </div>`;
        })
        .join('');

      restLosersScrollHTML = `
        <div class="mt-2 auto-scroll-container bg-black/70 p-2 rounded-xl border border-red-500/30 shadow-inner" data-pingpong>
          <div class="auto-scroll-track">${listItems}</div>
        </div>`;
    }

    resultDetailsHTML = `
      <div class="mb-3.5 p-3.5 md:p-4 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-emerald-900/50 to-emerald-950/95 border-2 border-emerald-500/50 shadow-2xl animate-glow-winner space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/30 pb-2">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 font-bold shrink-0 shadow">
              <i data-lucide="coins" class="w-4.5 h-4.5"></i>
            </div>
            <div>
              <div class="text-xs uppercase font-extrabold text-emerald-400 tracking-wider whitespace-nowrap">Resultado da Distribuição</div>
              <div class="text-xs md:text-base text-white font-semibold">Vencedor: <strong class="text-emerald-300 uppercase">${escapeHtml(winnerOption.title)}</strong> (${winnerOption.usersCount || 0} apostadores)</div>
            </div>
          </div>
          <div class="bg-black/60 border border-emerald-500/40 px-3 py-1 rounded-xl text-right whitespace-nowrap shadow">
            <div class="text-[10px] md:text-xs text-gray-300 font-bold uppercase">Retorno p/ 1k pts</div>
            <div class="text-sm md:text-base font-black text-emerald-400 font-display">+${returnPer1k.toLocaleString('pt-BR')} pts</div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div class="flex flex-col justify-between space-y-2 min-w-0 h-full">
            <div>
              <div class="text-xs md:text-sm font-black uppercase tracking-wider text-emerald-400 flex items-center justify-between whitespace-nowrap mb-1.5">
                <span class="flex items-center gap-1.5"><i data-lucide="trophy" class="w-4 h-4"></i> Top Ganhadores</span>
                <span class="text-xs md:text-sm text-emerald-300 font-bold">+${loserVotes.toLocaleString('pt-BR')} pts pool</span>
              </div>
              <div class="space-y-1.5">${top3WinnersHTML || '<div class="text-xs text-gray-400 italic">Sem ganhadores registrados</div>'}</div>
            </div>
            <div>${restWinnersScrollHTML}</div>
          </div>

          <div class="flex flex-col justify-between space-y-2 min-w-0 h-full">
            <div>
              <div class="text-xs md:text-sm font-black uppercase tracking-wider text-red-400 flex items-center justify-between whitespace-nowrap mb-1.5">
                <span class="flex items-center gap-1.5"><i data-lucide="trending-down" class="w-4 h-4"></i> Top Perdedores</span>
                <span class="text-xs md:text-sm text-red-300 font-bold">${loserVotes.toLocaleString('pt-BR')} pts perdidos</span>
              </div>
              <div class="space-y-1.5">${top3LosersHTML || '<div class="text-xs text-gray-400 italic">Sem perdedores registrados</div>'}</div>
            </div>
            <div>${restLosersScrollHTML}</div>
          </div>
        </div>
      </div>`;
  }

  const optionsCount = state.options.length;
  let gridColumnsClass = 'grid-cols-1 md:grid-cols-2';
  if (optionsCount === 3) gridColumnsClass = 'grid-cols-1 md:grid-cols-3';
  else if (optionsCount >= 4 && optionsCount <= 6) gridColumnsClass = 'grid-cols-2 md:grid-cols-3';
  else if (optionsCount > 6) gridColumnsClass = 'grid-cols-2 md:grid-cols-5';

  const optionsCardsHTML = state.options
    .map((opt, idx) => {
      const pct = totalVotes > 0 ? ((opt.votes / totalVotes) * 100).toFixed(0) : 0;
      const formattedVotes = opt.votes.toLocaleString('pt-BR');
      const participantsCount = opt.usersCount || 0;
      const isWinner = state.winningOptionId === opt.id;
      const isResolved = state.status === 'RESOLVED';

      const displayIndex = idx + 1;
      const isCompact = optionsCount >= 4;
      const isUltraCompact = optionsCount > 6;

      let cardStyle = 'glass-card border-white/15';
      let badgeResult = '';

      if (isResolved) {
        if (isWinner) {
          cardStyle = 'bg-gradient-to-br from-emerald-950/95 via-emerald-900/60 to-emerald-950/90 border-2 border-emerald-400 shadow-lg scale-[1.01]';
          badgeResult = `
            <span class="bg-emerald-500 text-black font-black text-xs md:text-sm px-2 py-0.5 rounded-md tracking-wider uppercase flex items-center gap-1 shadow-md whitespace-nowrap">
              <i data-lucide="trophy" class="w-3.5 h-3.5"></i> Win
            </span>`;
        } else {
          cardStyle = 'opacity-40 grayscale-[50%] glass-card border-red-500/40';
          badgeResult = `
            <span class="bg-red-500/20 text-red-400 border border-red-500/50 font-bold text-xs md:text-sm px-2 py-0.5 rounded-md tracking-wider uppercase whitespace-nowrap">
              Loss
            </span>`;
        }
      }

      return `
        <div class="${isUltraCompact ? 'p-3' : isCompact ? 'p-3.5' : 'p-4 md:p-5'} rounded-2xl transition-all duration-300 ${cardStyle} flex flex-col justify-between relative overflow-hidden shadow-md">
          <div class="absolute left-0 top-0 bottom-0 w-1.5 ${opt.color.bg}"></div>
          <div class="flex items-start justify-between gap-2 mb-1 pl-2">
            <span class="font-display font-extrabold ${isUltraCompact ? 'text-sm' : isCompact ? 'text-base' : 'text-lg md:text-xl'} text-white tracking-wide uppercase line-clamp-1">
              ${escapeHtml(opt.title)}
            </span>
            ${badgeResult}
          </div>
          <div class="flex items-end justify-between pl-2 mt-1">
            <div>
              <div class="${isUltraCompact ? 'text-2xl' : isCompact ? 'text-3xl' : 'text-3xl md:text-4xl'} font-black text-white font-display tracking-tight flex items-baseline gap-1">
                ${pct}<span class="text-xs md:text-sm font-bold text-gray-400">%</span>
              </div>
              <div class="text-xs md:text-sm text-gray-300 font-medium flex items-center gap-1.5 flex-wrap mt-0.5">
                <span class="flex items-center gap-1 text-twitch-purple font-bold"><i data-lucide="users" class="w-4 h-4"></i> ${participantsCount}</span>
                <span class="text-gray-500">•</span>
                <span class="text-gray-200 font-semibold">${formattedVotes} pts</span>
              </div>
            </div>
            <div class="${isUltraCompact ? 'w-7 h-7 text-xs' : isCompact ? 'w-8 h-8 text-sm' : 'w-9 h-9 text-base'} shrink-0 rounded-full ${opt.color.bg}/25 border-2 ${opt.color.border} flex items-center justify-center ${opt.color.text} font-extrabold overflow-hidden shadow">
              ${displayIndex}
            </div>
          </div>
        </div>`;
    })
    .join('');

  const widgetHTML = `
    <div class="glass-panel p-4 md:p-6 rounded-3xl shadow-2xl border-2 border-white/20 relative overflow-hidden">
      <div class="absolute -top-32 -right-32 w-64 h-64 bg-twitch-purple/20 rounded-full blur-3xl pointer-events-none"></div>

      <div class="flex items-center justify-between gap-3 mb-3.5 pb-2 border-b border-white/15">
        <div class="flex items-center gap-3 min-w-0">
          <div class="bg-twitch-purple p-2.5 rounded-2xl text-white shadow-lg shadow-twitch-purple/50 shrink-0">
            <i data-lucide="help-circle" class="w-6 h-6"></i>
          </div>
          <h3 class="font-display font-extrabold text-lg md:text-2xl text-white tracking-wide uppercase truncate">
            ${escapeHtml(state.title)}
          </h3>
        </div>
        ${statusBadge}
      </div>

      ${resultDetailsHTML}

      <div class="mb-3.5">
        <div class="h-4 w-full bg-black/70 rounded-full overflow-hidden p-0.5 border border-white/20 flex items-center gap-0.5 shadow-inner">
          ${progressBarSegments}
        </div>
        <div class="flex justify-between items-center mt-2 text-xs md:text-sm font-bold text-gray-300 px-1 flex-wrap gap-2">
          <span>Total Apostado: <strong class="text-white text-sm md:text-base">${totalVotes.toLocaleString('pt-BR')} pts</strong></span>
          <span class="flex items-center gap-1.5 text-twitch-accent font-extrabold text-sm md:text-base">
            <i data-lucide="users" class="w-4.5 h-4.5"></i> ${totalParticipants} Participantes na Live
          </span>
        </div>
      </div>

      <div class="grid ${gridColumnsClass} gap-2.5">${optionsCardsHTML}</div>

      <div class="mt-3.5 pt-2 flex items-center justify-between text-xs text-gray-400 font-medium border-t border-white/10">
        <span class="flex items-center gap-1.5 font-bold text-gray-300">
          <span class="w-2 h-2 rounded-full bg-twitch-purple animate-pulse"></span> Twitch Predictions Overlay
        </span>
      </div>
    </div>`;

  if (containerDual) containerDual.innerHTML = widgetHTML;
  if (containerStandalone) containerStandalone.innerHTML = widgetHTML;

  refreshIcons();
}

export function initPingPongScroll() {
  setTimeout(() => {
    const containers = document.querySelectorAll('[data-pingpong]');
    if (containers.length === 0) return;

    containers.forEach(container => {
      const track = container.querySelector('.auto-scroll-track');
      if (!track) return;

      const dist = track.scrollWidth - container.clientWidth + 16;
      if (dist <= 0) return;

      let pos = 0;
      let direction = 1;
      const fixedSpeed = 0.8;
      let isWaiting = false;

      function step() {
        if (isWaiting) return;

        pos += fixedSpeed * direction;

        if (pos >= dist) {
          pos = dist;
          direction = -1;
          isWaiting = true;
          track.style.transform = `translateX(-${pos}px)`;

          setTimeout(() => {
            isWaiting = false;
            container._animId = requestAnimationFrame(step);
          }, 2000);
          return;
        } else if (pos <= 0) {
          pos = 0;
          direction = 1;
          isWaiting = true;
          track.style.transform = `translateX(-${pos}px)`;

          setTimeout(() => {
            isWaiting = false;
            container._animId = requestAnimationFrame(step);
          }, 2000);
          return;
        }

        track.style.transform = `translateX(-${pos}px)`;
        container._animId = requestAnimationFrame(step);
      }

      if (container._animId) cancelAnimationFrame(container._animId);
      container._animId = requestAnimationFrame(step);
    });
  }, 200);
}
