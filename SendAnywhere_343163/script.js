/* ============================================================
   HabitFlow – script.js
   Fully functional Habit Tracker: no libraries, no backend.
   All data persisted to localStorage.
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────
   1. CONSTANTS & STATE
────────────────────────────────────────────── */

/** Motivational quotes, rotated daily */
const QUOTES = [
  "Small steps every day lead to big changes.",
  "Discipline is the bridge between goals and accomplishment.",
  "You don't rise to the level of your goals, you fall to the level of your systems.",
  "The secret of getting ahead is getting started.",
  "Consistency is not a talent, it's a choice.",
  "Success is the sum of small efforts repeated day in and day out.",
  "Either you run the day, or the day runs you.",
  "Your habits will carry you to places your motivation never could.",
  "One day or day one. You decide.",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
  "The chains of habit are too light to be felt until they are too heavy to be broken.",
  "It's not the mountain we conquer, but ourselves.",
  "Progress, not perfection.",
  "Fall seven times, stand up eight.",
  "A year from now you'll wish you had started today.",
  "Believe you can and you're halfway there.",
  "Don't watch the clock; do what it does. Keep going.",
  "Start where you are. Use what you have. Do what you can.",
  "Little by little, a little becomes a lot.",
  "You are what you do, not what you say you'll do.",
  "Make each day your masterpiece.",
  "Action is the foundational key to all success.",
  "Great things are done by a series of small things brought together.",
  "Showing up is half the battle.",
  "The best time to start was yesterday. The next best time is now.",
  "Hardships often prepare ordinary people for an extraordinary destiny.",
  "Dream big. Start small. Act now.",
  "Excellence is a habit, not an event.",
  "Your future self is watching you right now. Make them proud.",
  "Stay patient and trust your journey.",
  "Don't count the days — make the days count."
];

/** App-level state */
const state = {
  habits: [],            // [{id, name, color, datesCompleted:[]}]
  currentYear:  0,
  currentMonth: 0,       // 0-indexed (0=January)
  darkMode: false,
  editingHabitId: null,  // id of habit being edited (null = new)
  deletingHabitId: null, // id of habit pending delete confirm
  selectedColor: '#a78bfa',
  currentUserEmail: null, // email of the logged-in user (null = not logged in)
};

/* ──────────────────────────────────────────────
   2. DOM REFERENCES
────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const DOM = {
  body:              document.body,
  darkToggle:        $('dark-mode-toggle'),
  addHabitBtn:       $('add-habit-btn'),
  emptyAddBtn:       $('empty-add-btn'),
  emptyState:        $('empty-state'),

  // Auth
  authContainer:     $('auth-container'),
  appContainer:      $('app-container'),
  loginForm:         $('login-form'),
  registerForm:      $('register-form'),
  loginEmail:        $('login-email'),
  loginPassword:     $('login-password'),
  loginError:        $('login-error'),
  regEmail:          $('reg-email'),
  regPassword:       $('reg-password'),
  regConfirm:        $('reg-confirm'),
  regError:          $('reg-error'),
  goToRegister:      $('go-to-register'),
  goToLogin:         $('go-to-login'),
  logoutBtn:         $('logout-btn'),

  // Stats
  statTotal:         $('stat-total-val'),
  statToday:         $('stat-today-val'),
  statStreak:        $('stat-streak-val'),
  statWeek:          $('stat-week-val'),

  // Calendar
  monthTitle:        $('month-title'),
  prevMonthBtn:      $('prev-month-btn'),
  nextMonthBtn:      $('next-month-btn'),
  habitGrid:         $('habit-grid'),

  // Modal – add/edit
  modalOverlay:      $('habit-modal-overlay'),
  modalTitle:        $('modal-title'),
  modalCloseBtn:     $('modal-close-btn'),
  modalCancelBtn:    $('modal-cancel-btn'),
  habitForm:         $('habit-form'),
  habitNameInput:    $('habit-name-input'),
  nameError:         $('name-error'),
  colorSwatches:     document.querySelectorAll('.color-swatch'),

  // Modal – delete
  deleteOverlay:     $('delete-modal-overlay'),
  deleteCancelBtn:   $('delete-cancel-btn'),
  deleteConfirmBtn:  $('delete-confirm-btn'),

  // Quote
  dailyQuote:        $('daily-quote'),

  // Chart
  weeklyChart:       $('weekly-chart'),
  chartLegend:       $('chart-legend'),

  // Toast
  toastContainer:    $('toast-container'),
};

/* ──────────────────────────────────────────────
   3. LOCALSTORAGE HELPERS
────────────────────────────────────────────── */

