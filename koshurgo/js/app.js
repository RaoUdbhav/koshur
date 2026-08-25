/**
 * KoshurGo Main Application Controller
 * Handles routing, view transitions, data loading, script switching, and Firebase Auth UI.
 */

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

class KoshurGoApp {
  constructor() {
    this.currentView = 'path';
    this.vocabulary = [];
    this.proverbs = [];
    this.selectedCategory = 'All';
    this.searchQuery = '';
    this.flashcardIndex = 0;
    this.flashcardFlipped = false;
    this.speedTimer = null;
    this.speedTimeLeft = 60;
    this.speedScore = 0;
    this.authMode = 'signin'; // 'signin' or 'signup'
  }

  async init() {
    await this.loadDatasets();
    this.bindHeaderEvents();
    this.bindNavigationEvents();
    this.bindGlobalDelegatedEvents();
    this.bindAuthModalEvents();
    this.updateHeaderStats();
    this.renderView('path');
  }

  async loadDatasets() {
    try {
      const vocabRes = await fetch('./data/vocabulary.json');
      this.vocabulary = await vocabRes.json();
    } catch (e) {
      console.warn('Fallback loading vocabulary', e);
      this.vocabulary = [];
    }

    try {
      const provRes = await fetch('./data/proverbs.json');
      this.proverbs = await provRes.json();
    } catch (e) {
      console.warn('Fallback loading proverbs', e);
      this.proverbs = [];
    }
  }

  updateHeaderStats() {
    const gm = window.koshurGamification;
    const streakEl = document.getElementById('stat-streak');
    const heartsEl = document.getElementById('stat-hearts');
    const chinarEl = document.getElementById('stat-chinar');
    const xpEl = document.getElementById('stat-xp');
    const scriptSelect = document.getElementById('select-script');
    const levelBadge = document.getElementById('header-level-badge');
    const authBtn = document.getElementById('btn-header-auth');

    if (streakEl) streakEl.textContent = `${gm.state.streak} 🔥`;
    if (heartsEl) heartsEl.textContent = `${gm.state.hearts}/${gm.state.maxHearts} ❤️`;
    if (chinarEl) chinarEl.textContent = `${gm.state.chinarLeaves} 🍂`;
    if (xpEl) xpEl.textContent = `${gm.state.xp} XP`;
    if (scriptSelect) scriptSelect.value = gm.state.scriptMode || 'roman';
    if (levelBadge) {
      const lvl = window.KOSHUR_CURRICULUM.levels[gm.state.selectedLevel];
      levelBadge.textContent = lvl ? lvl.title : 'Scratch';
    }

    if (authBtn) {
      if (gm.state.isLoggedIn) {
        authBtn.innerHTML = `☁️ ${escapeHTML(gm.state.userDisplayName || 'Account')}`;
        authBtn.classList.add('btn-auth-logged');
      } else {
        authBtn.innerHTML = `👤 Sign In`;
        authBtn.classList.remove('btn-auth-logged');
      }
    }
  }

  bindHeaderEvents() {
    const scriptSelect = document.getElementById('select-script');
    if (scriptSelect) {
      scriptSelect.addEventListener('change', (e) => {
        window.koshurGamification.state.scriptMode = e.target.value;
        window.koshurGamification.saveState();
        this.renderView(this.currentView);
      });
    }

    const soundToggle = document.getElementById('btn-sound-toggle');
    if (soundToggle) {
      soundToggle.addEventListener('click', () => {
        window.koshurAudio.soundEnabled = !window.koshurAudio.soundEnabled;
        soundToggle.textContent = window.koshurAudio.soundEnabled ? '🔊' : '🔇';
      });
    }

    const authBtn = document.getElementById('btn-header-auth');
    if (authBtn) {
      authBtn.addEventListener('click', () => {
        if (window.koshurGamification.state.isLoggedIn) {
          this.renderView('profile');
        } else {
          this.openAuthModal();
        }
      });
    }
  }

