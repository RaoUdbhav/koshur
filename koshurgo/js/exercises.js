/**
 * KoshurGo Interactive Exercises Suite
 * Implements 6 core game archetypes with safe DOM manipulation and XSS prevention.
 */

class KoshurExerciseRenderer {
  constructor() {
    this.currentLesson = null;
    this.currentIndex = 0;
    this.mistakesInRound = [];
    this.userAnswers = [];
    this.scrambleSelected = [];
    this.matchSelected = { left: null, right: null };
    this.matchedPairsCount = 0;
    this.selectedChoiceIndex = null;
    this.isAnswerChecked = false;
    this.onLessonCompleteCallback = null;
  }

  startLesson(lesson, onComplete) {
    this.currentLesson = lesson;
    this.currentIndex = 0;
    this.mistakesInRound = [];
    this.userAnswers = [];
    this.onLessonCompleteCallback = onComplete;
    this.renderCurrentChallenge();
  }

  getCurrentScript() {
    return window.koshurGamification.state.scriptMode || 'roman';
  }

  getTextForScript(item) {
    const script = this.getCurrentScript();
    if (script === 'dev' && item.dev) return item.dev;
    if (script === 'nastaliq' && item.nastaliq) return item.nastaliq;
    return item.roman || item.en || '';
  }

  renderCurrentChallenge() {
    const container = document.getElementById('exercise-container');
    if (!container) return;

    const tray = document.getElementById('feedback-tray');
    if (tray) {
      tray.style.display = 'none';
      tray.className = 'feedback-tray hidden';
    }

    if (this.currentIndex >= this.currentLesson.items.length) {
      this.renderLessonSummary();
      return;
    }

    const item = this.currentLesson.items[this.currentIndex];
    this.isAnswerChecked = false;
    this.scrambleSelected = [];
    this.matchSelected = { left: null, right: null };
    this.matchedPairsCount = 0;
    this.selectedChoiceIndex = null;

    this.updateProgressBar();

    let contentHtml = '';
    switch (item.type) {
      case 'scramble':
        contentHtml = this.renderScrambleHTML(item);
        break;
      case 'choice':
        contentHtml = this.renderChoiceHTML(item);
        break;
      case 'match':
        contentHtml = this.renderMatchHTML(item);
        break;
      case 'listen':
        contentHtml = this.renderListenHTML(item);
        break;
      case 'cloze':
        contentHtml = this.renderClozeHTML(item);
        break;
      case 'story':
        contentHtml = this.renderStoryHTML(item);
        break;
      default:
        contentHtml = this.renderChoiceHTML(item);
    }

    container.innerHTML = `
      <div class="exercise-card animate-fade-in">
        ${contentHtml}
      </div>
      <div id="feedback-tray" class="feedback-tray hidden"></div>
    `;

    this.bindExerciseEvents(item);
  }

  updateProgressBar() {
    const bar = document.getElementById('lesson-progress-bar');
    if (bar && this.currentLesson) {
      const pct = (this.currentIndex / this.currentLesson.items.length) * 100;
      bar.style.width = `${pct}%`;
    }
  }

  // --- 1. SCRAMBLE (SENTENCE BUILDER) ---
  renderScrambleHTML(item) {
    const script = this.getCurrentScript();
    let tokens = item.tokensRoman;
    if (script === 'dev' && item.tokensDev) tokens = item.tokensDev;
    if (script === 'nastaliq' && item.tokensNastaliq) tokens = item.tokensNastaliq;

    return `
      <div class="exercise-header">
        <span class="badge-type">🧩 Sentence Builder</span>
        <h3 class="exercise-instruction">${escapeHTML(item.instruction)}</h3>
      </div>
      <div class="prompt-box">
        <span class="prompt-en">"${escapeHTML(item.targetEn)}"</span>
        <button type="button" class="btn-audio-sm" data-speak="${escapeHTML(item.targetRoman)}" title="Listen">🔊</button>
      </div>
      <div class="scramble-slots" id="scramble-slots" dir="${script === 'nastaliq' ? 'rtl' : 'ltr'}">
        <span class="slot-placeholder" id="slot-placeholder">Tap words below in correct Kashmiri order</span>
      </div>
      <div class="scramble-bank" id="scramble-bank" dir="${script === 'nastaliq' ? 'rtl' : 'ltr'}">
        ${tokens.map((tok, idx) => `
          <button type="button" class="token-btn" data-index="${idx}" data-word="${escapeHTML(tok)}">
            ${escapeHTML(tok)}
          </button>
        `).join('')}
      </div>
      <div class="action-footer">
        <button type="button" id="btn-check-answer" class="btn-duo btn-primary" disabled>Check Answer</button>
      </div>
    `;
  }

