/**
 * KoshurGo Spaced Repetition (SRS) & Mistake Queue Manager
 */

class KoshurSRSEngine {
  constructor() {
    this.srsKey = 'koshurgo_srs_deck_v1';
    this.deck = this.loadDeck();
  }

  loadDeck() {
    try {
      const saved = localStorage.getItem(this.srsKey);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load SRS deck', e);
    }
    return {};
  }

  saveDeck() {
    try {
      localStorage.setItem(this.srsKey, JSON.stringify(this.deck));
    } catch (e) {
      console.warn('Could not save SRS deck', e);
    }
  }

  recordWordReview(wordKey, isCorrect) {
    if (!this.deck[wordKey]) {
      this.deck[wordKey] = {
        box: 1,
        reviewCount: 0,
        correctCount: 0,
        lastReviewed: Date.now(),
        nextDue: Date.now() + 1000 * 60 * 60 * 4 // 4 hours
      };
    }

    const item = this.deck[wordKey];
    item.reviewCount += 1;
    item.lastReviewed = Date.now();

    if (isCorrect) {
      item.correctCount += 1;
      item.box = Math.min(5, item.box + 1);
    } else {
      item.box = 1; // Reset to box 1 upon error
    }

    // Interval multiplier per box
    const intervals = [
      4 * 60 * 60 * 1000,      // Box 1: 4 hours
      24 * 60 * 60 * 1000,     // Box 2: 1 day
      3 * 24 * 60 * 60 * 1000, // Box 3: 3 days
      7 * 24 * 60 * 60 * 1000, // Box 4: 7 days
      14 * 24 * 60 * 60 * 1000 // Box 5: 14 days
    ];

    item.nextDue = Date.now() + intervals[item.box - 1];
    this.saveDeck();
  }

  getDueItems(vocabularyList) {
    const now = Date.now();
    return vocabularyList.filter(word => {
      const key = word.roman || word.en;
      const srsItem = this.deck[key];
      if (!srsItem) return true; // New words are due
      return srsItem.nextDue <= now;
    });
  }

  queueMistake(exerciseItem) {
    const gm = window.koshurGamification;
    if (!gm.state.mistakeQueue) gm.state.mistakeQueue = [];
    
    // Prevent duplicate entries
    const exists = gm.state.mistakeQueue.some(m => JSON.stringify(m) === JSON.stringify(exerciseItem));
    if (!exists) {
      gm.state.mistakeQueue.push(exerciseItem);
      gm.saveState();
    }
  }

  popMistake() {
    const gm = window.koshurGamification;
    if (gm.state.mistakeQueue && gm.state.mistakeQueue.length > 0) {
      const item = gm.state.mistakeQueue.shift();
      gm.saveState();
      return item;
    }
    return null;
  }

  getMistakeCount() {
    const gm = window.koshurGamification;
    return gm.state.mistakeQueue ? gm.state.mistakeQueue.length : 0;
  }
}

window.koshurSRS = new KoshurSRSEngine();
