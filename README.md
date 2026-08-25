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
8. **Chinar Bazaar**: In-app shop to purchase Streak Freezes, Heart Refills, and bonus badges with earned Chinar Leaves.
9. **Full Reference Library**: Includes the complete **93 hand-checked vocabulary words** and all **1,330 Kashmiri proverbs** by Omkar N. Koul (2006).
10. **Preserved Classic Site**: The legacy dictionary and reference portal is fully preserved in `learnkoshur_site/`.

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
    │   ├── srs.js                  # Spaced repetition & Mistake review
    │   └── app.js                  # Main controller & view routing
    └── data/
        ├── vocabulary.json
        └── proverbs.json
```

---

## 🚀 How to Deploy on Netlify with Git

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "feat: launch KoshurGo interactive Kashmiri learning platform"
   git branch -M main
   git remote add origin https://github.com/RaoUdbhav/koshur.git
   git push -u origin main
   ```

2. **Connect to Netlify**:
   - Go to [Netlify Dashboard](https://app.netlify.com).
   - Click **Add new site** $\to$ **Import an existing project**.
   - Select **GitHub** and authorize repository `RaoUdbhav/koshur`.
   - **Build settings**:
     - *Build command*: (Leave empty for static site)
     - *Publish directory*: `.` (or root directory)
   - Click **Deploy site**.