/** Load the registered users list from localStorage */
function loadUsers() {
  try {
    const raw = localStorage.getItem('habitflow_users');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Save the registered users list to localStorage */
function saveUsers(users) {
  localStorage.setItem('habitflow_users', JSON.stringify(users));
}

/**
 * Load habits for the currently logged-in user.
 * Each user's habits are stored under: habitflow_data_<email>
 */
function loadData() {
  const email = state.currentUserEmail;
  if (!email) { state.habits = []; return; }
  try {
    const raw = localStorage.getItem(`habitflow_data_${email}`);
    state.habits = raw ? JSON.parse(raw) : [];
  } catch {
    state.habits = [];
  }
  try {
    state.darkMode = JSON.parse(localStorage.getItem('habitflow_dark')) || false;
  } catch {
    state.darkMode = false;
  }
}

/** Persist habits array to localStorage (per-user) */
function saveData() {
  const email = state.currentUserEmail;
  if (!email) return;
  localStorage.setItem(`habitflow_data_${email}`, JSON.stringify(state.habits));
}

/** Persist dark mode preference */
function saveDarkMode() {
  localStorage.setItem('habitflow_dark', JSON.stringify(state.darkMode));
}

/** Save session (which user is currently logged in) */
function saveSession() {
  if (state.currentUserEmail) {
    localStorage.setItem('habitflow_session', state.currentUserEmail);
  } else {
    localStorage.removeItem('habitflow_session');
  }
}

/** Load session from localStorage */
function loadSession() {
  return localStorage.getItem('habitflow_session') || null;
}

/* ──────────────────────────────────────────────
   4. DATE UTILITIES
────────────────────────────────────────────── */

/** Return today's date string as "YYYY-MM-DD" */
function todayStr() {
  return dateToStr(new Date());
}

/** Convert a Date object → "YYYY-MM-DD" string */
function dateToStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Build a "YYYY-MM-DD" string from parts */
function buildDateStr(year, month1, day) {
  return `${year}-${String(month1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

/** Number of days in a given month (1-indexed month) */
function daysInMonth(year, month1) {
  return new Date(year, month1, 0).getDate();
}

/**
 * Return the weekday (0=Su…6=Sa) of day 1 of the given month.
 * Used to figure out how many "blank" lead cells to render.
 */
function firstDayOfMonth(year, month1) {
  return new Date(year, month1 - 1, 1).getDay();
}

/** Long month name */
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

/* ──────────────────────────────────────────────
   5. STREAK CALCULATION
────────────────────────────────────────────── */

/**
 * Given a habit's datesCompleted array, calculates:
 *   { current: number, best: number }
 */
function calcStreaks(datesCompleted) {
  if (!datesCompleted || datesCompleted.length === 0) return { current: 0, best: 0 };

  // Sort dates ascending
  const sorted = [...new Set(datesCompleted)].sort();

  let best = 1, current = 1;
  let tempBest = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);
    // Diff in days
    const diff = Math.round((curr - prev) / 86400000);
    if (diff === 1) {
      tempBest++;
    } else {
      if (tempBest > best) best = tempBest;
      tempBest = 1;
    }
  }
  if (tempBest > best) best = tempBest;

  // Check if streak is ongoing (last date = today or yesterday)
  const lastDate = new Date(sorted[sorted.length - 1]);
  const today = new Date(todayStr());
  const daysSinceLast = Math.round((today - lastDate) / 86400000);

  if (daysSinceLast <= 1) {
    // Count streak backwards from the last date
    current = 1;
    for (let i = sorted.length - 2; i >= 0; i--) {
      const d1 = new Date(sorted[i]);
      const d2 = new Date(sorted[i + 1]);
      if (Math.round((d2 - d1) / 86400000) === 1) {
        current++;
      } else break;
    }
  } else {
    current = 0;
  }

  return { current, best };
}

/* ──────────────────────────────────────────────
   6. RENDER – MONTH TITLE
────────────────────────────────────────────── */
function renderMonthTitle() {
  DOM.monthTitle.textContent = `${MONTH_NAMES[state.currentMonth]} ${state.currentYear}`;
}

/* ──────────────────────────────────────────────
   7. RENDER – HABIT GRID
────────────────────────────────────────────── */

/**
 * Render the full habit grid for the current month.
 * Each habit gets a row containing:
 *   - name cell (with edit/delete)
 *   - 7-column days strip (with lead/trail blank cells for alignment)
 *   - underrow: progress bar + streak badges
 */
function renderGrid() {
  const { habits, currentYear, currentMonth } = state;
  const month1 = currentMonth + 1; // 1-indexed month
  const daysTotal = daysInMonth(currentYear, month1);
  const leadBlanks = firstDayOfMonth(currentYear, month1); // 0=Su
  const today = todayStr();

  DOM.habitGrid.innerHTML = '';

  if (habits.length === 0) {
    DOM.emptyState.classList.remove('hidden');
    return;
  }
  DOM.emptyState.classList.add('hidden');

  habits.forEach(habit => {
    // Outer row wrapper
    const rowWrap = document.createElement('div');
    rowWrap.className = 'habit-full-row';
    rowWrap.setAttribute('role', 'row');

    /* ---- Row 1: name + calendar cells ---- */
    const row = document.createElement('div');
    row.className = 'habit-row';
    row.dataset.habitId = habit.id;

    // Name cell
    const nameCell = document.createElement('div');
    nameCell.className = 'habit-name-cell';
    nameCell.setAttribute('role', 'rowheader');
    nameCell.innerHTML = `
      <div class="habit-color-dot" style="background:${habit.color}" aria-hidden="true"></div>
      <span class="habit-label" title="${escHtml(habit.name)}">${escHtml(habit.name)}</span>
      <div class="habit-actions">
        <button
          class="habit-action-btn edit"
          data-id="${habit.id}"
          aria-label="Edit habit: ${escHtml(habit.name)}"
          title="Edit"
        >✏️</button>
        <button
          class="habit-action-btn delete"
          data-id="${habit.id}"
          aria-label="Delete habit: ${escHtml(habit.name)}"
          title="Delete"
        >🗑️</button>
      </div>
    `;

    // Days strip
    const daysStrip = document.createElement('div');
    daysStrip.className = 'habit-days-strip';
    daysStrip.setAttribute('role', 'group');
    daysStrip.setAttribute('aria-label', `${habit.name} – days`);

    // We always show a full 7-column grid per week.
    // Days before month start are blanks; days after month end too.
    // Total cells = ceil((leadBlanks + daysTotal) / 7) * 7
    const totalCells = Math.ceil((leadBlanks + daysTotal) / 7) * 7;

    for (let cellIdx = 0; cellIdx < totalCells; cellIdx++) {
      const dayNum = cellIdx - leadBlanks + 1; // 1-based day; <=0 or >daysTotal = out of month
      const inMonth = dayNum >= 1 && dayNum <= daysTotal;
      const dateStr = inMonth ? buildDateStr(currentYear, month1, dayNum) : '';
      const isToday = dateStr === today;
      const isCompleted = inMonth && habit.datesCompleted.includes(dateStr);

      const cell = document.createElement('button');
      cell.className = 'day-cell';
      cell.dataset.inMonth = String(inMonth);
      cell.textContent = inMonth ? dayNum : '';

      if (inMonth) {
        cell.dataset.date = dateStr;
        cell.dataset.habitId = habit.id;
        cell.setAttribute('aria-label',
          `${habit.name}, ${MONTH_NAMES[currentMonth]} ${dayNum}` +
          (isCompleted ? ', completed' : ', not completed'));
        cell.setAttribute('aria-pressed', String(isCompleted));
        cell.setAttribute('role', 'button');
      } else {
        cell.setAttribute('aria-hidden', 'true');
        cell.tabIndex = -1;
      }

      if (isToday) cell.classList.add('today');

      if (isCompleted) {
        cell.classList.add('completed');
        cell.style.background = habit.color;
      }

      daysStrip.appendChild(cell);
    }

    row.appendChild(nameCell);
    row.appendChild(daysStrip);
    rowWrap.appendChild(row);

    /* ---- Row 2: progress bar + streaks ---- */
    const streaks = calcStreaks(habit.datesCompleted);
    // Completion % for this month
    const completedThisMonth = habit.datesCompleted.filter(d =>
      d.startsWith(`${currentYear}-${String(month1).padStart(2,'0')}`)
    ).length;
    const pct = daysTotal > 0 ? Math.round((completedThisMonth / daysTotal) * 100) : 0;

    const underrow = document.createElement('div');
    underrow.className = 'habit-underrow';
    underrow.setAttribute('aria-label', `${habit.name} progress: ${pct}% this month, current streak ${streaks.current}, best streak ${streaks.best}`);
    underrow.innerHTML = `
      <div class="progress-bar-wrap" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct}% complete this month">
        <div class="progress-bar-fill" style="width:0%; background:${habit.color}"></div>
      </div>
      <span class="habit-stat-badge" aria-hidden="true">${pct}%</span>
      <span class="streak-badge" title="Current streak / Best streak" aria-hidden="true">🔥 ${streaks.current} · ★ ${streaks.best}</span>
    `;
    rowWrap.appendChild(underrow);

    DOM.habitGrid.appendChild(rowWrap);

    // Animate progress bar fill after paint
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fill = underrow.querySelector('.progress-bar-fill');
        if (fill) fill.style.width = `${pct}%`;
      });
    });
  });

  // Attach day-cell click listeners
  DOM.habitGrid.querySelectorAll('.day-cell[data-in-month="true"]').forEach(cell => {
    cell.addEventListener('click', handleDayCellClick);
    cell.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDayCellClick.call(cell, e);
      }
    });
  });

  // Attach edit/delete listeners
  DOM.habitGrid.querySelectorAll('.habit-action-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  DOM.habitGrid.querySelectorAll('.habit-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
  });
}

/* ──────────────────────────────────────────────
   8. TOGGLE DAY COMPLETION
────────────────────────────────────────────── */

function handleDayCellClick(e) {
  const cell = e.currentTarget || this;
  const habitId = cell.dataset.habitId;
  const dateStr = cell.dataset.date;
  if (!habitId || !dateStr) return;

  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;

  const idx = habit.datesCompleted.indexOf(dateStr);
  const wasCompleted = idx !== -1;

  if (wasCompleted) {
    habit.datesCompleted.splice(idx, 1);
  } else {
    habit.datesCompleted.push(dateStr);
  }

  saveData();

  // Optimistic UI update on the cell
  if (!wasCompleted) {
    cell.classList.add('completed');
    cell.style.background = habit.color;
    cell.setAttribute('aria-pressed', 'true');
    cell.setAttribute('aria-label',
      cell.getAttribute('aria-label').replace(', not completed', ', completed'));
    // Ripple effect
    addRipple(cell);
  } else {
    cell.classList.remove('completed');
    cell.style.background = '';
    cell.setAttribute('aria-pressed', 'false');
    cell.setAttribute('aria-label',
      cell.getAttribute('aria-label').replace(', completed', ', not completed'));
  }

  // Update stats and underrow without full re-render
  updateStats();
  updateUnderrow(habitId);
  drawWeeklyChart();
}

/** Re-render only the underrow for a specific habit (avoids full grid repaint) */
function updateUnderrow(habitId) {
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  const month1 = state.currentMonth + 1;
  const daysTotal = daysInMonth(state.currentYear, month1);
  const completedThisMonth = habit.datesCompleted.filter(d =>
    d.startsWith(`${state.currentYear}-${String(month1).padStart(2,'0')}`)
  ).length;
  const pct = daysTotal > 0 ? Math.round((completedThisMonth / daysTotal) * 100) : 0;
  const streaks = calcStreaks(habit.datesCompleted);

  const rowWrap = DOM.habitGrid.querySelector(`.habit-row[data-habit-id="${habitId}"]`)?.parentElement;
  if (!rowWrap) return;
  const underrow = rowWrap.querySelector('.habit-underrow');
  if (!underrow) return;

  const fill = underrow.querySelector('.progress-bar-fill');
  const badge = underrow.querySelector('.habit-stat-badge');
  const streakBadge = underrow.querySelector('.streak-badge');

  if (fill) fill.style.width = `${pct}%`;
  if (badge) badge.textContent = `${pct}%`;
  if (streakBadge) streakBadge.textContent = `🔥 ${streaks.current} · ★ ${streaks.best}`;
}

/* ──────────────────────────────────────────────
   9. STATS ROW
────────────────────────────────────────────── */

function updateStats() {
  const { habits } = state;
  const today = todayStr();

  // Total habits
  DOM.statTotal.textContent = habits.length;

  // % done today
  if (habits.length === 0) {
    DOM.statToday.textContent = '—';
  } else {
    const doneToday = habits.filter(h => h.datesCompleted.includes(today)).length;
    DOM.statToday.textContent = `${Math.round((doneToday / habits.length) * 100)}%`;
  }

  // Overall best streak across all habits
  const bestStreak = habits.reduce((max, h) => {
    const { best } = calcStreaks(h.datesCompleted);
    return best > max ? best : max;
  }, 0);
  DOM.statStreak.textContent = `🔥 ${bestStreak}`;

  // This week's completion %
  const weekPct = calcWeekCompletion();
  DOM.statWeek.textContent = habits.length === 0 ? '—' : `${weekPct}%`;
}

/** Calculate overall completion % for the past 7 days */
function calcWeekCompletion() {
  const { habits } = state;
  if (habits.length === 0) return 0;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateToStr(d));
  }

  const totalSlots = habits.length * 7;
  const doneSlots = days.reduce((count, day) => {
    return count + habits.filter(h => h.datesCompleted.includes(day)).length;
  }, 0);

  return totalSlots > 0 ? Math.round((doneSlots / totalSlots) * 100) : 0;
}

/* ──────────────────────────────────────────────
   10. WEEKLY CHART (Canvas)
────────────────────────────────────────────── */

/**
 * Draws a bar chart on the <canvas> element.
 * X-axis: last 7 days (Su–Sa labels).
 * Y-axis: % of habits completed each day.
 * Each habit gets a stacked or grouped bar — we use a simple
 * "total completed / total habits" percentage per day.
 */
function drawWeeklyChart() {
  const canvas = DOM.weeklyChart;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const { habits } = state;

  // Build last-7-days data
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({ str: dateToStr(d), label: ['Su','Mo','Tu','We','Th','Fr','Sa'][d.getDay()] });
  }

  const isDark = state.darkMode;
  const accentColor = isDark ? '#c4b5fd' : '#a78bfa';
  const textColor   = isDark ? '#a1a1aa' : '#6b7280';
  const gridColor   = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  // HiDPI sizing
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  const W = rect.width;
  const H = 180;
  canvas.width  = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width  = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);

  ctx.clearRect(0, 0, W, H);

  const PAD_LEFT = 36, PAD_RIGHT = 16, PAD_TOP = 16, PAD_BOTTOM = 36;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  // Draw horizontal grid lines (0%, 25%, 50%, 75%, 100%)
  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  [0, 25, 50, 75, 100].forEach(pct => {
    const y = PAD_TOP + chartH - (pct / 100) * chartH;
    ctx.beginPath();
    ctx.moveTo(PAD_LEFT, y);
    ctx.lineTo(PAD_LEFT + chartW, y);
    ctx.stroke();

    // Y-axis labels
    if (pct % 50 === 0) {
      ctx.fillStyle = textColor;
      ctx.font = `500 10px Inter, sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`${pct}%`, PAD_LEFT - 6, y + 3.5);
    }
  });

  // Draw bars
  const barW = Math.min(32, (chartW / 7) * 0.55);
  const slotW = chartW / 7;

  days.forEach((day, i) => {
    const doneCount = habits.filter(h => h.datesCompleted.includes(day.str)).length;
    const pct = habits.length > 0 ? doneCount / habits.length : 0;
    const barH = pct * chartH;
    const x = PAD_LEFT + i * slotW + slotW / 2 - barW / 2;
    const y = PAD_TOP + chartH - barH;

    // Per-habit colored segments
    let segY = PAD_TOP + chartH;
    if (habits.length > 0 && doneCount > 0) {
      const completedHabits = habits.filter(h => h.datesCompleted.includes(day.str));
      const segH = barH / completedHabits.length;
      completedHabits.forEach(h => {
        segY -= segH;
        ctx.fillStyle = h.color + 'cc'; // slight transparency
        // Rounded top only on last segment
        roundedRect(ctx, x, segY, barW, segH, segY === y ? 5 : 0);
        ctx.fill();
      });
    } else {
      // Empty bar placeholder
      ctx.fillStyle = gridColor;
      roundedRect(ctx, x, PAD_TOP + chartH - 4, barW, 4, 2);
      ctx.fill();
    }

    // X-axis label
    const isToday = day.str === todayStr();
    ctx.fillStyle = isToday ? accentColor : textColor;
    ctx.font = `${isToday ? 700 : 500} 10px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(day.label, PAD_LEFT + i * slotW + slotW / 2, H - PAD_BOTTOM + 16);

    // Value label on bar
    if (doneCount > 0) {
      ctx.fillStyle = isDark ? '#e0e7ff' : '#312e81';
      ctx.font = `600 9px Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(pct * 100)}%`, x + barW / 2, y - 5);
    }
  });

  // Legend
  renderChartLegend();
}

/** Helper: draw a rounded-top rectangle path */
function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  if (r > 0 && h > r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.closePath();
}

function renderChartLegend() {
  DOM.chartLegend.innerHTML = '';
  state.habits.forEach(h => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <div class="legend-dot" style="background:${h.color}"></div>
      <span>${escHtml(h.name)}</span>
    `;
    DOM.chartLegend.appendChild(item);
  });
}