  // --- 2. MULTIPLE CHOICE ---
  renderChoiceHTML(item) {
    const script = this.getCurrentScript();
    return `
      <div class="exercise-header">
        <span class="badge-type">⚡ Multiple Choice</span>
        <h3 class="exercise-instruction">${escapeHTML(item.promptEn)}</h3>
      </div>
      <div class="choice-grid">
        ${item.options.map((opt, idx) => {
          const text = (script === 'dev' && opt.dev) ? opt.dev : (script === 'nastaliq' && opt.nastaliq) ? opt.nastaliq : opt.roman;
          const sub = script !== 'roman' && opt.roman ? `<span class="choice-sub">${escapeHTML(opt.roman)}</span>` : '';
          return `
            <button type="button" class="choice-card" data-index="${idx}">
              <span class="choice-num">${idx + 1}</span>
              <div class="choice-content">
                <span class="choice-main ${script === 'nastaliq' ? 'koshur-rtl' : ''}">${escapeHTML(text)}</span>
                ${sub}
              </div>
            </button>
          `;
        }).join('')}
      </div>
      <div class="action-footer">
        <button type="button" id="btn-check-answer" class="btn-duo btn-primary" disabled>Check Answer</button>
      </div>
    `;
  }

  // --- 3. SPEED PAIR MATCH ---
  renderMatchHTML(item) {
    const script = this.getCurrentScript();
    const shuffledPairs = [...item.pairs].sort(() => Math.random() - 0.5);
    const shuffledRight = [...item.pairs].sort(() => Math.random() - 0.5);

    return `
      <div class="exercise-header">
        <span class="badge-type">⚡ Pair Matching</span>
        <h3 class="exercise-instruction">${escapeHTML(item.instruction)}</h3>
      </div>
      <div class="match-arena">
        <div class="match-col" id="match-col-left">
          ${shuffledPairs.map((p) => `
            <button type="button" class="match-btn left-btn" data-en="${escapeHTML(p.en)}">
              ${escapeHTML(p.en)}
            </button>
          `).join('')}
        </div>
        <div class="match-col" id="match-col-right">
          ${shuffledRight.map((p) => {
            const koshur = (script === 'dev' && p.dev) ? p.dev : (script === 'nastaliq' && p.nastaliq) ? p.nastaliq : p.roman;
            return `
              <button type="button" class="match-btn right-btn" data-en="${escapeHTML(p.en)}">
                <span>${escapeHTML(koshur)}</span>
                ${script !== 'roman' && p.roman ? `<small class="match-sub">${escapeHTML(p.roman)}</small>` : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
      <div class="action-footer">
        <button type="button" id="btn-check-answer" class="btn-duo btn-primary" style="display:none">Continue</button>
      </div>
    `;
  }

  // --- 4. AUDIO / LISTENING DRILL ---
  renderListenHTML(item) {
    const script = this.getCurrentScript();
    return `
      <div class="exercise-header">
        <span class="badge-type">🎧 Audio Comprehension</span>
        <h3 class="exercise-instruction">${escapeHTML(item.instruction)}</h3>
      </div>
      <div class="audio-prompt-center">
        <button type="button" class="btn-audio-big" data-speak="${escapeHTML(item.audioText)}" title="Play Normal Speed">
          🔊
        </button>
        <button type="button" class="btn-audio-slow" data-speak="${escapeHTML(item.audioText)}" data-slow="true" title="Play Slow Speed">
          🐢 Slow
        </button>
      </div>
      <div class="choice-grid">
        ${item.options.map((opt, idx) => {
          const text = (script === 'dev' && opt.dev) ? opt.dev : (script === 'nastaliq' && opt.nastaliq) ? opt.nastaliq : opt.roman;
          return `
            <button type="button" class="choice-card" data-index="${idx}">
              <span class="choice-num">${idx + 1}</span>
              <div class="choice-content">
                <span class="choice-main ${script === 'nastaliq' ? 'koshur-rtl' : ''}">${escapeHTML(text)}</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>
      <div class="action-footer">
        <button type="button" id="btn-check-answer" class="btn-duo btn-primary" disabled>Check Answer</button>
      </div>
    `;
  }

  // --- 5. CLOZE / FILL IN THE BLANK ---
  renderClozeHTML(item) {
    const script = this.getCurrentScript();
    let template = item.sentenceTemplate;
    if (script === 'dev' && item.sentenceTemplateDev) template = item.sentenceTemplateDev;
    if (script === 'nastaliq' && item.sentenceTemplateNastaliq) template = item.sentenceTemplateNastaliq;

    const allOptions = [item.correctOption, ...item.distractors].sort(() => Math.random() - 0.5);
    const parts = template.split('{blank}');

    return `
      <div class="exercise-header">
        <span class="badge-type">📝 Fill in the Blank</span>
        <h3 class="exercise-instruction">Complete the Kashmiri sentence:</h3>
      </div>
      <div class="prompt-box">
        <span class="prompt-en">"${escapeHTML(item.sentenceEn)}"</span>
      </div>
      <div class="cloze-sentence ${script === 'nastaliq' ? 'koshur-rtl' : ''}">
        <span>${escapeHTML(parts[0])}</span>
        <span class="cloze-slot" id="cloze-slot">_____</span>
        <span>${escapeHTML(parts[1] || '')}</span>
      </div>
      <div class="cloze-options">
        ${allOptions.map((opt) => {
          const text = (script === 'dev' && opt.dev) ? opt.dev : (script === 'nastaliq' && opt.nastaliq) ? opt.nastaliq : opt.roman;
          const isCorrect = (opt.roman === item.correctOption.roman);
          return `
            <button type="button" class="cloze-btn" data-correct="${isCorrect}" data-text="${escapeHTML(text)}">
              ${escapeHTML(text)}
            </button>
          `;
        }).join('')}
      </div>
      <div class="action-footer">
        <button type="button" id="btn-check-answer" class="btn-duo btn-primary" disabled>Check Answer</button>
      </div>
    `;
  }

  // --- 6. DIALOGUE STORY ---
  renderStoryHTML(item) {
    const script = this.getCurrentScript();
    return `
      <div class="exercise-header">
        <span class="badge-type">📖 Cultural Story</span>
        <h3 class="exercise-instruction">${escapeHTML(item.storyTitle)}</h3>
      </div>
      <div class="story-dialogue-flow">
        ${item.dialogues.map(d => {
          const text = (script === 'dev' && d.textDev) ? d.textDev : (script === 'nastaliq' && d.textNastaliq) ? d.textNastaliq : d.textRoman;
          return `
            <div class="story-bubble ${d.speaker === 'Learner' ? 'bubble-right' : 'bubble-left'}">
              <strong class="speaker-tag">${escapeHTML(d.speaker)}</strong>
              <p class="story-text ${script === 'nastaliq' ? 'koshur-rtl' : ''}">${escapeHTML(text)}</p>
              <small class="story-trans">${escapeHTML(d.translation)}</small>
              <button type="button" class="btn-audio-mini" data-speak="${escapeHTML(d.textRoman)}">🔊</button>
            </div>
          `;
        }).join('')}
      </div>
      <div class="story-question-box">
        <h4 class="story-q-prompt">${escapeHTML(item.question.promptEn)}</h4>
        <div class="choice-grid">
          ${item.question.options.map((opt, idx) => {
            const text = (script === 'dev' && opt.dev) ? opt.dev : (script === 'nastaliq' && opt.nastaliq) ? opt.nastaliq : opt.roman;
            return `
              <button type="button" class="choice-card story-choice" data-index="${idx}">
                <span class="choice-num">${idx + 1}</span>
                <span class="choice-main">${escapeHTML(text)}</span>
              </button>
            `;
          }).join('')}
        </div>
      </div>
      <div class="action-footer">
        <button type="button" id="btn-check-answer" class="btn-duo btn-primary" disabled>Check Answer</button>
      </div>
    `;
  }

  // --- EVENT BINDINGS & EVALUATION ---
  bindExerciseEvents(item) {
    const checkBtn = document.getElementById('btn-check-answer');

    if (item.type === 'scramble') {
      const bank = document.getElementById('scramble-bank');
      const slots = document.getElementById('scramble-slots');
      const placeholder = document.getElementById('slot-placeholder');

      bank.querySelectorAll('.token-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.isAnswerChecked) return;
          const idx = parseInt(btn.dataset.index, 10);
          window.koshurAudio.playTap();

          if (!this.scrambleSelected.includes(idx)) {
            this.scrambleSelected.push(idx);
            btn.classList.add('token-disabled');
            if (placeholder) placeholder.style.display = 'none';

            const slotted = document.createElement('button');
            slotted.className = 'token-btn token-in-slot';
            slotted.textContent = btn.dataset.word;
            slotted.dataset.originalIndex = idx;
            slotted.addEventListener('click', () => {
              if (this.isAnswerChecked) return;
              window.koshurAudio.playUntap();
              this.scrambleSelected = this.scrambleSelected.filter(i => i !== idx);
              btn.classList.remove('token-disabled');
              slotted.remove();
              if (this.scrambleSelected.length === 0 && placeholder) placeholder.style.display = 'inline';
              checkBtn.disabled = this.scrambleSelected.length === 0;
            });
            slots.appendChild(slotted);
          }
          checkBtn.disabled = this.scrambleSelected.length === 0;
        });
      });

      checkBtn.addEventListener('click', () => this.evaluateScramble(item));
    } else if (item.type === 'choice' || item.type === 'listen') {
      const cards = document.querySelectorAll('.choice-card');
      cards.forEach(card => {
        card.addEventListener('click', () => {
          if (this.isAnswerChecked) return;
          window.koshurAudio.playTap();
          cards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          this.selectedChoiceIndex = parseInt(card.dataset.index, 10);
          checkBtn.disabled = false;
        });
      });

      checkBtn.addEventListener('click', () => this.evaluateChoice(item));
    } else if (item.type === 'cloze') {
      const btns = document.querySelectorAll('.cloze-btn');
      const slot = document.getElementById('cloze-slot');
      let selectedBtn = null;

      btns.forEach(b => {
        b.addEventListener('click', () => {
          if (this.isAnswerChecked) return;
          window.koshurAudio.playTap();
          btns.forEach(x => x.classList.remove('selected'));
          b.classList.add('selected');
          slot.textContent = b.dataset.text;
          slot.classList.add('slot-filled');
          selectedBtn = b;
          checkBtn.disabled = false;
        });
      });

      checkBtn.addEventListener('click', () => {
        if (!selectedBtn) return;
        const isCorrect = selectedBtn.dataset.correct === 'true';
        this.handleResult(isCorrect, item, isCorrect ? 'Excellent!' : `Correct answer: ${item.correctOption.roman}`);
      });
    } else if (item.type === 'match') {
      const leftBtns = document.querySelectorAll('.left-btn');
      const rightBtns = document.querySelectorAll('.right-btn');
      const totalPairs = item.pairs.length;

      const checkMatch = () => {
        if (this.matchSelected.left && this.matchSelected.right) {
          const lEn = this.matchSelected.left.dataset.en;
          const rEn = this.matchSelected.right.dataset.en;

          if (lEn === rEn) {
            window.koshurAudio.playMatch();
            this.matchSelected.left.classList.add('matched');
            this.matchSelected.right.classList.add('matched');
            this.matchSelected.left.disabled = true;
            this.matchSelected.right.disabled = true;
            this.matchedPairsCount += 1;
            this.matchSelected = { left: null, right: null };

            if (this.matchedPairsCount >= totalPairs) {
              window.koshurAudio.playCorrect();
              setTimeout(() => {
                this.currentIndex += 1;
                this.renderCurrentChallenge();
              }, 600);
            }
          } else {
            window.koshurAudio.playIncorrect();
            this.matchSelected.left.classList.add('error-shake');
            this.matchSelected.right.classList.add('error-shake');
            setTimeout(() => {
              if (this.matchSelected.left) this.matchSelected.left.classList.remove('selected', 'error-shake');
              if (this.matchSelected.right) this.matchSelected.right.classList.remove('selected', 'error-shake');
              this.matchSelected = { left: null, right: null };
            }, 500);
          }
        }
      };

      leftBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          leftBtns.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.matchSelected.left = btn;
          checkMatch();
        });
      });

      rightBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          rightBtns.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.matchSelected.right = btn;
          checkMatch();
        });
      });
    } else if (item.type === 'story') {
      const cards = document.querySelectorAll('.story-choice');
      cards.forEach(card => {
        card.addEventListener('click', () => {
          if (this.isAnswerChecked) return;
          window.koshurAudio.playTap();
          cards.forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          this.selectedChoiceIndex = parseInt(card.dataset.index, 10);
          checkBtn.disabled = false;
        });
      });

      checkBtn.addEventListener('click', () => {
        if (this.selectedChoiceIndex === null) return;
        const opt = item.question.options[this.selectedChoiceIndex];
        this.handleResult(opt.correct, item, opt.correct ? 'Story comprehension complete!' : 'Check the dialogue context!');
      });
    }
  }

  evaluateScramble(item) {
    if (this.isAnswerChecked) return;
    const isMatch = (this.scrambleSelected.length === item.correctOrder.length) &&
      this.scrambleSelected.every((val, idx) => val === item.correctOrder[idx]);

    const explanation = isMatch ? 'Shabash! Great Kashmiri sentence building.' : `Correct: ${item.targetRoman}`;
    this.handleResult(isMatch, item, explanation);
  }

  evaluateChoice(item) {
    if (this.isAnswerChecked || this.selectedChoiceIndex === null) return;
    const opt = item.options[this.selectedChoiceIndex];
    const correctOpt = item.options.find(o => o.correct);
    const explanation = opt.correct ? 'Varāi! Well done.' : `Correct answer: ${correctOpt ? correctOpt.roman : ''}`;
    this.handleResult(opt.correct, item, explanation);
  }

  handleResult(isCorrect, item, message) {
    this.isAnswerChecked = true;
    let tray = document.getElementById('feedback-tray');
    if (!tray) {
      tray = document.createElement('div');
      tray.id = 'feedback-tray';
      document.body.appendChild(tray);
    }
    
    const checkBtn = document.getElementById('btn-check-answer');
    if (checkBtn) checkBtn.style.display = 'none';

    if (isCorrect) {
      window.koshurAudio.playCorrect();
    } else {
      window.koshurAudio.playIncorrect();
      window.koshurGamification.deductHeart();
      window.koshurSRS.queueMistake(item);
      this.mistakesInRound.push(item);
    }

    tray.className = `feedback-tray ${isCorrect ? 'tray-correct' : 'tray-incorrect'} animate-slide-up`;
    tray.style.display = 'flex';
    tray.innerHTML = `
      <div class="feedback-content">
        <div class="feedback-icon">${isCorrect ? '🎉' : '❌'}</div>
        <div class="feedback-text">
          <h4>${isCorrect ? 'Correct!' : 'Incorrect'}</h4>
          <p>${escapeHTML(message)}</p>
        </div>
        <button type="button" id="btn-feedback-continue" class="btn-duo ${isCorrect ? 'btn-success' : 'btn-danger'}">
          Continue
        </button>
      </div>
    `;

    document.getElementById('btn-feedback-continue').addEventListener('click', () => {
      tray.style.display = 'none';
      tray.className = 'feedback-tray hidden';
      this.currentIndex += 1;
      this.renderCurrentChallenge();
    });
  }

  renderLessonSummary() {
    const container = document.getElementById('exercise-container');
    if (!container) return;

    window.koshurAudio.playVictory();
    const totalXP = this.currentLesson.xp || 20;
    const accuracy = Math.round(((this.currentLesson.items.length - this.mistakesInRound.length) / this.currentLesson.items.length) * 100);

    window.koshurGamification.completeLesson(this.currentLesson.id, {
      xp: totalXP,
      accuracy: accuracy
    });

    container.innerHTML = `
      <div class="summary-card animate-scale-up">
        <div class="trophy-bounce">🏆</div>
        <h2>Lesson Completed!</h2>
        <p class="summary-subtitle">Shabash! You made progress in Koshur.</p>

        <div class="stats-row">
          <div class="stat-pill">
            <span class="stat-icon">⚡</span>
            <span class="stat-val">+${totalXP} XP</span>
          </div>
          <div class="stat-pill">
            <span class="stat-icon">🎯</span>
            <span class="stat-val">${accuracy}%</span>
          </div>
          <div class="stat-pill">
            <span class="stat-icon">🍂</span>
            <span class="stat-val">+15 Chinar</span>
          </div>
        </div>

        ${this.mistakesInRound.length > 0 ? `
          <div class="mistake-review-alert">
            <p>You have ${this.mistakesInRound.length} question(s) to review in Practice Mistakes.</p>
          </div>
        ` : `
          <div class="perfect-round-banner">
            🌟 Perfect Lesson! Bonus Chinar Leaves awarded.
          </div>
        `}

        <div class="summary-actions">
          <button type="button" id="btn-finish-lesson" class="btn-duo btn-primary btn-lg">
            Back to Learning Path
          </button>
        </div>
      </div>
    `;

    document.getElementById('btn-finish-lesson').addEventListener('click', () => {
      if (this.onLessonCompleteCallback) this.onLessonCompleteCallback();
    });
  }
}

window.koshurExerciseRenderer = new KoshurExerciseRenderer();
