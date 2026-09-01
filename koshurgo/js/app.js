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
    this.flashcardDeck = [];
    this.proverbViewOption = 'all'; // 'all', 'roman', 'dev', 'hindi'
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

    try {
      const audioIdxRes = await fetch('./data/audio_index.json');
      this.audioIndex = await audioIdxRes.json();
      window.koshurAudio.audioIndex = this.audioIndex;
    } catch (e) {
      console.warn('Fallback loading audio index', e);
      this.audioIndex = null;
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
    document.body.classList.remove('in-lesson');
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

    document.body.classList.add('in-lesson');
    const mainContainer = document.getElementById('main-content-view');
    mainContainer.innerHTML = `
      <div class="lesson-player-wrapper animate-fade-in">
        <div class="lesson-player-topbar">
          <button type="button" id="btn-quit-lesson" class="btn-close-lesson">✕</button>
          <div class="lesson-progress-bar-bg">
            <div id="lesson-progress-bar" class="lesson-progress-bar-fill" style="width: 0%"></div>
          </div>
          <div class="lesson-hearts" id="lesson-hearts-counter">${window.koshurGamification.state.hearts} ❤️</div>
        </div>
        <div id="exercise-container"></div>
        <div id="feedback-tray" class="feedback-tray hidden"></div>
      </div>
    `;

    document.getElementById('btn-quit-lesson').addEventListener('click', () => {
      if (confirm('Leave this lesson? Your progress for this session will be lost.')) {
        document.body.classList.remove('in-lesson');
        this.renderView('path');
      }
    });

    window.koshurExerciseRenderer.startLesson(targetLesson, () => {
      document.body.classList.remove('in-lesson');
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
  // VIEW: PROVERBS (SCRATCH REBUILT: ROMAN, HINDI & DEVANAGARI)
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
    const potd = this.getProverbOfTheDay();
    const activeView = this.proverbViewOption || 'all';

    const themes = [
      { id: 'All', label: `All (${this.proverbs.length})` },
      { id: 'Wisdom', label: '🧘 Wisdom (जीवन ज्ञान)' },
      { id: 'Nature', label: '🏔️ Nature (प्रकृति और कश्मीर)' },
      { id: 'Family', label: '👨‍👩‍👧 Family (परिवार और अपने)' },
      { id: 'Food', label: '🍲 Food (खान-पान और स्वाद)' },
      { id: 'Society', label: '🤝 Society (समाज और रिश्ते)' },
      { id: 'Life', label: '⏳ Life (ज़िंदगी और वक्त)' },
      { id: 'Humor', label: '🎭 Humor (हास्य और व्यंग्य)' }
    ];

    const currentTheme = this.selectedCategory || 'All';
    const q = this.searchQuery.toLowerCase().trim();

    const filtered = this.proverbs.filter(p => {
      const matchQ = !q ||
        (p.roman && p.roman.toLowerCase().includes(q)) ||
        (p.dev && p.dev.includes(q)) ||
        (p.nastaliq && p.nastaliq.includes(q)) ||
        (p.hindi && p.hindi.toLowerCase().includes(q)) ||
        (p.english && p.english.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q));

      const matchTheme = (currentTheme === 'All') || (p.category && p.category.toLowerCase() === currentTheme.toLowerCase());
      return matchQ && matchTheme;
    });

    container.innerHTML = `
      <div class="proverbs-container animate-fade-in">
        <!-- Hero: Proverb of the Day -->
        ${potd ? `
          <div class="potd-hero-card">
            <div class="potd-badge">
              <span>🌟 Proverb of the Day · روٗزانہٕ کَہاوَت</span>
              <button type="button" class="btn-copy-card" id="btn-copy-potd" title="Copy Proverb">📋 Share</button>
            </div>
            
            <div class="potd-koshur-text" style="font-size:22px;font-weight:800;color:var(--text-main);margin:10px 0 4px;">
              ${escapeHTML(potd.roman)}
            </div>
            <div style="font-size:18px;font-weight:700;color:var(--pine-main);margin-bottom:6px;">
              ${escapeHTML(potd.dev)}
            </div>
            <div class="prov-pronunciation-pill" style="display:inline-block;margin-bottom:10px;">
              🗣️ ${escapeHTML(potd.pronunciation || potd.roman)}
            </div>

            <div class="prov-hindi-box" style="margin-top:4px;">
              <span class="prov-hindi-label">🇮🇳 हिन्दी भावार्थ:</span>
              <span>"${escapeHTML(potd.hindi)}"</span>
            </div>

            <div class="potd-details" style="margin-top:6px;">
              <p class="potd-literal"><strong>English:</strong> "${escapeHTML(potd.english)}"</p>
            </div>

            <div class="potd-footer" style="margin-top:12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
              <button type="button" class="btn-audio-pill" data-speak="${escapeHTML(potd.roman)}">
                🔊 Listen Normal
              </button>
              <button type="button" class="btn-audio-pill" data-speak="${escapeHTML(potd.roman)}" data-slow="true" style="background:rgba(234,160,35,0.15);border:2px solid var(--saffron-main);color:var(--text-main);">
                🐢 Listen Slow
              </button>
              <span class="potd-page">Kashmiri Folk Wisdom · #${potd.id}</span>
            </div>
          </div>
        ` : ''}

        <!-- Header & Action Row -->
        <header class="view-header" style="margin-top:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <h2>Kashmiri Proverbs (کٲشِرؠ کَہاوَت / कॉशुर कहावतें)</h2>
              <p>Authentic Kashmiri folk wisdom with readable Roman, clean Devanagari, and natural Hindi meanings.</p>
            </div>
            <button type="button" id="btn-launch-proverb-quiz" class="btn-duo btn-success" style="padding:10px 18px;font-size:13px;">
              🎯 Proverb Challenge (+20 XP)
            </button>
          </div>
        </header>

        <!-- View Options: Roman / Devanagari / Hindi Meaning / All -->
        <div style="margin:16px 0 8px;">
          <label style="font-size:12px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;">Display Script & Translation Mode:</label>
          <div class="prov-script-toggles">
            <button type="button" class="prov-toggle-btn ${activeView === 'all' ? 'active' : ''}" data-view="all">
              🎛️ All Details (सारे रूप)
            </button>
            <button type="button" class="prov-toggle-btn ${activeView === 'roman' ? 'active' : ''}" data-view="roman">
              🔤 Roman (Phonetic)
            </button>
            <button type="button" class="prov-toggle-btn ${activeView === 'dev' ? 'active' : ''}" data-view="dev">
              🕉️ Devanagari (कॉशुर लिपि)
            </button>
            <button type="button" class="prov-toggle-btn ${activeView === 'hindi' ? 'active' : ''}" data-view="hindi">
              🇮🇳 Hindi Meaning (हिन्दी भावार्थ)
            </button>
          </div>
        </div>

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
          <input type="text" id="prov-search-input" placeholder="Search in Roman, Hindi, Devanagari, or English..." value="${escapeHTML(this.searchQuery)}">
        </div>

        <!-- Proverbs Grid -->
        <div class="proverbs-list">
          ${filtered.length > 0 ? filtered.map((p) => {
            let primaryText = p.roman;
            let secondaryText = p.dev;

            if (activeView === 'dev') {
              primaryText = p.dev;
              secondaryText = p.roman;
            } else if (activeView === 'hindi') {
              primaryText = p.hindi;
              secondaryText = `${p.roman} · ${p.dev}`;
            }

            return `
              <div class="proverb-card">
                <div class="prov-header">
                  <div class="prov-meta-left">
                    <span class="prov-num">#${p.id}</span>
                    <span class="prov-category-badge">${escapeHTML(p.category || 'Wisdom')}</span>
                  </div>
                  <div class="prov-actions">
                    <button type="button" class="btn-audio-mini" data-speak="${escapeHTML(p.roman)}" title="Listen Normal Speed">🔊</button>
                    <button type="button" class="btn-audio-mini btn-audio-slow-mini" data-speak="${escapeHTML(p.roman)}" data-slow="true" title="Listen Slow Turtle">🐢</button>
                    <button type="button" class="btn-audio-mini btn-copy-single-prov" data-copy="${escapeHTML(`${p.roman}\n${p.dev}\nहिन्दी: ${p.hindi}\nEnglish: ${p.english}`)}" title="Copy Proverb">📋</button>
                  </div>
                </div>

                <div class="prov-primary-text">${escapeHTML(primaryText)}</div>
                ${secondaryText ? `<div class="prov-secondary-text">${escapeHTML(secondaryText)}</div>` : ''}

                ${p.pronunciation ? `
                  <div class="prov-pronunciation-pill">
                    🗣️ Pronunciation: <em>${escapeHTML(p.pronunciation)}</em>
                  </div>
                ` : ''}

                <div class="prov-hindi-box">
                  <span class="prov-hindi-label">🇮🇳 हिन्दी भावार्थ:</span>
                  <span>"${escapeHTML(p.hindi)}"</span>
                </div>

                <div class="prov-english-box">
                  <strong>English:</strong> "${escapeHTML(p.english)}"
                </div>
              </div>
            `;
          }).join('') : `
            <div class="empty-state" style="text-align:center;padding:40px 20px;">
              <p>No proverbs found matching your search. Try another keyword or category.</p>
            </div>
          `}
        </div>
      </div>
    `;

    // View option switcher listener
    container.querySelectorAll('.prov-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.koshurAudio.playTap();
        this.proverbViewOption = btn.dataset.view;
        this.renderProverbsView(container);
      });
    });

    // Copy POTD listener
    const copyBtn = document.getElementById('btn-copy-potd');
    if (copyBtn && potd) {
      copyBtn.addEventListener('click', () => {
        const text = `🍁 Kashmiri Proverb of the Day:\n"${potd.roman}"\n${potd.dev}\n🇮🇳 हिन्दी: ${potd.hindi}\n🇬🇧 English: ${potd.english}\n— via KoshurGo`;
        navigator.clipboard.writeText(text);
        copyBtn.textContent = 'Copied! ✨';
        setTimeout(() => { copyBtn.textContent = '📋 Share'; }, 2000);
      });
    }

    // Copy individual proverb listener
    container.querySelectorAll('.btn-copy-single-prov').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.dataset.copy;
        navigator.clipboard.writeText(text);
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = '📋'; }, 1800);
      });
    });

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

    container.querySelectorAll('.category-pills .pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedCategory = btn.dataset.theme;
        this.renderProverbsView(container);
      });
    });
  }

  launchProverbChallenge() {
    const challenges = [
      {
        scenario: 'A person starts a big project without patience, expecting instant results, but an elder reminds them that good things take time.',
        correctProverb: 'Sabras chhu mive meeth',
        correctMeaning: 'सब्र का फल हमेशा मीठा होता है (The fruit of patience is sweet)',
        options: [
          { roman: 'Sabras chhu mive meeth', dev: 'सबरस छु मिवे मीठ', meaning: 'सब्र का फल मीठा होता है', correct: true },
          { roman: 'Batas peth chhu zun rozun', dev: 'बतस पॆठ छु ज़ून रोज़ुन', meaning: 'चावल पर चंद्रमा की चमक (परम सौभाग्य)', correct: false },
          { roman: 'Nãr chhu tot', dev: 'नार छु तॊत', meaning: 'आग गर्म होती है', correct: false }
        ]
      },
      {
        scenario: 'A person is looking all over the city for something that was right inside their own home the entire time.',
        correctProverb: 'Gharas manz chhu aab, te nallan chhu tshondaan',
        correctMeaning: 'घर में पानी है और नालों में तलाश (बगल में छोरा, नगर में ढिंढोरा)',
        options: [
          { roman: 'Gharas manz chhu aab, te nallan chhu tshondaan', dev: 'घरस मंज़ छु आब, तॖ नलन छु छ़ॊन्दान', meaning: 'बगल में छोरा, नगर में ढिंढोरा', correct: true },
          { roman: 'Panun gām chhu paristan', dev: 'पनुन गाम छु परिस्तान', meaning: 'अपना गाँव स्वर्ग जैसा है', correct: false },
          { roman: 'Wandas chhu shīn', dev: 'वंदस छु शीन', meaning: 'सर्दियों में बर्फ पड़ती है', correct: false }
        ]
      },
      {
        scenario: 'Someone speaks with great warmth, kindness, and sweetness, and wins over people from every walk of life.',
        correctProverb: 'Zabān chhi shirin, te duniya chhu panun',
        correctMeaning: 'मीठी बोली से सारी दुनिया अपनी बन जाती है (Sweet tongue wins the world)',
        options: [
          { roman: 'Zabān chhi shirin, te duniya chhu panun', dev: 'ज़बान छि शीरीं, तॖ दुनिया छु पनुन', meaning: 'मीठी बोली से सारी दुनिया अपनी बन जाती है', correct: true },
          { roman: 'Kaal chhu pakaan', dev: 'काल छु पकान', meaning: 'समय बीतता जाता है', correct: false },
          { roman: 'Haakh ti gadh chhu shahi khorak', dev: 'हाख तॖ गद छु शाही ख़ॊराक़', meaning: 'साग और मछली शाही खाना है', correct: false }
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
          <h3 class="exercise-instruction">Which authentic Kashmiri proverb best fits this situation?</h3>
          <div class="prompt-box" style="margin:20px 0;background:rgba(234,160,35,0.08);border-left:4px solid var(--saffron-main);padding:14px 18px;border-radius:4px;">
            <p style="font-size:16px;line-height:1.5;"><strong>Situation:</strong> "${escapeHTML(item.scenario)}"</p>
          </div>

          <div class="choice-grid">
            ${item.options.map((opt, idx) => `
              <button type="button" class="choice-card challenge-opt" data-correct="${opt.correct}">
                <span class="choice-num">${idx + 1}</span>
                <div class="choice-content">
                  <span class="choice-main">${escapeHTML(opt.roman)}</span>
                  <small style="color:var(--pine-main);font-weight:700;">${escapeHTML(opt.dev)}</small>
                  <span class="choice-sub">${escapeHTML(opt.meaning)}</span>
                </div>
              </button>
            `).join('')}
          </div>
          <div class="action-footer" style="margin-top:20px;">
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
        alert(`🎉 Shabash! Correct proverb:\n"${item.correctProverb}"\n${item.correctMeaning}\n(+20 XP awarded)`);
      } else {
        window.koshurAudio.playIncorrect();
        window.koshurGamification.deductHeart();
        alert(`❌ Not quite! The matching proverb was:\n"${item.correctProverb}"\n${item.correctMeaning}`);
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

        <!-- Pronunciation Studio & Voice Booth -->
        <div class="settings-group-card" style="margin-top:24px;background:linear-gradient(135deg, rgba(46,125,122,0.06), rgba(234,160,35,0.06));border:2px solid var(--pine-main);">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
            <h3>🎙️ Kashmiri Pronunciation & Voice Studio</h3>
            <span class="badge-type" style="background:var(--pine-main);color:#FFF;">Interactive Studio</span>
          </div>
          <p style="font-size:13.5px;color:var(--text-muted);margin:6px 0 14px;">
            Test your pronunciation! Select any word from the 264-word library to see its exact IPA phonetic breakdown, listen to the native audio, and record your voice to compare side-by-side.
          </p>

          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
            <select id="studio-word-select" class="select-script-dropdown" style="flex:1;min-width:200px;padding:10px 14px;font-size:14px;">
              ${this.vocabulary.map((w) => `
                <option value="${escapeHTML(w.roman)}" data-en="${escapeHTML(w.en)}" data-nastaliq="${escapeHTML(w.nastaliq || '')}" data-dev="${escapeHTML(w.dev || '')}">
                  ${escapeHTML(w.roman)} (${escapeHTML(w.en)}) - ${escapeHTML(w.nastaliq || '')} / ${escapeHTML(w.dev || '')}
                </option>
              `).join('')}
            </select>
            <button type="button" id="btn-studio-play-native" class="btn-duo btn-primary" style="padding:10px 18px;">
              🔊 Native Audio
            </button>
            <button type="button" id="btn-studio-play-slow" class="btn-duo" style="padding:10px 18px;background:rgba(234,160,35,0.15);border:2px solid var(--saffron-main);color:var(--text-main);">
              🐢 Turtle 0.6x
            </button>
          </div>

          <div id="studio-ipa-box" style="background:var(--bg-card);border:2px solid var(--border-color);border-radius:var(--radius-md);padding:14px 18px;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
              <div>
                <span style="font-size:12px;font-weight:700;color:var(--pine-main);text-transform:uppercase;letter-spacing:0.05em;">IPA Phonetic Transcription:</span>
                <div id="studio-ipa-display" style="font-size:20px;font-weight:800;color:var(--chinar-main);font-family:monospace;margin-top:2px;">[tsɨʈ]</div>
              </div>
              <div id="studio-script-display" style="font-size:18px;font-weight:700;color:var(--text-main);">ژٕٹ / च़ॖट</div>
            </div>
          </div>

          <!-- Record & Playback Controls -->
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
            <button type="button" id="btn-studio-record" class="btn-duo btn-danger" style="display:inline-flex;align-items:center;gap:6px;">
              <span id="studio-rec-icon">🔴</span> <span id="studio-rec-text">Record My Voice</span>
            </button>
            <button type="button" id="btn-studio-play-user" class="btn-duo btn-success" style="display:none;">
              ▶️ Play My Recording
            </button>
            <span id="studio-rec-status" style="font-size:13px;color:var(--text-muted);font-weight:600;"></span>
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

    // Pronunciation Studio logic
    const wordSelect = document.getElementById('studio-word-select');
    const ipaDisplay = document.getElementById('studio-ipa-display');
    const scriptDisplay = document.getElementById('studio-script-display');
    const playNativeBtn = document.getElementById('btn-studio-play-native');
    const playSlowBtn = document.getElementById('btn-studio-play-slow');
    const recordBtn = document.getElementById('btn-studio-record');
    const playUserBtn = document.getElementById('btn-studio-play-user');
    const recStatus = document.getElementById('studio-rec-status');
    const recText = document.getElementById('studio-rec-text');
    const recIcon = document.getElementById('studio-rec-icon');

    let userAudioUrl = null;
    let isRecording = false;

    const updateStudioWord = () => {
      if (!wordSelect) return;
      const opt = wordSelect.options[wordSelect.selectedIndex];
      if (opt) {
        const val = opt.value;
        const nastaliq = opt.dataset.nastaliq || '';
        const dev = opt.dataset.dev || '';
        if (ipaDisplay) ipaDisplay.textContent = `[${window.koshurAudio.getKashmiriIPA(val)}]`;
        if (scriptDisplay) scriptDisplay.textContent = `${nastaliq} / ${dev}`;
      }
    };

    if (wordSelect) {
      wordSelect.addEventListener('change', updateStudioWord);
      updateStudioWord();
    }

    if (playNativeBtn) {
      playNativeBtn.addEventListener('click', () => {
        if (!wordSelect) return;
        window.koshurAudio.playTap();
        window.koshurAudio.speakText(wordSelect.value, false);
      });
    }

    if (playSlowBtn) {
      playSlowBtn.addEventListener('click', () => {
        if (!wordSelect) return;
        window.koshurAudio.playTap();
        window.koshurAudio.speakText(wordSelect.value, true);
      });
    }

    if (recordBtn) {
      recordBtn.addEventListener('click', async () => {
        if (!isRecording) {
          const started = await window.koshurAudio.startVoiceRecording(() => {
            isRecording = true;
            recordBtn.classList.remove('btn-danger');
            recordBtn.classList.add('btn-primary');
            if (recText) recText.textContent = 'Stop Recording (Tap when done)';
            if (recIcon) recIcon.textContent = '⏹️';
            if (recStatus) recStatus.textContent = 'Recording in progress... Speak clearly!';
            if (playUserBtn) playUserBtn.style.display = 'none';
          });
        } else {
          window.koshurAudio.stopVoiceRecording((audioUrl) => {
            isRecording = false;
            userAudioUrl = audioUrl;
            recordBtn.classList.remove('btn-primary');
            recordBtn.classList.add('btn-danger');
            if (recText) recText.textContent = 'Record Again';
            if (recIcon) recIcon.textContent = '🔴';
            if (recStatus) recStatus.textContent = 'Recording saved! Tap "Play My Recording" to compare.';
            if (playUserBtn) playUserBtn.style.display = 'inline-flex';
          });
        }
      });
    }

    if (playUserBtn) {
      playUserBtn.addEventListener('click', () => {
        if (userAudioUrl) {
          const userAudio = new Audio(userAudioUrl);
          userAudio.play();
        }
      });
    }
  }

  // ==========================================
  // VIEW: FLASHCARDS (RANDOMIZED DECK)
  // ==========================================
  shuffleFlashcards() {
    if (!this.vocabulary || this.vocabulary.length === 0) return;
    const deck = [...this.vocabulary];
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    this.flashcardDeck = deck;
    this.flashcardIndex = 0;
    this.flashcardFlipped = false;
  }

  renderFlashcardsView(container) {
    if (this.vocabulary.length === 0) {
      container.innerHTML = `<p class="empty-state">Loading vocabulary deck...</p>`;
      return;
    }

    if (!this.flashcardDeck || this.flashcardDeck.length === 0) {
      this.shuffleFlashcards();
    }

    if (this.flashcardIndex >= this.flashcardDeck.length) {
      container.innerHTML = `
        <div class="summary-card animate-scale-up">
          <div class="trophy-bounce">🎴</div>
          <h2>All ${this.flashcardDeck.length} Cards Completed!</h2>
          <p class="summary-subtitle">Shabash! You reviewed all words in this randomized session.</p>
          <div class="summary-actions" style="margin-top:20px;">
            <button type="button" id="btn-fc-reshuffle" class="btn-duo btn-primary btn-lg">
              🔀 Shuffle & Practice Again
            </button>
          </div>
        </div>
      `;

      document.getElementById('btn-fc-reshuffle').addEventListener('click', () => {
        window.koshurAudio.playTap();
        this.shuffleFlashcards();
        this.renderFlashcardsView(container);
      });
      return;
    }

    const currentWord = this.flashcardDeck[this.flashcardIndex];
    const script = window.koshurGamification.state.scriptMode || 'roman';
    const mainKoshur = (script === 'dev' && currentWord.dev) ? currentWord.dev : (script === 'nastaliq' && currentWord.nastaliq) ? currentWord.nastaliq : currentWord.roman;

    container.innerHTML = `
      <div class="flashcard-deck-view animate-fade-in">
        <header class="view-header" style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px;">
          <div>
            <h2>🎴 Spaced Repetition Flashcards</h2>
            <p>Card <strong>${this.flashcardIndex + 1}</strong> of ${this.flashcardDeck.length} · <em>Random Order</em></p>
          </div>
          <button type="button" id="btn-fc-shuffle" class="btn-duo" style="padding:8px 14px;font-size:13px;background:var(--bg-card);border:2px solid var(--border-color);color:var(--text-main);" title="Shuffle remaining deck in random order">
            🔀 Shuffle
          </button>
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

    const shuffleBtn = document.getElementById('btn-fc-shuffle');
    if (shuffleBtn) {
      shuffleBtn.addEventListener('click', () => {
        window.koshurAudio.playTap();
        this.shuffleFlashcards();
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

      document.body.classList.add('in-lesson');
      const mainContainer = document.getElementById('main-content-view');
      mainContainer.innerHTML = `
        <div class="lesson-player-wrapper animate-fade-in">
          <div class="lesson-player-topbar">
            <button type="button" id="btn-quit-lesson" class="btn-close-lesson">✕</button>
            <div class="lesson-progress-bar-bg">
              <div id="lesson-progress-bar" class="lesson-progress-bar-fill" style="width: 0%"></div>
            </div>
            <div class="lesson-hearts" id="lesson-hearts-counter">${gm.state.hearts} ❤️</div>
          </div>
          <div id="exercise-container"></div>
          <div id="feedback-tray" class="feedback-tray hidden"></div>
        </div>
      `;

      document.getElementById('btn-quit-lesson').addEventListener('click', () => {
        document.body.classList.remove('in-lesson');
        this.renderView('path');
      });

      window.koshurExerciseRenderer.startLesson(lesson, () => {
        document.body.classList.remove('in-lesson');
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
