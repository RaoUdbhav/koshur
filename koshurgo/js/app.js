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
      case 'audioLab':
        this.renderAudioLabView(mainContainer);
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
  // VIEW: PROVERBS (ENHANCED CULTURAL ENGINE)
  // ==========================================
  getProverbOfTheDay() {
    if (!this.proverbs || this.proverbs.length === 0) return null;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    return this.proverbs[dayOfYear % this.proverbs.length];
  }

  renderProverbsView(container) {
    const script = window.koshurGamification.state.scriptMode || 'roman';
    const potd = this.getProverbOfTheDay();

    const themes = [
      { id: 'All', label: 'All (1,330)' },
      { id: 'Wisdom', label: '🧘 Wisdom & Life', keywords: ['friend', 'faith', 'mind', 'heart', 'man', 'world', 'truth', 'life', 'god', 'time', 'good'] },
      { id: 'Humor', label: '🎭 Humor & Irony', keywords: ['blind', 'fool', 'dog', 'thief', 'donkey', 'cat', 'mouse', 'vomit', 'mouth', 'eat'] },
      { id: 'Nature', label: '🏔️ Nature & Kashmir', keywords: ['river', 'water', 'tree', 'snow', 'sun', 'fire', 'bird', 'flower', 'fish', 'stone', 'sum', 'kɔli'] },
      { id: 'Food', label: '🍲 Food & Wazwan', keywords: ['rice', 'bread', 'tea', 'milk', 'apple', 'meat', 'gəza', 'pot', 'meal', 'tsot'] },
      { id: 'Money', label: '💰 Money & Trade', keywords: ['money', 'debt', 'gold', 'silver', 'buy', 'sell', 'price', 'work', 'rich', 'poor'] },
      { id: 'Family', label: '👨‍👩‍👧 Family & Society', keywords: ['mother', 'father', 'son', 'daughter', 'brother', 'sister', 'wife', 'neighbor', 'elder'] }
    ];

    const currentTheme = this.selectedCategory || 'All';
    const themeObj = themes.find(t => t.id === currentTheme);

    const q = this.searchQuery.toLowerCase();
    const filtered = this.proverbs.filter(p => {
      // Search match
      const matchQ = !q || (p.roman && p.roman.toLowerCase().includes(q)) ||
        (p.literal && p.literal.toLowerCase().includes(q)) ||
        (p.meaning && p.meaning.toLowerCase().includes(q)) ||
        (p.dev && p.dev.includes(q));

      // Theme match
      let matchTheme = true;
      if (themeObj && themeObj.keywords) {
        const fullText = `${p.roman} ${p.literal} ${p.meaning}`.toLowerCase();
        matchTheme = themeObj.keywords.some(kw => fullText.includes(kw));
      }

      return matchQ && matchTheme;
    }).slice(0, 75);

    container.innerHTML = `
      <div class="proverbs-container animate-fade-in">
        <!-- Hero: Proverb of the Day -->
        ${potd ? `
          <div class="potd-hero-card">
            <div class="potd-badge">
              <span>🌟 Proverb of the Day · روٗزانہٕ کَہاوَت</span>
              <button type="button" class="btn-copy-card" id="btn-copy-potd" title="Copy Card">📋 Share</button>
            </div>
            <div class="potd-koshur-text ${script === 'nastaliq' ? 'koshur-rtl' : ''}">
              ${escapeHTML(script === 'dev' && potd.dev ? potd.dev : potd.roman)}
            </div>
            <div class="potd-details">
              <p class="potd-literal"><strong>Literal:</strong> "${escapeHTML(potd.literal || potd.meaning)}"</p>
              ${potd.meaning ? `<p class="potd-meaning"><strong>Wisdom:</strong> ${escapeHTML(potd.meaning)}</p>` : ''}
            </div>
            <div class="potd-footer">
              <button type="button" class="btn-audio-pill" data-speak="${escapeHTML(potd.roman)}">
                🔊 Listen Pronunciation
              </button>
              <span class="potd-page">Omkar N. Koul · Page ${potd.page || 1}</span>
            </div>
          </div>
        ` : ''}

        <!-- Header & Action Row -->
        <header class="view-header">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <h2>Kashmiri Proverbs (کٲشِرؠ کَہاوَت)</h2>
              <p>Explore 1,330 proverbs of Kashmiri philosophy and culture.</p>
            </div>
            <button type="button" id="btn-launch-proverb-quiz" class="btn-duo btn-success" style="padding:10px 18px;font-size:13px;">
              🎯 Proverb Challenge (+20 XP)
            </button>
          </div>
        </header>

        <!-- Thematic Category Filter Pills -->
        <div class="category-pills">
          ${themes.map(t => `
            <button type="button" class="pill-btn ${t.id === currentTheme ? 'pill-active' : ''}" data-theme="${escapeHTML(t.id)}">
              ${escapeHTML(t.label)}
            </button>
          `).join('')}
        </div>

        <!-- Search Bar -->
        <div class="search-box">
          <input type="text" id="prov-search-input" placeholder="Search proverbs by meaning, keyword, or Kashmiri..." value="${escapeHTML(this.searchQuery)}">
        </div>

        <!-- Proverbs Grid -->
        <div class="proverbs-list">
          ${filtered.length > 0 ? filtered.map((p, idx) => `
            <div class="proverb-card">
              <div class="prov-header">
                <span class="prov-num">#${idx + 1}</span>
                <div style="display:flex;gap:6px;">
                  <button type="button" class="btn-audio-mini" data-speak="${escapeHTML(p.roman)}" title="Listen">🔊</button>
                </div>
              </div>
              <div class="prov-koshur-text ${script === 'nastaliq' ? 'koshur-rtl' : ''}">${escapeHTML(script === 'dev' && p.dev ? p.dev : p.roman)}</div>
              <div class="prov-literal"><strong>Literal:</strong> "${escapeHTML(p.literal || p.meaning)}"</div>
              ${p.meaning ? `<div class="prov-meaning"><strong>Meaning:</strong> ${escapeHTML(p.meaning)}</div>` : ''}
              <div class="prov-citation">Page ${p.page || 1} · Source: Omkar N. Koul (2006)</div>
            </div>
          `).join('') : `
            <div class="empty-state" style="text-align:center;padding:40px 20px;">
              <p>No proverbs found for this filter. Try another keyword or category.</p>
            </div>
          `}
        </div>
      </div>
    `;

    // Copy POTD listener
    const copyBtn = document.getElementById('btn-copy-potd');
    if (copyBtn && potd) {
      copyBtn.addEventListener('click', () => {
        const text = `🍁 Kashmiri Proverb of the Day:\n"${potd.roman}"\nLiteral: ${potd.literal}\nMeaning: ${potd.meaning || potd.literal}\n— via KoshurGo`;
        navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied! ✨';
        setTimeout(() => { copyBtn.textContent = '📋 Share'; }, 2000);
      });
    }

    // Launch Proverb Challenge Mini-Game
    const quizBtn = document.getElementById('btn-launch-proverb-quiz');
    if (quizBtn) {
      quizBtn.addEventListener('click', () => {
        this.launchProverbChallenge();
      });
    }

    const searchInput = document.getElementById('prov-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderProverbsView(container);
      });
    }

    container.querySelectorAll('.pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.dataset.theme;
        this.renderProverbsView(container);
      });
    });
  }

  launchProverbChallenge() {
    const challenges = [
      {
        scenario: 'A person starts an ambitious task without proper preparation or tools, expecting quick success.',
        correctProverb: 'Panun sum na sum, beyis suz kɔli (One cuts the barrage carelessly and drowns many)',
        options: [
          { roman: 'Panun sum na sum, beyis suz kɔli', meaning: 'Careless actions cause widespread trouble', correct: true },
          { roman: 'Ãb chhu zindagāni', meaning: 'Water is life', correct: false },
          { roman: 'Asul dost chhu modur ãb', meaning: 'A good friend is like sweet water', correct: false }
        ]
      },
      {
        scenario: 'Someone is giving extensive advice on wealth management while being completely in debt themselves.',
        correctProverb: 'Panun tsoonth na gatsaan, beyis ditsaan sakhawat (One has no apple for oneself, yet claims to distribute feasts)',
        options: [
          { roman: 'Panun tsoonth na gatsaan, beyis ditsaan sakhawat', meaning: 'Giving what you do not have yourself', correct: true },
          { roman: 'Ghar chhu jannat', meaning: 'Home is paradise', correct: false },
          { roman: 'Nãr chhu tot', meaning: 'Fire is hot', correct: false }
        ]
      }
    ];

    const item = challenges[Math.floor(Math.random() * challenges.length)];

    const mainContainer = document.getElementById('main-content-view');
    mainContainer.innerHTML = `
      <div class="lesson-player-wrapper animate-fade-in">
        <div class="lesson-player-topbar">
          <button type="button" id="btn-quit-challenge" class="btn-close-lesson">✕</button>
          <span style="font-weight:800;color:var(--saffron-main);">🎯 Proverb Wisdom Challenge</span>
          <span class="lesson-hearts">${window.koshurGamification.state.hearts} ❤️</span>
        </div>

        <div class="exercise-card">
          <span class="badge-type">📜 Cultural Wisdom Riddle</span>
          <h3 class="exercise-instruction">Which authentic Kashmiri proverb best fits this real-life situation?</h3>
          <div class="prompt-box" style="margin:20px 0;background:rgba(234,160,35,0.08);border-left:4px solid var(--saffron-main);">
            <p style="font-size:16px;line-height:1.5;"><strong>Situation:</strong> "${escapeHTML(item.scenario)}"</p>
          </div>

          <div class="choice-grid">
            ${item.options.map((opt, idx) => `
              <button type="button" class="choice-card challenge-opt" data-correct="${opt.correct}">
                <span class="choice-num">${idx + 1}</span>
                <div class="choice-content">
                  <span class="choice-main">${escapeHTML(opt.roman)}</span>
                  <span class="choice-sub">${escapeHTML(opt.meaning)}</span>
                </div>
              </button>
            `).join('')}
          </div>
          <div class="action-footer">
            <button type="button" id="btn-check-proverb-challenge" class="btn-duo btn-primary" disabled>Check Wisdom</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-quit-challenge').addEventListener('click', () => {
      this.renderView('proverbs');
    });

    let selectedBtn = null;
    const checkBtn = document.getElementById('btn-check-proverb-challenge');
    document.querySelectorAll('.challenge-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.challenge-opt').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedBtn = btn;
        checkBtn.disabled = false;
      });
    });

    checkBtn.addEventListener('click', () => {
      if (!selectedBtn) return;
      const isCorrect = selectedBtn.dataset.correct === 'true';
      if (isCorrect) {
        window.koshurAudio.playVictory();
        window.koshurGamification.recordActivity(20);
        alert('🎉 Perfect! You mastered this Kashmiri proverb! (+20 XP awarded)');
      } else {
        window.koshurAudio.playIncorrect();
        window.koshurGamification.deductHeart();
        alert('❌ Not quite. The correct proverb matches the contextual situation!');
      }
      this.renderView('proverbs');
    });
  }

  // ==========================================
  // VIEW: AUDIO LAB & PHONETICS MASTERCLASS (NATIVE & INTERACTIVE)
  // ==========================================
  renderAudioLabView(container) {
    const vowels = window.koshurAudio.getVowelMasterclass();
    const dialogues = window.koshurAudio.getNativeConversations();
    const script = window.koshurGamification.state.scriptMode || 'roman';

    container.innerHTML = `
      <div class="audio-lab-container animate-fade-in">
        <header class="view-header">
          <h2>🎧 Kashmiri Audio Lab & Phonetics Hub</h2>
          <p>Master the 16 Kashmiri vowels, centralized vowels (*ɨ*, *ə*, *ɔ*), and native conversational dialogues.</p>
        </header>

        <!-- Interactive Visual Equalizer Box -->
        <div class="audio-equalizer-hero">
          <div class="equalizer-waveform">
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
            <span class="soundwave-bar"></span>
          </div>
          <div class="equalizer-controls">
            <span class="eq-label">Speech Speed:</span>
            <div class="speed-toggle-group">
              <button type="button" class="btn-speed-opt" data-speed="0.6">🐢 0.6x Slow</button>
              <button type="button" class="btn-speed-opt active-speed" data-speed="0.85">🐰 0.85x Normal</button>
              <button type="button" class="btn-speed-opt" data-speed="1.0">⚡ 1.0x Fast</button>
            </div>
          </div>
        </div>

        <!-- Masterclass Module 1: The 16 Kashmiri Vowels (Achar) -->
        <div class="settings-group-card" style="margin-top:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <h3>The 16 Kashmiri Vowels & Matras (कऻशुर स्वर)</h3>
            <span class="badge-type">Phonetic Masterclass</span>
          </div>
          <p style="font-size:13.5px;color:var(--text-muted);margin:6px 0 18px;">
            Tap any vowel card to hear the precise phonetic sound and Kashmiri word example. Notice the unique centralized vowels (*ɨ, ɨɨ, ə, əə, ɔ*).
          </p>

          <div class="vowel-masterclass-grid">
            ${vowels.map(v => {
              const displayScript = (script === 'nastaliq') ? v.nastaliq : (script === 'dev') ? v.dev : v.koshurWord;
              return `
                <div class="vowel-card">
                  <div class="vowel-card-header">
                    <span class="vowel-symbol">${escapeHTML(v.vowel)}</span>
                    <span class="vowel-type-tag">${escapeHTML(v.type)}</span>
                  </div>
                  <div class="vowel-example-row">
                    <span class="vowel-word ${script === 'nastaliq' ? 'koshur-rtl' : ''}">${escapeHTML(displayScript)}</span>
                    <button type="button" class="btn-audio-mini" data-speak="${escapeHTML(v.audioKey)}" title="Listen">🔊 Play</button>
                  </div>
                  <small class="vowel-desc">${escapeHTML(v.desc)}</small>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Masterclass Module 2: Native Conversational Audio Dialogues -->
        <div class="settings-group-card" style="margin-top:24px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <h3>Native Situational Dialogues (Koshur Baath)</h3>
            <span class="badge-type">Conversational Drill</span>
          </div>
          <p style="font-size:13.5px;color:var(--text-muted);margin:6px 0 18px;">
            Interactive sentence-by-sentence audio players with translations and slow-speed breakdown.
          </p>

          <div class="dialogue-masterclass-list">
            ${dialogues.map((dlg, dIdx) => `
              <div class="dialogue-card">
                <div class="dialogue-header">
                  <h4>#${dIdx + 1} · ${escapeHTML(dlg.title)}</h4>
                  <p class="dialogue-situation">${escapeHTML(dlg.situation)}</p>
                </div>

                <div class="dialogue-lines">
                  ${dlg.lines.map(line => `
                    <div class="dialogue-line-item">
                      <div class="line-speaker-badge">${escapeHTML(line.speaker)}</div>
                      <div class="line-content">
                        <p class="line-koshur">${escapeHTML(line.koshur)}</p>
                        <p class="line-meaning">"${escapeHTML(line.meaning)}"</p>
                      </div>
                      <div class="line-audio-actions">
                        <button type="button" class="btn-audio-mini" data-speak="${escapeHTML(line.audio)}" title="Listen Normal">🔊</button>
                        <button type="button" class="btn-audio-mini btn-audio-slow-mini" data-speak="${escapeHTML(line.audio)}" data-slow="true" title="Listen Slow">🐢</button>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Speed toggle listener
    container.querySelectorAll('.btn-speed-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.btn-speed-opt').forEach(b => b.classList.remove('active-speed'));
        btn.classList.add('active-speed');
        window.koshurAudio.speechRate = parseFloat(btn.dataset.speed);
        window.koshurAudio.playTap();
      });
    });
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
