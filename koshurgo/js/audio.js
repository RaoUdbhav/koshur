/**
 * KoshurGo Advanced Audio & Phonetics Engine
 * Combines Web Audio API synthesis for gamification SFX,
 * an intelligent Kashmiri Phonetic Transliteration normalizer for Speech Synthesis,
 * multi-speed playback (0.6x, 0.85x, 1.0x), and soundboard acoustic guides.
 */

class KoshurAudioEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.speechRate = 0.85;
    this.currentPlayingUtterance = null;
    this.initAudioContext();
  }

  initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch (e) {
        console.warn('Web Audio API not supported', e);
      }
    }
  }

  ensureContext() {
    if (!this.ctx) this.initAudioContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, startTime = 0, gainLevel = 0.18) {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime + startTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(gainLevel, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + duration + 0.05);
  }

  // --- GAMIFICATION SOUND EFFECTS ---
  playCorrect() {
    if (!this.soundEnabled) return;
    this.playTone(523.25, 'triangle', 0.12, 0, 0.22);      // C5
    this.playTone(659.25, 'triangle', 0.12, 0.08, 0.22);   // E5
    this.playTone(783.99, 'triangle', 0.14, 0.16, 0.25);   // G5
    this.playTone(1046.50, 'sine', 0.28, 0.24, 0.28);     // C6
  }

  playIncorrect() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(330, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.28);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  playTap() {
    if (!this.soundEnabled) return;
    this.playTone(880, 'sine', 0.04, 0, 0.08);
  }

  playUntap() {
    if (!this.soundEnabled) return;
    this.playTone(587, 'sine', 0.04, 0, 0.06);
  }

  playMatch() {
    if (!this.soundEnabled) return;
    this.playTone(659.25, 'sine', 0.08, 0, 0.18);
    this.playTone(880.00, 'triangle', 0.16, 0.07, 0.22);
  }

  playStreak() {
    if (!this.soundEnabled) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'triangle', 0.15, i * 0.08, 0.2);
    });
  }

  playVictory() {
    if (!this.soundEnabled) return;
    const chord1 = [523.25, 659.25, 783.99];
    const chord2 = [587.33, 739.99, 880.00];
    const chord3 = [659.25, 830.61, 987.77];
    const finalChord = [1046.50, 1318.51, 1567.98];

    chord1.forEach(f => this.playTone(f, 'triangle', 0.18, 0, 0.15));
    chord2.forEach(f => this.playTone(f, 'triangle', 0.18, 0.15, 0.15));
    chord3.forEach(f => this.playTone(f, 'triangle', 0.22, 0.30, 0.18));
    finalChord.forEach(f => this.playTone(f, 'sine', 0.55, 0.50, 0.22));
  }

  // --- KASHMIRI PHONETIC NORMALIZER & SPEECH SYNTHESIS ---

  /**
   * Translates Kashmiri Romanized diacritics into optimized phonetic tokens
   * for clear, natural speech synthesis across browser engines.
   */
  normalizeKashmiriPhonetics(text) {
    if (!text) return '';
    return text
      // Centralized vowels
      .replace(/ɨ/g, 'i')
      .replace(/ɨ’|ɨ'/g, 'ik')
      .replace(/ə/g, 'u')
      .replace(/ɔ/g, 'aw')
      .replace(/ãb|a:b/g, 'aab')
      .replace(/ã/g, 'aa')
      .replace(/õ:|õ/g, 'on')
      // Affricates & Aspirates
      .replace(/tsɨṭ/g, 'tsut')
      .replace(/ts’|ts'/g, 'ts')
      .replace(/tshõ:ḍ/g, 'tshond')
      .replace(/tsh/g, 'ch')
      .replace(/chhu/g, 'chhu')
      .replace(/chhes/g, 'chhes')
      .replace(/chhus/g, 'chhus')
      .replace(/gatsaan/g, 'gatsaan')
      // Palatalization markers
      .replace(/’|'/g, '')
      .replace(/ʿ|ʾ/g, '')
      .trim();
  }

  /**
   * Plays spoken Kashmiri with speed control & visual waveform trigger
   */
  speakText(text, isSlow = false, onEndCallback = null) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    window.speechSynthesis.cancel();

    // Trigger visual soundwave pulsing if active on page
    this.triggerWaveformAnimation(true);

    const phoneticText = this.normalizeKashmiriPhonetics(text);
    const utterance = new SpeechSynthesisUtterance(phoneticText);

    // Discover optimal Indian/Urdu/Hindi voice for Kashmiri tone
    const voices = window.speechSynthesis.getVoices();
    const koshurVoice = voices.find(v => 
      v.lang.startsWith('ks') || 
      v.lang.startsWith('ur') || 
      v.lang.startsWith('hi') || 
      (v.lang.includes('IN') && (v.name.includes('India') || v.name.includes('Hindi') || v.name.includes('Urdu')))
    ) || voices.find(v => v.lang.includes('IN'));

    if (koshurVoice) {
      utterance.voice = koshurVoice;
    }

    utterance.rate = isSlow ? 0.6 : this.speechRate;
    utterance.pitch = 1.05;

    utterance.onend = () => {
      this.triggerWaveformAnimation(false);
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = () => {
      this.triggerWaveformAnimation(false);
    };

    this.currentPlayingUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  triggerWaveformAnimation(isPlaying) {
    const waves = document.querySelectorAll('.soundwave-bar');
    waves.forEach(w => {
      w.classList.toggle('wave-active', isPlaying);
    });
  }

  // --- KASHMIRI PHONETIC SOUNDBOARD GUIDE ---
  getPhoneticGuide() {
    return [
      {
        symbol: 'ɨ (ॖ / ِ)',
        name: 'High Central Vowel',
        koshurEx: 'tsɨṭ (piece)',
        desc: 'Pronounced by keeping lips neutral and raising the middle of the tongue (between "ee" and "oo").',
        audioText: 'tsut'
      },
      {
        symbol: 'ə (ऺ / َ)',
        name: 'Mid Central Schwa',
        koshurEx: 'zə (two), gəd (fish)',
        desc: 'Short relaxed "uh" vowel, common in Kashmiri word endings.',
        audioText: 'zuh'
      },
      {
        symbol: 'ɔ (ॏ / ۄ)',
        name: 'Open Back Rounded',
        koshurEx: 'kɔli (river), dɔn (two)',
        desc: 'Open "aw" sound as in English "thought" or "caught".',
        audioText: 'kawli'
      },
      {
        symbol: 'ts (च़ / ژ)',
        name: 'Alveolar Affricate',
        koshurEx: 'tsoonth (apple), tsot (bread)',
        desc: 'Crisp "ts" sound as in "cats" or German "zeit".',
        audioText: 'tsoonth'
      },
      {
        symbol: 'tsh (छ़ / چھ)',
        name: 'Aspirated Affricate',
        koshurEx: 'tshond (searched)',
        desc: 'Heavily aspirated "ts" followed by a breath of air.',
        audioText: 'tshond'
      },
      {
        symbol: 'k’ / p’ / m’ (Palatalized)',
        name: 'Soft Palatalized Consonants',
        koshurEx: 'ɨk’ (one person)',
        desc: 'Consonant pronounced with the tongue arched toward the hard palate (with a subtle "y" glide).',
        audioText: 'iky'
      }
    ];
  }
}

// Global Singleton
window.koshurAudio = new KoshurAudioEngine();