/* ──────────────────────────────────────────────
   11. DAILY QUOTE
────────────────────────────────────────────── */

function setDailyQuote() {
  // Pick a quote based on day-of-year so it's stable all day
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now - start) / 86400000);
  const quote = QUOTES[dayOfYear % QUOTES.length];
  DOM.dailyQuote.textContent = `"${quote}"`;
}

/* ──────────────────────────────────────────────
   12. DARK MODE
────────────────────────────────────────────── */

function applyDarkMode() {
  DOM.body.classList.toggle('dark', state.darkMode);
}

function toggleDarkMode() {
  state.darkMode = !state.darkMode;
  applyDarkMode();
  saveDarkMode();
  // Redraw chart with correct colors
  drawWeeklyChart();
}

/* ──────────────────────────────────────────────
   13. ADD / EDIT MODAL
────────────────────────────────────────────── */

function openAddModal() {
  state.editingHabitId = null;
  DOM.modalTitle.textContent = 'New Habit';
  DOM.habitNameInput.value = '';
  DOM.nameError.classList.add('hidden');
  DOM.habitNameInput.classList.remove('error');
  // Reset color selection
  state.selectedColor = '#a78bfa';
  DOM.colorSwatches.forEach(s => {
    const isActive = s.dataset.color === state.selectedColor;
    s.classList.toggle('active', isActive);
    s.setAttribute('aria-pressed', String(isActive));
  });
  showModal(DOM.modalOverlay);
  setTimeout(() => DOM.habitNameInput.focus(), 80);
}

