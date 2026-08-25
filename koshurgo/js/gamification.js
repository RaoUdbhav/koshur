/**
 * KoshurGo Gamification & Retention Engine
 * Manages Streaks (🔥), Hearts (❤️), XP, Chinar Leaves Currency (🍂), Badges & Bazaar.
 */

class KoshurGamification {
  constructor() {
    this.storageKey = 'koshurgo_user_state_v1';
    this.state = this.loadState();
    this.checkStreakIntegrity();
  }

  getDefaultState() {
    return {
      xp: 0,
      todayXP: 0,
      lastActiveDate: null,
      streak: 0,
      streakFreezes: 2,
      maxHearts: 5,
      hearts: 5,
      lastHeartDepletedTime: null,
      chinarLeaves: 120, // Start with welcome gift
      selectedLevel: 'scratch',
      selectedPace: 'go',
      scriptMode: 'roman', // 'roman', 'dev', 'nastaliq'
      showPhoneticSubtitles: true,
      completedLessons: {},
      unlockedUnits: ['u1', 'u5', 'u8'],
      mistakeQueue: [],
      badges: {
        firstLesson: { id: 'firstLesson', title: 'Chinar Sapling', icon: '🌱', desc: 'Completed your first Koshur lesson', unlocked: false },
        streak3: { id: 'streak3', title: 'Kahwa Streak', icon: '☕', desc: 'Maintained a 3-day learning streak', unlocked: false },
        streak7: { id: 'streak7', title: 'Saffron Flame', icon: '🔥', desc: 'Maintained a 7-day learning streak', unlocked: false },
        wordScrambler: { id: 'wordScrambler', title: 'Pheran Weaver', icon: '🧩', desc: 'Solved 10 sentence scramble puzzles', count: 0, unlocked: false },
        proverbsScholar: { id: 'proverbsScholar', title: 'Koshur Hakim', icon: '📜', desc: 'Explored 10 Kashmiri proverbs', count: 0, unlocked: false },
        xpMaster: { id: 'xpMaster', title: 'Chinar Master', icon: '🍁', desc: 'Earned 300+ XP in KoshurGo', unlocked: false }
      },
      practiceHistory: []
    };
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return { ...this.getDefaultState(), ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not read state from localStorage', e);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Could not save state', e);
    }
  }

  getTodayDateString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  checkStreakIntegrity() {
    const today = this.getTodayDateString();
    const lastActive = this.state.lastActiveDate;

    if (!lastActive) return;

    if (lastActive !== today) {
      // Check if it's yesterday
      const todayDate = new Date(today);
      const lastDate = new Date(lastActive);
      const diffTime = Math.abs(todayDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      this.state.todayXP = 0; // Reset daily XP for new day

      if (diffDays === 1) {
        // Safe, streak continues
      } else if (diffDays === 2 && this.state.streakFreezes > 0) {
        // Saved by streak freeze!
        this.state.streakFreezes -= 1;
        console.log('Streak freeze consumed to protect streak!');
      } else if (diffDays > 1) {
        // Streak lost
        this.state.streak = 0;
      }
      this.saveState();
    }
  }

  recordActivity(earnedXP) {
    const today = this.getTodayDateString();
    const isNewDay = this.state.lastActiveDate !== today;

    this.state.xp += earnedXP;
    this.state.todayXP = (this.state.todayXP || 0) + earnedXP;

    if (isNewDay) {
      this.state.streak += 1;
      this.state.lastActiveDate = today;
      if (!this.state.practiceHistory.includes(today)) {
        this.state.practiceHistory.push(today);
      }
      // Check streak badges
      if (this.state.streak >= 3) this.unlockBadge('streak3');
      if (this.state.streak >= 7) this.unlockBadge('streak7');
    }

    if (this.state.xp >= 300) this.unlockBadge('xpMaster');
    this.unlockBadge('firstLesson');

    // Chinar leaves reward
    this.state.chinarLeaves += Math.max(5, Math.floor(earnedXP / 2));
    this.saveState();
  }

  deductHeart() {
    if (this.state.hearts > 0) {
      this.state.hearts -= 1;
      this.state.lastHeartDepletedTime = Date.now();
      this.saveState();
    }
    return this.state.hearts;
  }

  refillHeartsFull() {
    this.state.hearts = this.state.maxHearts;
    this.saveState();
  }

  unlockBadge(badgeId) {
    if (this.state.badges[badgeId] && !this.state.badges[badgeId].unlocked) {
      this.state.badges[badgeId].unlocked = true;
      this.saveState();
      return true;
    }
    return false;
  }

  completeLesson(lessonId, scoreData) {
    this.state.completedLessons[lessonId] = {
      completedAt: Date.now(),
      score: scoreData.accuracy || 100,
      xpEarned: scoreData.xp || 15
    };
    this.recordActivity(scoreData.xp || 15);
  }

  buyItem(itemType, cost) {
    if (this.state.chinarLeaves >= cost) {
      this.state.chinarLeaves -= cost;
      if (itemType === 'streakFreeze') {
        this.state.streakFreezes += 1;
      } else if (itemType === 'refillHearts') {
        this.refillHeartsFull();
      }
      this.saveState();
      return { success: true, newBalance: this.state.chinarLeaves };
    }
    return { success: false, reason: 'Not enough Chinar Leaves' };
  }

  getLevelRankTitle(xp) {
    if (xp < 50) return { title: 'Chinar Seedling', rank: 1, icon: '🌱' };
    if (xp < 150) return { title: 'Saffron Sprout', rank: 2, icon: '🌸' };
    if (xp < 300) return { title: 'Pheran Apprentice', rank: 3, icon: '🧥' };
    if (xp < 500) return { title: 'Dal Lake Navigator', rank: 4, icon: '⛵' };
    if (xp < 800) return { title: 'Koshur Scholar', rank: 5, icon: '📜' };
    return { title: 'Grand Koshur Hakim', rank: 6, icon: '👑' };
  }
}

window.koshurGamification = new KoshurGamification();