  bindNavigationEvents() {
    const navButtons = document.querySelectorAll('[data-route]');
    navButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const route = btn.dataset.route;
        window.koshurAudio.playTap();
        this.renderView(route);
      });
    });
  }

  bindGlobalDelegatedEvents() {
    document.addEventListener('click', (e) => {
      const speakBtn = e.target.closest('[data-speak]');
      if (speakBtn) {
        e.preventDefault();
        const text = speakBtn.getAttribute('data-speak');
        const isSlow = speakBtn.getAttribute('data-slow') === 'true';
        if (text && window.koshurAudio) {
          window.koshurAudio.speakText(text, isSlow);
        }
      }
    });
  }

  // ==========================================
  // AUTH MODAL & CLOUD SYNC LOGIC
  // ==========================================
  bindAuthModalEvents() {
    const googleBtn = document.getElementById('btn-google-auth');
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        if (window.koshurAuth) {
          await window.koshurAuth.loginWithGoogle();
          this.closeAuthModal();
        }
      });
    }

    const toggleModeBtn = document.getElementById('btn-toggle-auth-mode');
    if (toggleModeBtn) {
      toggleModeBtn.addEventListener('click', () => {
        this.authMode = (this.authMode === 'signin') ? 'signup' : 'signin';
        const submitBtn = document.getElementById('btn-submit-auth');
        const modeText = document.getElementById('auth-mode-text');
        if (this.authMode === 'signup') {
          submitBtn.textContent = 'Create Account';
          modeText.textContent = 'Already have an account?';
          toggleModeBtn.textContent = 'Sign In';
        } else {
          submitBtn.textContent = 'Sign In';
          modeText.textContent = "Don't have an account?";
          toggleModeBtn.textContent = 'Create Free Account';
        }
      });
    }

    const emailForm = document.getElementById('email-auth-form');
    if (emailForm) {
      emailForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-password').value;
        const errorEl = document.getElementById('auth-error-msg');
        errorEl.textContent = 'Authenticating...';

        let res;
        if (this.authMode === 'signup') {
          res = await window.koshurAuth.signUpWithEmail(email, password);
        } else {
          res = await window.koshurAuth.loginWithEmail(email, password);
        }

        if (res && res.success) {
          errorEl.textContent = '';
          this.closeAuthModal();
        } else {
          errorEl.textContent = res ? res.error : 'Authentication failed';
        }
      });
    }
  }

  openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
  }

  renderView(viewName) {
    this.currentView = viewName;
    this.updateHeaderStats();

    document.querySelectorAll('[data-route]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === viewName);
    });

    const mainContainer = document.getElementById('main-content-view');
    if (!mainContainer) return;

    switch (viewName) {
      case 'path':
        this.renderPathView(mainContainer);
        break;
      case 'dictionary':
        this.renderDictionaryView(mainContainer);
        break;
      case 'proverbs':
        this.renderProverbsView(mainContainer);
        break;
      case 'flashcards':
        this.renderFlashcardsView(mainContainer);
        break;
      case 'speedMatch':
        this.renderSpeedMatchView(mainContainer);
        break;
      case 'mistakes':
        this.renderMistakesView(mainContainer);
        break;
      case 'bazaar':
        this.renderBazaarView(mainContainer);
        break;
      case 'profile':
        this.renderProfileView(mainContainer);
        break;
      default:
        this.renderPathView(mainContainer);
    }
  }

  // ==========================================
  // VIEW: LEARNING PATH (DUOLINGO-STYLE TREE)
  // ==========================================
  renderPathView(container) {
    const gm = window.koshurGamification;
    const currentLevel = window.KOSHUR_CURRICULUM.levels[gm.state.selectedLevel] || window.KOSHUR_CURRICULUM.levels.scratch;
    const currentPace = window.KOSHUR_CURRICULUM.paces[gm.state.selectedPace] || window.KOSHUR_CURRICULUM.paces.go;
    const script = gm.state.scriptMode || 'roman';

    container.innerHTML = `
      <div class="path-container animate-fade-in">
        <!-- Level & Pace Bar -->
        <div class="level-pace-bar">
          <div class="level-selector-tabs">
            ${Object.values(window.KOSHUR_CURRICULUM.levels).map(lvl => `
              <button type="button" class="tab-level ${lvl.id === gm.state.selectedLevel ? 'active-level' : ''}" data-level="${escapeHTML(lvl.id)}">
                <span>${escapeHTML(lvl.title)}</span>
                <small>${escapeHTML(script === 'nastaliq' ? lvl.nastaliq : script === 'dev' ? lvl.dev : lvl.subTitle.split('·')[0])}</small>
              </button>
            `).join('')}
          </div>

          <div class="pace-indicator-card">
            <div class="pace-info">
              <span class="pace-label">Daily Pace: <strong>${escapeHTML(currentPace.name)}</strong></span>
              <span class="pace-xp-target">Goal: ${gm.state.todayXP || 0} / ${currentPace.dailyGoalXP} XP</span>
            </div>
            <div class="daily-progress-bar-bg">
              <div class="daily-progress-bar-fill" style="width: ${Math.min(100, ((gm.state.todayXP || 0) / currentPace.dailyGoalXP) * 100)}%"></div>
            </div>
          </div>
        </div>

        <!-- Path Units Stepper -->
        <div class="units-tree">
          ${currentLevel.units.map((unit) => {
            return `
              <div class="unit-card unit-unlocked">
                <div class="unit-banner" style="background: linear-gradient(135deg, ${unit.color || currentLevel.color}, ${unit.accent || currentLevel.accent});">
                  <div class="unit-title-group">
                    <span class="unit-icon">${unit.icon}</span>
                    <div>
                      <h3 class="unit-name">${escapeHTML(unit.title)}</h3>
                      <p class="unit-desc">${escapeHTML(unit.description)}</p>
                    </div>
                  </div>
                  <span class="unit-count">${unit.lessons.length} Lessons</span>
                </div>

                <div class="unit-stepping-nodes">
                  ${unit.lessons.map((lesson, lIdx) => {
                    const isDone = gm.state.completedLessons[lesson.id];
                    return `
                      <div class="node-wrapper node-offset-${(lIdx % 3)}">
                        <button type="button" class="path-node-btn ${isDone ? 'node-done' : 'node-active'}" data-lesson-id="${escapeHTML(lesson.id)}">
                          <span class="node-icon">${isDone ? '⭐' : '📖'}</span>
                          <span class="node-xp">+${lesson.xp} XP</span>
                        </button>
                        <span class="node-label">${escapeHTML(lesson.title)}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.tab-level').forEach(btn => {
      btn.addEventListener('click', () => {
        gm.state.selectedLevel = btn.dataset.level;
        gm.saveState();
        window.koshurAudio.playTap();
        this.renderView('path');
      });
    });

    container.querySelectorAll('.path-node-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const lessonId = btn.dataset.lessonId;
        window.koshurAudio.playTap();
        this.startLessonById(lessonId);
      });
    });
  }

  startLessonById(lessonId) {
    let targetLesson = null;
    for (const lvl of Object.values(window.KOSHUR_CURRICULUM.levels)) {
      for (const u of lvl.units) {
        for (const l of u.lessons) {
          if (l.id === lessonId) {
            targetLesson = l;
            break;
          }
        }
      }
    }

    if (!targetLesson) return;

    const mainContainer = document.getElementById('main-content-view');
    mainContainer.innerHTML = `
      <div class="lesson-player-wrapper">
        <div class="lesson-player-topbar">
          <button type="button" id="btn-quit-lesson" class="btn-close-lesson">✕</button>
          <div class="lesson-progress-bar-bg">
            <div id="lesson-progress-bar" class="lesson-progress-bar-fill" style="width: 0%"></div>
          </div>
          <div class="lesson-hearts" id="lesson-hearts-counter">${window.koshurGamification.state.hearts} ❤️</div>
        </div>
        <div id="exercise-container"></div>
      </div>
    `;

    document.getElementById('btn-quit-lesson').addEventListener('click', () => {
      if (confirm('Leave this lesson? Your progress for this session will be lost.')) {
        this.renderView('path');
      }
    });

    window.koshurExerciseRenderer.startLesson(targetLesson, () => {
      this.renderView('path');
    });
  }

  // ==========================================
  // VIEW: DICTIONARY
  // ==========================================
  renderDictionaryView(container) {
    const script = window.koshurGamification.state.scriptMode || 'roman';
    const categories = ['All', ...new Set(this.vocabulary.map(v => v.category).filter(Boolean))];

    const filtered = this.vocabulary.filter(v => {
      const matchCat = this.selectedCategory === 'All' || v.category === this.selectedCategory;
      const q = this.searchQuery.toLowerCase();
      const matchQ = !q || (v.en && v.en.toLowerCase().includes(q)) ||
        (v.roman && v.roman.toLowerCase().includes(q)) ||
        (v.dev && v.dev.includes(q)) ||
        (v.nastaliq && v.nastaliq.includes(q));
      return matchCat && matchQ;
    });

    container.innerHTML = `
      <div class="dictionary-container animate-fade-in">
        <header class="view-header">
          <h2>Koshur Dictionary (کٲشُر ڈِکشنری)</h2>
          <p>Showing ${filtered.length} verified hand-checked Kashmiri vocabulary entries.</p>
        </header>

        <div class="filter-controls">
          <div class="search-box">
            <input type="text" id="dict-search-input" placeholder="Search in English, Roman, Devanagari, or Nastaliq..." value="${escapeHTML(this.searchQuery)}">
          </div>
          <div class="category-pills">
            ${categories.map(c => `
              <button type="button" class="pill-btn ${c === this.selectedCategory ? 'pill-active' : ''}" data-cat="${escapeHTML(c)}">
                ${escapeHTML(c)}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="dictionary-grid">
          ${filtered.map(entry => {
            const mainText = (script === 'dev' && entry.dev) ? entry.dev : (script === 'nastaliq' && entry.nastaliq) ? entry.nastaliq : entry.roman;
            return `
              <div class="dict-card">
                <div class="dict-card-top">
                  <div class="dict-koshur-group">
                    <span class="dict-koshur-main ${script === 'nastaliq' ? 'koshur-rtl' : ''}">${escapeHTML(mainText)}</span>
                    <button type="button" class="btn-audio-mini" data-speak="${escapeHTML(entry.roman)}" title="Pronounce">🔊</button>
                  </div>
                  <span class="dict-category-tag">${escapeHTML(entry.category || 'General')}</span>
                </div>
                <div class="dict-roman-phonetic">${escapeHTML(entry.roman)}</div>
                <div class="dict-english">${escapeHTML(entry.en)}</div>

                ${entry.exampleEn ? `
                  <div class="dict-example-box">
                    <p class="dict-ex-koshur">${escapeHTML(script === 'nastaliq' ? entry.exampleNastaliq : script === 'dev' ? entry.exampleDev : entry.exampleRoman)}</p>
                    <p class="dict-ex-en">"${escapeHTML(entry.exampleEn)}"</p>
                  </div>
                ` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    const searchInput = document.getElementById('dict-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderDictionaryView(container);
      });
    }

    container.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.dataset.cat;
        this.renderDictionaryView(container);
      });
    });
  }

  // ==========================================
  // VIEW: PROVERBS
  // ==========================================
  renderProverbsView(container) {
    const script = window.koshurGamification.state.scriptMode || 'roman';
    const q = this.searchQuery.toLowerCase();
    const filtered = this.proverbs.filter(p => {
      if (!q) return true;
      return (p.roman && p.roman.toLowerCase().includes(q)) ||
        (p.literal && p.literal.toLowerCase().includes(q)) ||
        (p.meaning && p.meaning.toLowerCase().includes(q)) ||
        (p.dev && p.dev.includes(q));
    }).slice(0, 80);

    container.innerHTML = `
      <div class="proverbs-container animate-fade-in">
        <header class="view-header">
          <h2>Kashmiri Proverbs (کٲشِرؠ کَہاوَت)</h2>
          <p>1,330 proverbs from <em>A Dictionary of Kashmiri Proverbs</em> by Omkar N. Koul.</p>
        </header>

        <div class="search-box">
          <input type="text" id="prov-search-input" placeholder="Search proverbs by meaning, keyword, or Kashmiri..." value="${escapeHTML(this.searchQuery)}">
        </div>

        <div class="proverbs-list">
          ${filtered.map((p, idx) => `
            <div class="proverb-card">
              <div class="prov-header">
                <span class="prov-num">#${idx + 1}</span>
                <button type="button" class="btn-audio-mini" data-speak="${escapeHTML(p.roman)}" title="Listen">🔊</button>
              </div>
              <div class="prov-koshur-text">${escapeHTML(script === 'dev' && p.dev ? p.dev : p.roman)}</div>
              <div class="prov-literal"><strong>Literal:</strong> "${escapeHTML(p.literal || p.meaning)}"</div>
              ${p.meaning ? `<div class="prov-meaning"><strong>Meaning:</strong> ${escapeHTML(p.meaning)}</div>` : ''}
              <div class="prov-citation">Page ${p.page || 1} · Source: Omkar N. Koul (2006)</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    const searchInput = document.getElementById('prov-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderProverbsView(container);
      });
    }
  }

  // ==========================================
  // VIEW: FLASHCARDS
  // ==========================================
  renderFlashcardsView(container) {
    if (this.vocabulary.length === 0) {
      container.innerHTML = `<p class="empty-state">Loading vocabulary deck...</p>`;
      return;
    }

    const currentWord = this.vocabulary[this.flashcardIndex % this.vocabulary.length];
    const script = window.koshurGamification.state.scriptMode || 'roman';
    const mainKoshur = (script === 'dev' && currentWord.dev) ? currentWord.dev : (script === 'nastaliq' && currentWord.nastaliq) ? currentWord.nastaliq : currentWord.roman;

    container.innerHTML = `
      <div class="flashcard-deck-view animate-fade-in">
        <header class="view-header">
          <h2>Leitner Spaced Repetition Flashcards</h2>
          <p>Card ${this.flashcardIndex + 1} of ${this.vocabulary.length}</p>
        </header>

        <div class="flashcard-scene" id="flashcard-card-elem">
          <div class="flashcard-inner ${this.flashcardFlipped ? 'is-flipped' : ''}">
            <div class="flashcard-face flashcard-front">
              <span class="flashcard-tag">${escapeHTML(currentWord.category || 'General')}</span>
              <h3 class="flashcard-word ${script === 'nastaliq' ? 'koshur-rtl' : ''}">${escapeHTML(mainKoshur)}</h3>
              <p class="flashcard-sub">${escapeHTML(currentWord.roman)}</p>
              <button type="button" class="btn-audio-sm" data-speak="${escapeHTML(currentWord.roman)}">🔊 Listen</button>
              <small class="flip-hint">Tap card to reveal English</small>
            </div>
            <div class="flashcard-face flashcard-back">
              <h3 class="flashcard-word">${escapeHTML(currentWord.en)}</h3>
              ${currentWord.exampleEn ? `
                <p class="flashcard-example">"${escapeHTML(currentWord.exampleEn)}"</p>
                <small class="flashcard-example-koshur">${escapeHTML(currentWord.exampleRoman)}</small>
              ` : ''}
              <small class="flip-hint">Tap card to flip back</small>
            </div>
          </div>
        </div>

        <div class="flashcard-actions">
          <button type="button" id="btn-fc-hard" class="btn-duo btn-danger">Need Practice</button>
          <button type="button" id="btn-fc-easy" class="btn-duo btn-success">Got It!</button>
        </div>
      </div>
    `;

    const cardElem = document.getElementById('flashcard-card-elem');
    if (cardElem) {
      cardElem.addEventListener('click', (e) => {
        if (e.target.closest('[data-speak]')) return;
        window.koshurAudio.playTap();
        this.flashcardFlipped = !this.flashcardFlipped;
        this.renderFlashcardsView(container);
      });
    }

    document.getElementById('btn-fc-hard').addEventListener('click', () => {
      window.koshurSRS.recordWordReview(currentWord.roman, false);
      window.koshurAudio.playIncorrect();
      this.flashcardIndex += 1;
      this.flashcardFlipped = false;
      this.renderFlashcardsView(container);
    });

    document.getElementById('btn-fc-easy').addEventListener('click', () => {
      window.koshurSRS.recordWordReview(currentWord.roman, true);
      window.koshurGamification.recordActivity(5);
      window.koshurAudio.playCorrect();
      this.flashcardIndex += 1;
      this.flashcardFlipped = false;
      this.renderFlashcardsView(container);
    });
  }

  // ==========================================
  // VIEW: SPEED MATCH ARENA
  // ==========================================
  renderSpeedMatchView(container) {
    container.innerHTML = `
      <div class="speed-match-arena animate-fade-in">
        <header class="view-header">
          <h2>⚡ Speed Match Arena</h2>
          <p>Match as many Kashmiri words to their English meanings within 60 seconds!</p>
        </header>

        <div class="speed-stats-bar">
          <span class="timer-badge" id="speed-timer-display">⏱️ 60s</span>
          <span class="score-badge" id="speed-score-display">Score: 0</span>
        </div>

        <div id="speed-game-board">
          <button type="button" id="btn-start-speed" class="btn-duo btn-primary btn-lg">Start 60-Second Drill</button>
        </div>
      </div>
    `;

    document.getElementById('btn-start-speed').addEventListener('click', () => {
      this.startSpeedGame();
    });
  }

  startSpeedGame() {
    this.speedTimeLeft = 60;
    this.speedScore = 0;
    const board = document.getElementById('speed-game-board');
    if (!board) return;

    this.renderNextSpeedRound(board);

    if (this.speedTimer) clearInterval(this.speedTimer);
    this.speedTimer = setInterval(() => {
      this.speedTimeLeft -= 1;
      const timerDisplay = document.getElementById('speed-timer-display');
      if (timerDisplay) timerDisplay.textContent = `⏱️ ${this.speedTimeLeft}s`;

      if (this.speedTimeLeft <= 0) {
        clearInterval(this.speedTimer);
        this.endSpeedGame(board);
      }
    }, 1000);
  }

  renderNextSpeedRound(board) {
    if (this.vocabulary.length < 5) return;
    const sample = [...this.vocabulary].sort(() => Math.random() - 0.5).slice(0, 4);
    const left = [...sample].sort(() => Math.random() - 0.5);
    const right = [...sample].sort(() => Math.random() - 0.5);

    let selectedLeft = null;
    let selectedRight = null;
    let matchesMade = 0;

    board.innerHTML = `
      <div class="match-arena">
        <div class="match-col">
          ${left.map(w => `<button type="button" class="match-btn sp-left" data-en="${escapeHTML(w.en)}">${escapeHTML(w.en)}</button>`).join('')}
        </div>
        <div class="match-col">
          ${right.map(w => `<button type="button" class="match-btn sp-right" data-en="${escapeHTML(w.en)}">${escapeHTML(w.roman)}</button>`).join('')}
        </div>
      </div>
    `;

    const checkSpMatch = () => {
      if (selectedLeft && selectedRight) {
        if (selectedLeft.dataset.en === selectedRight.dataset.en) {
          window.koshurAudio.playMatch();
          selectedLeft.classList.add('matched');
          selectedRight.classList.add('matched');
          selectedLeft.disabled = true;
          selectedRight.disabled = true;
          this.speedScore += 10;
          matchesMade += 1;
          const scoreDisp = document.getElementById('speed-score-display');
          if (scoreDisp) scoreDisp.textContent = `Score: ${this.speedScore}`;
          selectedLeft = null;
          selectedRight = null;

          if (matchesMade >= 4) {
            this.renderNextSpeedRound(board);
          }
        } else {
          window.koshurAudio.playIncorrect();
          selectedLeft.classList.add('error-shake');
          selectedRight.classList.add('error-shake');
          setTimeout(() => {
            if (selectedLeft) selectedLeft.classList.remove('selected', 'error-shake');
            if (selectedRight) selectedRight.classList.remove('selected', 'error-shake');
            selectedLeft = null;
            selectedRight = null;
          }, 400);
        }
      }
    };

    board.querySelectorAll('.sp-left').forEach(b => {
      b.addEventListener('click', () => {
        board.querySelectorAll('.sp-left').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        selectedLeft = b;
        checkSpMatch();
      });
    });

    board.querySelectorAll('.sp-right').forEach(b => {
      b.addEventListener('click', () => {
        board.querySelectorAll('.sp-right').forEach(x => x.classList.remove('selected'));
        b.classList.add('selected');
        selectedRight = b;
        checkSpMatch();
      });
    });
  }

  endSpeedGame(board) {
    window.koshurAudio.playVictory();
    window.koshurGamification.recordActivity(Math.floor(this.speedScore / 2));

    board.innerHTML = `
      <div class="summary-card animate-scale-up">
        <h3>Time's Up!</h3>
        <p>You scored <strong>${this.speedScore} Points</strong> in Speed Match.</p>
        <button type="button" id="btn-replay-speed" class="btn-duo btn-primary">Play Again</button>
      </div>
    `;

    document.getElementById('btn-replay-speed').addEventListener('click', () => {
      this.startSpeedGame();
    });
  }

  // ==========================================
  // VIEW: PRACTICE MISTAKES
  // ==========================================
  renderMistakesView(container) {
    const gm = window.koshurGamification;
    const mistakes = gm.state.mistakeQueue || [];

    if (mistakes.length === 0) {
      container.innerHTML = `
        <div class="empty-mistakes-card animate-fade-in">
          <div class="empty-icon">✨</div>
          <h2>Mistake Queue Empty!</h2>
          <p>You have mastered all your recent challenges. Your memory traces are fresh.</p>
          <button type="button" class="btn-duo btn-success" onclick="window.koshurGoApp.renderView('path')">Back to Learning Path</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="mistakes-practice-view animate-fade-in">
        <header class="view-header">
          <h2>Master Your Mistakes (${mistakes.length})</h2>
          <p>Clear errors from previous lessons to restore all your Hearts (❤️).</p>
        </header>

        <button type="button" id="btn-start-mistake-session" class="btn-duo btn-primary btn-lg">
          Practice & Refill Hearts ❤️
        </button>
      </div>
    `;

    document.getElementById('btn-start-mistake-session').addEventListener('click', () => {
      const lesson = {
        id: 'mistake_review',
        title: 'Mistake Review',
        xp: 20,
        items: [...mistakes]
      };

      const mainContainer = document.getElementById('main-content-view');
      mainContainer.innerHTML = `
        <div class="lesson-player-wrapper">
          <div class="lesson-player-topbar">
            <button type="button" id="btn-quit-lesson" class="btn-close-lesson">✕</button>
            <div class="lesson-progress-bar-bg">
              <div id="lesson-progress-bar" class="lesson-progress-bar-fill" style="width: 0%"></div>
            </div>
            <div class="lesson-hearts" id="lesson-hearts-counter">${gm.state.hearts} ❤️</div>
          </div>
          <div id="exercise-container"></div>
        </div>
      `;

      document.getElementById('btn-quit-lesson').addEventListener('click', () => {
        this.renderView('path');
      });

      window.koshurExerciseRenderer.startLesson(lesson, () => {
        gm.refillHeartsFull();
        gm.state.mistakeQueue = [];
        gm.saveState();
        this.renderView('path');
      });
    });
  }

  // ==========================================
  // VIEW: CHINAR BAZAAR
  // ==========================================
  renderBazaarView(container) {
    const gm = window.koshurGamification;

    container.innerHTML = `
      <div class="bazaar-container animate-fade-in">
        <header class="view-header">
          <h2>Chinar Bazaar (چِنار بَزار)</h2>
          <p>Redeem your earned Chinar Leaves (🍂 <strong>${gm.state.chinarLeaves}</strong>) for power-ups and perks.</p>
        </header>

        <div class="bazaar-grid">
          <div class="bazaar-card">
            <div class="bazaar-icon">🧊</div>
            <h3>Streak Freeze</h3>
            <p>Protects your daily streak if you miss a day of practice.</p>
            <span class="bazaar-owned">Owned: ${gm.state.streakFreezes}</span>
            <button type="button" class="btn-duo btn-primary btn-buy" data-item="streakFreeze" data-cost="50">
              50 🍂 Buy
            </button>
          </div>

          <div class="bazaar-card">
            <div class="bazaar-icon">❤️</div>
            <h3>Heart Refill</h3>
            <p>Instantly refills all 5 hearts to full energy.</p>
            <span class="bazaar-owned">Current: ${gm.state.hearts}/5</span>
            <button type="button" class="btn-duo btn-success btn-buy" data-item="refillHearts" data-cost="30">
              30 🍂 Refill
            </button>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.btn-buy').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.dataset.item;
        const cost = parseInt(btn.dataset.cost, 10);
        const res = gm.buyItem(item, cost);

        if (res.success) {
          window.koshurAudio.playVictory();
          alert('Purchase successful!');
          this.updateHeaderStats();
          this.renderBazaarView(container);
        } else {
          window.koshurAudio.playIncorrect();
          alert(res.reason);
        }
      });
    });
  }

  // ==========================================
  // VIEW: PROFILE & SETTINGS
  // ==========================================
  renderProfileView(container) {
    const gm = window.koshurGamification;
    const rank = gm.getLevelRankTitle(gm.state.xp);
    const isLoggedIn = gm.state.isLoggedIn;

    container.innerHTML = `
      <div class="profile-container animate-fade-in">
        <!-- Account Card -->
        <div class="profile-header-card">
          <div class="avatar-circle">${rank.icon}</div>
          <div class="profile-info">
            <h2>${escapeHTML(gm.state.userDisplayName || 'Koshur Learner')}</h2>
            <p class="rank-title">${escapeHTML(rank.title)} (Rank ${rank.rank})</p>
            <div class="profile-stats-row">
              <span>🔥 ${gm.state.streak} Day Streak</span>
              <span>⚡ ${gm.state.xp} Total XP</span>
              <span>🍂 ${gm.state.chinarLeaves} Leaves</span>
            </div>
          </div>
        </div>

        <!-- Cloud Sync & Account Status Card -->
        <div class="settings-group-card">
          <h3>Cloud Sync & Account</h3>
          <div class="cloud-sync-status-box">
            <div class="cloud-status-left">
              <span class="cloud-indicator-icon">${isLoggedIn ? '☁️' : '💾'}</span>
              <div>
                <strong>${isLoggedIn ? 'Cloud Sync Active' : 'Local Guest Mode'}</strong>
                <small>${isLoggedIn ? `Logged in as ${escapeHTML(gm.state.userEmail)}` : 'Progress is currently saved locally on this browser.'}</small>
              </div>
            </div>
            ${isLoggedIn ? `
              <button type="button" id="btn-profile-logout" class="btn-duo btn-danger" style="padding:8px 16px;font-size:13px;">Sign Out</button>
            ` : `
              <button type="button" id="btn-profile-login" class="btn-duo btn-primary" style="padding:8px 16px;font-size:13px;">Sign In to Sync</button>
            `}
          </div>
        </div>

        <!-- Pacing & Daily Goal -->
        <div class="settings-group-card">
          <h3>Pacing & Goals</h3>
          <div class="pace-options">
            ${Object.values(window.KOSHUR_CURRICULUM.paces).map(p => `
              <label class="pace-radio-label ${p.id === gm.state.selectedPace ? 'selected-pace' : ''}">
                <input type="radio" name="user-pace" value="${escapeHTML(p.id)}" ${p.id === gm.state.selectedPace ? 'checked' : ''}>
                <div>
                  <strong>${escapeHTML(p.name)}</strong>
                  <small>${escapeHTML(p.tagline)}</small>
                </div>
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Badges Gallery -->
        <div class="badges-gallery-card">
          <h3>Kashmiri Badges</h3>
          <div class="badges-grid">
            ${Object.values(gm.state.badges).map(b => `
              <div class="badge-card ${b.unlocked ? 'badge-unlocked' : 'badge-locked'}">
                <span class="badge-icon">${b.icon}</span>
                <h4>${escapeHTML(b.title)}</h4>
                <p>${escapeHTML(b.desc)}</p>
                <small class="badge-status">${b.unlocked ? 'Unlocked 🌟' : 'In Progress'}</small>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Provenance -->
        <div class="provenance-card">
          <h3>About KoshurGo & Provenance</h3>
          <p>Dictionary verified from curated Kashmiri seed sets. Proverbs sourced from <em>A Dictionary of Kashmiri Proverbs</em> by Omkar N. Koul. Audio synthesized using Web Audio & phonetic speech models.</p>
          <a href="../learnkoshur_site/index.html" class="link-legacy">Switch to Classic Reference Archive &raquo;</a>
        </div>
      </div>
    `;

    const loginBtn = document.getElementById('btn-profile-login');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.openAuthModal());
    }

    const logoutBtn = document.getElementById('btn-profile-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (confirm('Sign out from KoshurGo?')) {
          await window.koshurAuth.logout();
          this.renderProfileView(container);
        }
      });
    }

    container.querySelectorAll('input[name="user-pace"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        gm.state.selectedPace = e.target.value;
        gm.saveState();
        window.koshurAudio.playTap();
        this.renderProfileView(container);
      });
    });
  }
}

window.koshurGoApp = new KoshurGoApp();
document.addEventListener('DOMContentLoaded', () => {
  window.koshurGoApp.init();
});