function openEditModal(habitId) {
  const habit = state.habits.find(h => h.id === habitId);
  if (!habit) return;
  state.editingHabitId = habitId;
  DOM.modalTitle.textContent = 'Edit Habit';
  DOM.habitNameInput.value = habit.name;
  DOM.nameError.classList.add('hidden');
  DOM.habitNameInput.classList.remove('error');
  // Set color
  state.selectedColor = habit.color;
  DOM.colorSwatches.forEach(s => {
    const isActive = s.dataset.color === habit.color;
    s.classList.toggle('active', isActive);
    s.setAttribute('aria-pressed', String(isActive));
  });
  showModal(DOM.modalOverlay);
  setTimeout(() => DOM.habitNameInput.focus(), 80);
}

function closeModal() {
  hideModal(DOM.modalOverlay);
  state.editingHabitId = null;
}

/* ──────────────────────────────────────────────
   14. DELETE MODAL
────────────────────────────────────────────── */

function openDeleteModal(habitId) {
  state.deletingHabitId = habitId;
  showModal(DOM.deleteOverlay);
  setTimeout(() => DOM.deleteCancelBtn.focus(), 80);
}

function closeDeleteModal() {
  hideModal(DOM.deleteOverlay);
  state.deletingHabitId = null;
}

function confirmDelete() {
  const id = state.deletingHabitId;
  if (!id) return;
  const idx = state.habits.findIndex(h => h.id === id);
  if (idx !== -1) {
    const name = state.habits[idx].name;
    state.habits.splice(idx, 1);
    saveData();
    renderGrid();
    updateStats();
    drawWeeklyChart();
    showToast(`🗑️ "${name}" deleted`, 'info');
  }
  closeDeleteModal();
}

