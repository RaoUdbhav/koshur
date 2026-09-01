# KoshurGo (کٲشُر لِنگو) — Interactive Kashmiri Language Learning

> Learn the Kashmiri language (*Koshur / कॉशुर / کٲشُر*) through gamified microlearning, spaced repetition, interactive word scramblers, and cultural immersion.

---

## 🌟 Features & Pedagogical Architecture

KoshurGo is built upon the **10 Core Duolingo Learning Experience Pillars** adapted for Kashmiri:
1. **Bite-Sized Microlearning**: 3–5 minute lessons with 7–10 interactive challenges.
2. **Adaptive Spaced Repetition (SRS)**: Algorithmic Leitner 5-box memory decay scheduling.
3. **Multimodal Interactive Exercises**:
   - 🧩 **Sentence Scrambler**: Tap token blocks to build Kashmiri sentences honoring V2 word order syntax.
   - ⚡ **Speed Pair Match**: 60-second time-attack matching game arena.
   - 🎧 **Audio Comprehension**: Native Web Audio SFX + Kashmiri phonetic speech synthesis.
   - 📝 **Cloze Fill-in-the-Blank**: Postpositions, gender agreement, and verb conjugations.
   - 📖 **Dialogue Stories (*Koshur Baath*)**: Interactive narrative dialogues set in Kashmiri cultural contexts (*Kahwa Stall*, *Dal Lake Shikara*, *Lal Chowk Bazaar*).
4. **Multi-Script Orthographic Scaffolding**: 1-click toggle between **Roman Latin transliteration** (default for beginners), **Devanagari (कॉशुर)**, and **Nastaliq (کٲشُر)**.
5. **Habit Loop & Daily Streaks**: Daily streak counter (🔥), streak freeze protections, and practice calendar log.
6. **Gamified Micro-Economy**: XP rewards, Hearts energy system (5 Hearts bar with "Practice Mistakes" free refill), and Chinar Leaves (🍂) currency.
7. **Personalized 3×3 Matrix**:
   - **3 Skill Levels**:
     - *Scratch (Novice)*: Alphabets, sounds, greetings, family, numbers 1–20, food.
     - *Basic (Foundational)*: Sentence construction, questions, market shopping, weather & seasons.
     - *Intense (Advanced)*: Split ergativity, complex past tenses, Kashmiri proverbs, and immersion stories.
   - **3 Daily Paces**:
     - *Easy / Relaxed*: 1 lesson/day · 10 XP target.
     - *Go / Regular*: 2–3 lessons/day · 30 XP target (Recommended).
     - *Intense / Hardcore*: 5+ lessons/day · 60+ XP target with speed challenge mode.
8. **Enhanced Proverb Cultural Engine**:
   - 🌟 **Proverb of the Day (روٗزانہٕ کَہاوَت)**: Daily rotating featured proverb with deep philosophical meaning and 1-click clipboard card sharing.
   - 🏷️ **Thematic Categorization**: Instant filters across *Wisdom*, *Humor/Satire*, *Nature & Kashmir*, *Food/Wazwan*, *Money/Trade*, and *Family*.
   - 🎯 **Kashmiri Proverb Challenge**: Interactive situational riddles testing real-world proverb application (+20 XP).
9. **Audio Lab & Phonetics Hub**:
   - 🔊 **Kashmiri Phonetic Normalizer**: Pre-processes Kashmiri vowels (*ɨ*, *ə*, *ɔ*) and palatalized consonants (*k’*, *ts’*) for crystal-clear browser speech synthesis.
   - 🎛️ **Variable Speed Control**: 0.6x (Turtle / Beginner), 0.85x (Standard), 1.0x (Native).
   - 📊 **Visual Waveform Equalizer**: Pulsing acoustic animation during Kashmiri audio playback.
   - 🎹 **The 16 Kashmiri Vowels (Achar) Masterclass**: Interactive audio grid for all short, long, and centralized vowels (*ɨ, ɨɨ, ə, əə, ɔ*).
   - 💬 **Native Conversational Audio Player**: 12 Interactive dialogue drills (*Bazaar Bargaining*, *Noon Chai & Hospitality*, *Meeting Friends*, *Road Navigation*, *Village Inquiries*, *Community Healthcare*, *Valley Weather*, *Hospitality & Safe Journeys*, *Meeting Neighbors*, *School & Village Education*, *Polite Etiquette & Gratitude*, and *Family & Relatives*) with line-by-line speech and slow playback.
11. **Full Reference Library**: Includes **264 hand-checked vocabulary words** across 13 categories and an all-new, completely redesigned **Kashmiri Proverbs Treasury** featuring clean pronounceable Roman, standard Devanagari (कॉशुर), and rich Hindi meanings (हिन्दी भावार्थ) with multi-speed audio.

---

## 📁 Repository Structure

```
learnkoshur/
├── index.html                      # Root launcher & redirect
├── netlify.toml                    # Netlify deployment configuration
├── duolingo_methodology/           # Pedagogical blueprints & datasets
│   ├── 10_duolingo_points_koshur.md
│   └── data/
│       ├── vocabulary.json         # 93 curated dictionary entries
│       └── proverbs.json           # 1,330 Omkar N. Koul proverbs
├── learnkoshur_site/               # Exact mirrored copy of learnkoshur.netlify.app
│   ├── index.html
│   ├── icon.svg
│   └── assets/
└── koshurgo/                       # Modern interactive learning platform
    ├── index.html                  # Main app UI
    ├── css/
    │   └── style.css               # Duolingo-styled Kashmiri UI design
    ├── js/
    │   ├── audio.js                # Web Audio API sound FX + speech engine
    │   ├── curriculum.js           # 3 Levels × 3 Paces lesson trees
    │   ├── exercises.js            # 6 interactive game archetypes
    │   ├── gamification.js         # Streaks, Hearts, XP, Chinar Leaves, Badges
    │   ├── firebase-auth.js        # Firebase Auth & Firestore cloud state sync
    │   ├── srs.js                  # Spaced repetition & Mistake review
    │   └── app.js                  # Main controller & view routing
    └── data/
        ├── vocabulary.json
        └── proverbs.json
```

---

## 🔒 Firebase Authentication & Cloud Sync

KoshurGo supports seamless multi-device progress synchronization using **Firebase Authentication & Firestore**:
- **Guest / Offline Mode**: Start practicing immediately without signing in (persists in `localStorage`).
- **1-Click Google Sign-In & Email Auth**: Upon sign-in, local guest progress (XP, streaks, unlocked lessons, Chinar Leaves) is automatically merged with your cloud account.
- **Real-Time Cross-Device Sync**: Progress made on your phone reflects instantly on your desktop.

### Connecting Your Own Firebase Project:
1. Create a project on [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication** (Google Provider & Email/Password Provider).
3. Enable **Cloud Firestore** in test or production mode.
4. Replace the credentials in [`koshurgo/js/firebase-auth.js`](file:///c:/Users/raoud/OneDrive/Desktop/learnkoshur/koshurgo/js/firebase-auth.js):
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_FIREBASE_API_KEY",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abcdef"
   };
   ```

---

## 🚀 How to Deploy on Netlify with Git

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete Firebase Auth and cloud sync integration"
   git push origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify Dashboard](https://app.netlify.com).
   - Click **Add new site** $\to$ **Import an existing project**.
   - Select **GitHub** and authorize repository `RaoUdbhav/koshur`.
   - **Build settings**:
     - *Build command*: (Leave empty for static site)
     - *Publish directory*: `.` (or root directory)
   - Click **Deploy site**.
