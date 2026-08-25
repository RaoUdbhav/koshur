/**
 * KoshurGo Firebase Authentication & Cloud Sync Engine
 * Handles Google Login, Email/Password Login, and Two-Way Firestore State Sync.
 */

// Production Firebase Configuration for LearnKoshur
const firebaseConfig = {
  apiKey: "AIzaSyDm9cz1RfTBDME9-jdWtUYVPbe0MVszfcU",
  authDomain: "learnkoshur.firebaseapp.com",
  projectId: "learnkoshur",
  storageBucket: "learnkoshur.firebasestorage.app",
  messagingSenderId: "665552882941",
  appId: "1:665552882941:web:bb33e9056b7170b132c294",
  measurementId: "G-8G4JTMN2L7"
};

class KoshurFirebaseAuth {
  constructor() {
    this.auth = null;
    this.db = null;
    this.analytics = null;
    this.currentUser = null;
    this.isFirebaseReady = false;
    this.unsubscribeFirestore = null;
    this.syncStatus = 'local'; // 'local', 'syncing', 'synced', 'error'
    this.initFirebase();
  }

  initFirebase() {
    try {
      if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
          firebase.initializeApp(firebaseConfig);
        }
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        if (typeof firebase.analytics === 'function') {
          try {
            this.analytics = firebase.analytics();
          } catch (anErr) {
            console.log('Analytics initialization note:', anErr);
          }
        }
        this.isFirebaseReady = true;

        this.auth.onAuthStateChanged((user) => {
          this.handleAuthStateChange(user);
        });
      } else {
        console.log('Firebase SDK not loaded, running in offline/local storage mode.');
      }
    } catch (e) {
      console.warn('Firebase initialization error (running in local mode):', e);
      this.isFirebaseReady = false;
    }
  }

  async handleAuthStateChange(user) {
    const gm = window.koshurGamification;
    if (user) {
      this.currentUser = user;
      this.syncStatus = 'syncing';
      gm.state.isLoggedIn = true;
      gm.state.userId = user.uid;
      gm.state.userEmail = user.email;
      gm.state.userDisplayName = user.displayName || user.email.split('@')[0];
      gm.state.userPhotoURL = user.photoURL || null;
      gm.saveState();

      // Trigger Cloud-to-Local Intelligent Merge
      await this.syncWithCloud(user.uid);
      this.syncStatus = 'synced';
    } else {
      this.currentUser = null;
      this.syncStatus = 'local';
      gm.state.isLoggedIn = false;
      gm.state.userId = null;
      gm.state.userEmail = null;
      gm.state.userDisplayName = null;
      gm.state.userPhotoURL = null;
      gm.saveState();

      if (this.unsubscribeFirestore) {
        this.unsubscribeFirestore();
        this.unsubscribeFirestore = null;
      }
    }

    if (window.koshurGoApp) {
      window.koshurGoApp.updateHeaderStats();
      if (window.koshurGoApp.currentView === 'profile') {
        window.koshurGoApp.renderView('profile');
      }
    }
  }

  /**
   * Intelligently merges local progress with Firestore cloud profile
   */
  async syncWithCloud(userId) {
    if (!this.db || !this.isFirebaseReady) return;

    try {
      const userDocRef = this.db.collection('koshur_users').doc(userId);
      const docSnap = await userDocRef.get();
      const gm = window.koshurGamification;
      const local = gm.state;

      if (docSnap.exists) {
        const cloud = docSnap.data();

        // Merge strategies (take highest achievements)
        const mergedState = {
          ...local,
          xp: Math.max(local.xp || 0, cloud.xp || 0),
          streak: Math.max(local.streak || 0, cloud.streak || 0),
          streakFreezes: Math.max(local.streakFreezes || 0, cloud.streakFreezes || 0),
          chinarLeaves: Math.max(local.chinarLeaves || 0, cloud.chinarLeaves || 0),
          hearts: local.hearts !== undefined ? local.hearts : 5,
          selectedLevel: local.selectedLevel || cloud.selectedLevel || 'scratch',
          selectedPace: local.selectedPace || cloud.selectedPace || 'go',
          scriptMode: local.scriptMode || cloud.scriptMode || 'roman',
          completedLessons: { ...(cloud.completedLessons || {}), ...(local.completedLessons || {}) },
          practiceHistory: Array.from(new Set([...(local.practiceHistory || []), ...(cloud.practiceHistory || [])])),
          badges: { ...local.badges }
        };

        // Merge unlocked badges
        if (cloud.badges) {
          Object.keys(cloud.badges).forEach(bKey => {
            if (cloud.badges[bKey] && cloud.badges[bKey].unlocked) {
              if (mergedState.badges[bKey]) mergedState.badges[bKey].unlocked = true;
            }
          });
        }

        mergedState.syncedAt = Date.now();
        gm.state = mergedState;
        gm.saveState();

        // Push back the merged state to cloud
        await userDocRef.set({
          ...mergedState,
          email: this.currentUser.email,
          displayName: this.currentUser.displayName || null,
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

      } else {
        // First cloud sync: push current local state to cloud
        await userDocRef.set({
          ...local,
          email: this.currentUser.email,
          displayName: this.currentUser.displayName || null,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      // Realtime listener for cross-device updates
      if (!this.unsubscribeFirestore) {
        this.unsubscribeFirestore = userDocRef.onSnapshot((snap) => {
          if (snap.exists && !snap.metadata.hasPendingWrites) {
            const data = snap.data();
            gm.state.xp = Math.max(gm.state.xp, data.xp || 0);
            gm.state.streak = Math.max(gm.state.streak, data.streak || 0);
            gm.state.chinarLeaves = Math.max(gm.state.chinarLeaves, data.chinarLeaves || 0);
            gm.saveState();
            if (window.koshurGoApp) window.koshurGoApp.updateHeaderStats();
          }
        });
      }

    } catch (e) {
      console.warn('Cloud sync encountered an issue:', e);
      this.syncStatus = 'error';
    }
  }

  /**
   * Pushes latest state to Cloud on completing lessons or buying items
   */
  async pushStateUpdate() {
    if (!this.currentUser || !this.db || !this.isFirebaseReady) return;
    try {
      const gm = window.koshurGamification;
      const userDocRef = this.db.collection('koshur_users').doc(this.currentUser.uid);
      await userDocRef.set({
        xp: gm.state.xp,
        todayXP: gm.state.todayXP,
        streak: gm.state.streak,
        streakFreezes: gm.state.streakFreezes,
        chinarLeaves: gm.state.chinarLeaves,
        hearts: gm.state.hearts,
        selectedLevel: gm.state.selectedLevel,
        selectedPace: gm.state.selectedPace,
        scriptMode: gm.state.scriptMode,
        completedLessons: gm.state.completedLessons,
        practiceHistory: gm.state.practiceHistory,
        badges: gm.state.badges,
        lastActiveDate: gm.state.lastActiveDate,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      this.syncStatus = 'synced';
    } catch (e) {
      console.warn('Could not push state update to Firestore', e);
    }
  }

  // --- AUTH ACTIONS ---
  async loginWithGoogle() {
    if (!this.auth) {
      alert('Firebase Auth is ready for your project credentials! See Settings to configure keys.');
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
      await this.auth.signInWithPopup(provider);
      window.koshurAudio.playVictory();
    } catch (e) {
      console.error('Google Sign-in failed:', e);
      alert('Google Sign-In: ' + e.message);
    }
  }

  async loginWithEmail(email, password) {
    if (!this.auth) return;
    try {
      await this.auth.signInWithEmailAndPassword(email, password);
      window.koshurAudio.playVictory();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async signUpWithEmail(email, password) {
    if (!this.auth) return;
    try {
      await this.auth.createUserWithEmailAndPassword(email, password);
      window.koshurAudio.playVictory();
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async logout() {
    if (!this.auth) return;
    try {
      await this.auth.signOut();
      window.koshurAudio.playTap();
    } catch (e) {
      console.error('Logout error:', e);
    }
  }
}

window.koshurAuth = new KoshurFirebaseAuth();