/* ──────────────────────────────────────────────
   15. FORM SUBMIT
────────────────────────────────────────────── */

function handleHabitFormSubmit(e) {
  e.preventDefault();
  const name = DOM.habitNameInput.value.trim();

  if (!name) {
    DOM.nameError.classList.remove('hidden');
    DOM.habitNameInput.classList.add('error');
    DOM.habitNameInput.focus();
    return;
  }
  DOM.nameError.classList.add('hidden');
  DOM.habitNameInput.classList.remove('error');

  if (state.editingHabitId) {
    // Edit existing
    const habit = state.habits.find(h => h.id === state.editingHabitId);
    if (habit) {
      habit.name = name;
      habit.color = state.selectedColor;
      showToast(`✏️ Habit updated!`, 'success');
    }
  } else {
    // Add new
    const newHabit = {
      id: `habit_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
      name,
      color: state.selectedColor,
      datesCompleted: [],
    };
    state.habits.push(newHabit);
    showToast(`🌱 "${name}" added!`, 'success');
  }

  saveData();
  closeModal();
  renderGrid();
  updateStats();
  drawWeeklyChart();
}

/* ──────────────────────────────────────────────
   16. MONTH NAVIGATION
────────────────────────────────────────────── */

function goPrevMonth() {
  if (state.currentMonth === 0) {
    state.currentMonth = 11;
    state.currentYear--;
  } else {
    state.currentMonth--;
  }
  renderMonthTitle();
  animateGrid('left');
}

function goNextMonth() {
  if (state.currentMonth === 11) {
    state.currentMonth = 0;
    state.currentYear++;
  } else {
    state.currentMonth++;
  }
  renderMonthTitle();
  animateGrid('right');
}

/** Slide-out → re-render → slide-in animation */
function animateGrid(direction) {
  const grid = DOM.habitGrid;
  const outX = direction === 'left' ? '20px' : '-20px';
  const inX  = direction === 'left' ? '-20px'  : '20px';

  grid.style.transition = 'opacity 0.18s ease, transform 0.18s ease';
  grid.style.opacity = '0';
  grid.style.transform = `translateX(${outX})`;

  setTimeout(() => {
    renderGrid();
    updateStats();
    drawWeeklyChart();
    grid.style.transform = `translateX(${inX})`;
    // Force reflow
    void grid.offsetHeight;
    grid.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
    grid.style.opacity = '1';
    grid.style.transform = 'translateX(0)';
  }, 180);
}

/* ──────────────────────────────────────────────
   17. MODAL HELPERS (show/hide + focus trap)
────────────────────────────────────────────── */

function showModal(overlay) {
  overlay.classList.remove('hidden');
  document.addEventListener('keydown', trapFocus);
  document.addEventListener('keydown', handleEscKey);
}

function hideModal(overlay) {
  overlay.classList.add('hidden');
  document.removeEventListener('keydown', trapFocus);
  document.removeEventListener('keydown', handleEscKey);
}

function handleEscKey(e) {
  if (e.key === 'Escape') {
    closeModal();
    closeDeleteModal();
  }
}

function trapFocus(e) {
  if (e.key !== 'Tab') return;
  // Find the visible modal
  const modal = document.querySelector('.modal-overlay:not(.hidden) .modal-card');
  if (!modal) return;
  const focusable = modal.querySelectorAll(
    'button, input, [tabindex]:not([tabindex="-1"])'
  );
  const first = focusable[0];
  const last  = focusable[focusable.length - 1];
  if (e.shiftKey) {
    if (document.activeElement === first) { e.preventDefault(); last.focus(); }
  } else {
    if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
  }
}

/* ──────────────────────────────────────────────
   18. TOAST NOTIFICATIONS
────────────────────────────────────────────── */

function showToast(message, type = 'info') {
  const icons = { success: '✅', info: 'ℹ️', error: '❌' };
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span class="toast-icon" aria-hidden="true">${icons[type] || icons.info}</span><span>${escHtml(message)}</span>`;
  DOM.toastContainer.appendChild(toast);

  // Auto-dismiss after 3 s
  setTimeout(() => {
    toast.classList.add('toast-exit');
    toast.addEventListener('animationend', () => toast.remove());
  }, 3000);
}

/* ──────────────────────────────────────────────
   19. RIPPLE EFFECT
────────────────────────────────────────────── */

function addRipple(el) {
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  el.appendChild(ripple);
  ripple.addEventListener('animationend', () => ripple.remove());
}

/* ──────────────────────────────────────────────
   20. MISC UTILITIES
────────────────────────────────────────────── */

/** Escape HTML special characters to prevent XSS */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ──────────────────────────────────────────────
   21. AUTH – LOGIN / REGISTER / LOGOUT
────────────────────────────────────────────── */

/** Simple email format check */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Show an error on an auth form */
function showAuthError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}

/** Hide an auth form error */
function hideAuthError(el) {
  el.textContent = '';
  el.classList.add('hidden');
}

/** Switch from auth screen to app dashboard */
function showApp() {
  DOM.authContainer.classList.add('hidden');
  DOM.appContainer.classList.remove('hidden');

  // Load this user's habits and render everything
  loadData();
  applyDarkMode();
  setDailyQuote();
  renderMonthTitle();
  renderGrid();
  updateStats();
  drawWeeklyChart();
}

/** Switch from app dashboard back to auth screen */
function showAuth() {
  DOM.appContainer.classList.add('hidden');
  DOM.authContainer.classList.remove('hidden');
  // Reset forms
  DOM.loginForm.reset();
  DOM.registerForm.reset();
  hideAuthError(DOM.loginError);
  hideAuthError(DOM.regError);
  // Show login form by default
  DOM.loginForm.classList.remove('hidden');
  DOM.registerForm.classList.add('hidden');
}

/** Handle login form submission */
function handleLogin(e) {
  e.preventDefault();
  hideAuthError(DOM.loginError);

  const email = DOM.loginEmail.value.trim().toLowerCase();
  const password = DOM.loginPassword.value;

  if (!email || !password) {
    showAuthError(DOM.loginError, 'Please enter email and password.');
    return;
  }
  if (!isValidEmail(email)) {
    showAuthError(DOM.loginError, 'Please enter a valid email address.');
    return;
  }

  const users = loadUsers();
  const user = users.find(u => u.email === email);

  if (!user) {
    showAuthError(DOM.loginError, 'No account found with this email.');
    return;
  }
  if (user.password !== password) {
    showAuthError(DOM.loginError, 'Incorrect password. Please try again.');
    return;
  }

  // Success
  state.currentUserEmail = email;
  saveSession();
  showApp();
  showToast(`👋 Welcome back!`, 'success');
}

/** Handle register form submission */
function handleRegister(e) {
  e.preventDefault();
  hideAuthError(DOM.regError);

  const email    = DOM.regEmail.value.trim().toLowerCase();
  const password = DOM.regPassword.value;
  const confirm  = DOM.regConfirm.value;

  if (!email || !password || !confirm) {
    showAuthError(DOM.regError, 'All fields are required.');
    return;
  }
  if (!isValidEmail(email)) {
    showAuthError(DOM.regError, 'Please enter a valid email address.');
    return;
  }
  if (password.length < 6) {
    showAuthError(DOM.regError, 'Password must be at least 6 characters.');
    return;
  }
  if (password !== confirm) {
    showAuthError(DOM.regError, 'Passwords do not match.');
    return;
  }

  const users = loadUsers();
  if (users.find(u => u.email === email)) {
    showAuthError(DOM.regError, 'An account with this email already exists.');
    return;
  }

  // Create user
  users.push({ email, password });
  saveUsers(users);

  // Initialise empty habits for this user
  localStorage.setItem(`habitflow_data_${email}`, JSON.stringify([]));

  // Auto-login
  state.currentUserEmail = email;
  saveSession();
  showApp();
  showToast(`🎉 Account created! Let's build habits.`, 'success');
}

/** Handle logout */
function handleLogout() {
  state.currentUserEmail = null;
  state.habits = [];
  saveSession();
  showAuth();
  showToast(`👋 Logged out successfully.`, 'info');
}

/* ──────────────────────────────────────────────
   22. EVENT LISTENERS
────────────────────────────────────────────── */

function attachListeners() {
  // ---- Auth listeners ----
  DOM.loginForm.addEventListener('submit', handleLogin);
  DOM.registerForm.addEventListener('submit', handleRegister);
  DOM.goToRegister.addEventListener('click', () => {
    DOM.loginForm.classList.add('hidden');
    DOM.registerForm.classList.remove('hidden');
    hideAuthError(DOM.loginError);
    DOM.regEmail.focus();
  });
  DOM.goToLogin.addEventListener('click', () => {
    DOM.registerForm.classList.add('hidden');
    DOM.loginForm.classList.remove('hidden');
    hideAuthError(DOM.regError);
    DOM.loginEmail.focus();
  });
  DOM.logoutBtn.addEventListener('click', handleLogout);

  // ---- App listeners ----
  // Dark mode
  DOM.darkToggle.addEventListener('click', toggleDarkMode);

  // Add habit buttons
  DOM.addHabitBtn.addEventListener('click', openAddModal);
  DOM.emptyAddBtn.addEventListener('click', openAddModal);

  // Month nav
  DOM.prevMonthBtn.addEventListener('click', goPrevMonth);
  DOM.nextMonthBtn.addEventListener('click', goNextMonth);

  // Habit form
  DOM.habitForm.addEventListener('submit', handleHabitFormSubmit);

  // Modal close / cancel
  DOM.modalCloseBtn.addEventListener('click', closeModal);
  DOM.modalCancelBtn.addEventListener('click', closeModal);

  // Click outside modal to close
  DOM.modalOverlay.addEventListener('click', e => {
    if (e.target === DOM.modalOverlay) closeModal();
  });
  DOM.deleteOverlay.addEventListener('click', e => {
    if (e.target === DOM.deleteOverlay) closeDeleteModal();
  });

  // Delete modal
  DOM.deleteCancelBtn.addEventListener('click', closeDeleteModal);
  DOM.deleteConfirmBtn.addEventListener('click', confirmDelete);

  // Color swatches
  DOM.colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      state.selectedColor = swatch.dataset.color;
      DOM.colorSwatches.forEach(s => {
        const isActive = s === swatch;
        s.classList.toggle('active', isActive);
        s.setAttribute('aria-pressed', String(isActive));
      });
    });
  });

  // Redraw chart on window resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(drawWeeklyChart, 120);
  });
}

/* ──────────────────────────────────────────────
   23. INIT
────────────────────────────────────────────── */

function init() {
  // Set current month/year
  const now = new Date();
  state.currentYear  = now.getFullYear();
  state.currentMonth = now.getMonth(); // 0-indexed

  // Wipe old global habit data format (migration)
  localStorage.removeItem('habitflow_habits');

  // Apply dark mode early so auth screen matches
  try {
    state.darkMode = JSON.parse(localStorage.getItem('habitflow_dark')) || false;
  } catch { state.darkMode = false; }
  applyDarkMode();

  // Attach all event listeners
  attachListeners();

  // Check for existing session
  const savedSession = loadSession();
  if (savedSession) {
    state.currentUserEmail = savedSession;
    showApp();
  } else {
    showAuth();
  }

  console.log('%cHabitFlow initialised ✦', 'color:#a78bfa;font-weight:800;font-size:14px');
}

// Kick off
document.addEventListener('DOMContentLoaded', init);
