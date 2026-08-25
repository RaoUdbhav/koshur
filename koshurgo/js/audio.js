/**
 * KoshurGo Audio Engine
 * Uses Web Audio API for synthetic gamification sound effects (100% offline & instant)
 * and Web Speech API / phonetic speech for Kashmiri audio pronunciations.
 */

class KoshurAudioEngine {
  constructor() {
    this.ctx = null;
    this.soundEnabled = true;
    this.speechRate = 0.85;
    this.initAudioContext();
  }

  initAudioContext() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext && !this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch (e) {
        console.warn('Web Audio API not supported in this browser', e);
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

  /**
   * Cheerful Major Triad chime for correct answer (C5 -> E5 -> G5 -> C6)
   */
  playCorrect() {
    if (!this.soundEnabled) return;
    this.playTone(523.25, 'triangle', 0.12, 0, 0.22);      // C5
    this.playTone(659.25, 'triangle', 0.12, 0.08, 0.22);   // E5
    this.playTone(783.99, 'triangle', 0.14, 0.16, 0.25);   // G5
    this.playTone(1046.50, 'sine', 0.28, 0.24, 0.28);     // C6
  }

  /**
   * Soft descending tone for incorrect answer
   */
  playIncorrect() {
    if (!this.soundEnabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(330, t); // E4
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.28);

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.35);
  }

  /**
   * Subtle click / token select
   */
  playTap() {
    if (!this.soundEnabled) return;
    this.playTone(880, 'sine', 0.04, 0, 0.08);
  }

  /**
   * Token deselect / unslot
   */
  playUntap() {
    if (!this.soundEnabled) return;
    this.playTone(587, 'sine', 0.04, 0, 0.06);
  }

  /**
   * Combo match sound
   */
  playMatch() {
    if (!this.soundEnabled) return;
    this.playTone(659.25, 'sine', 0.08, 0, 0.18);
    this.playTone(880.00, 'triangle', 0.16, 0.07, 0.22);
  }

  /**
   * Streak celebration sound (Arpeggio)
   */
  playStreak() {
    if (!this.soundEnabled) return;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'triangle', 0.15, i * 0.08, 0.2);
    });
  }

  /**
   * Lesson completion fanfare
   */
  playVictory() {
    if (!this.soundEnabled) return;
    const chord1 = [523.25, 659.25, 783.99]; // C major
    const chord2 = [587.33, 739.99, 880.00]; // D major
    const chord3 = [659.25, 830.61, 987.77]; // E major
    const finalChord = [1046.50, 1318.51, 1567.98]; // High C

    chord1.forEach(f => this.playTone(f, 'triangle', 0.18, 0, 0.15));
    chord2.forEach(f => this.playTone(f, 'triangle', 0.18, 0.15, 0.15));
    chord3.forEach(f => this.playTone(f, 'triangle', 0.22, 0.30, 0.18));
    finalChord.forEach(f => this.playTone(f, 'sine', 0.55, 0.50, 0.22));
  }

  /**
   * Kashmiri Speech Pronunciation Helper
   */
  speakText(text, slow = false) {
    if (!('speechSynthesis' in window)) {
      console.log('Speech synthesis not supported in browser');
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\'\"\`\~\^]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Look for Urdu/Hindi or Kashmiri voice if installed on OS
    const voices = window.speechSynthesis.getVoices();
    const koshurVoice = voices.find(v => v.lang.startsWith('ks') || v.lang.startsWith('ur') || v.lang.startsWith('hi') || v.lang.includes('India'));

    if (koshurVoice) {
      utterance.voice = koshurVoice;
    }

    utterance.rate = slow ? 0.6 : this.speechRate;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  }
}

// Global singleton instance
window.koshurAudio = new KoshurAudioEngine();
