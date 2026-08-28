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

  normalizeKashmiriPhonetics(text) {
    if (!text) return '';
    return text
      // Centralized vowels & length
      .replace(/ɨɨ|ॗ/g, 'ee')
      .replace(/ɨ|ॖ/g, 'i')
      .replace(/əə|ऻ/g, 'aa')
      .replace(/ə|ऺ/g, 'u')
      .replace(/ɔɔ/g, 'aw')
      .replace(/ɔ|ॏ/g, 'aw')
      .replace(/ãb|a:b/g, 'aab')
      .replace(/ã/g, 'aa')
      .replace(/õ:|õ/g, 'on')
      // Affricates & Specific Kashmiri Vocabulary
      .replace(/tsɨṭ/g, 'tsut')
      .replace(/tsoonth/g, 'tsoonth')
      .replace(/tsot/g, 'tsot')
      .replace(/ts’|ts'/g, 'ts')
      .replace(/tshõ:ḍ|tshond/g, 'tshond')
      .replace(/tsh/g, 'ch')
      .replace(/chhu/g, 'chhu')
      .replace(/chhes/g, 'chhes')
      .replace(/chhus/g, 'chhus')
      .replace(/chhiv/g, 'chhiv')
      .replace(/chhaa/g, 'chhaa')
      .replace(/gatsaan/g, 'gatsaan')
      .replace(/waraai/g, 'waraay')
      .replace(/khudaayun/g, 'khudaayun')
      .replace(/shukur/g, 'shukur')
      // Palatalization markers
      .replace(/’|'/g, '')
      .replace(/ʿ|ʾ/g, '')
      .trim();
  }

  speakText(text, isSlow = false, onEndCallback = null) {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported in this browser');
      return;
    }

    window.speechSynthesis.cancel();
    this.triggerWaveformAnimation(true);

    const phoneticText = this.normalizeKashmiriPhonetics(text);
    const utterance = new SpeechSynthesisUtterance(phoneticText);

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

    utterance.rate = isSlow ? 0.55 : this.speechRate;
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

  // --- THE 16 KASHMIRI VOWELS (ACHAR) DATASET ---
  getVowelMasterclass() {
    return [
      {
        vowel: 'a (अ / َ)',
        type: 'Short Front',
        koshurWord: 'az (today)',
        nastaliq: 'اَز',
        dev: 'अज़',
        desc: 'Short neutral "a" sound as in "sun" or "cup".',
        audioKey: 'az'
      },
      {
        vowel: 'aa (आ / آ)',
        type: 'Long Front',
        koshurWord: 'aab (water)',
        nastaliq: 'آب',
        dev: 'आब',
        desc: 'Long open vowel as in English "father".',
        audioKey: 'aab'
      },
      {
        vowel: 'i (इ / ِ)',
        type: 'Short High',
        koshurWord: 'il (cardamom)',
        nastaliq: 'اِل',
        dev: 'इल',
        desc: 'Short crisp "i" as in "sit" or "pin".',
        audioKey: 'il'
      },
      {
        vowel: 'ee / ii (ई / ی)',
        type: 'Long High',
        koshurWord: 'teer (cold)',
        nastaliq: 'تِیر',
        dev: 'तीर',
        desc: 'Long "ee" sound as in "deep" or "fleet".',
        audioKey: 'teer'
      },
      {
        vowel: 'u (उ / ُ)',
        type: 'Short Back',
        koshurWord: 'un (blind)',
        nastaliq: 'اُن',
        dev: 'उन',
        desc: 'Short "u" as in "put" or "foot".',
        audioKey: 'un'
      },
      {
        vowel: 'oo / uu (ऊ / و)',
        type: 'Long Back',
        koshurWord: 'door (far)',
        nastaliq: 'دُور',
        dev: 'दूर',
        desc: 'Long "oo" as in "moon" or "flute".',
        audioKey: 'door'
      },
      {
        vowel: 'ɨ (ॖ / ٕ)',
        type: 'Centralized Short (Unique)',
        koshurWord: 'tsɨṭ (piece/slice)',
        nastaliq: 'ژٕٹ',
        dev: 'च़ॖट',
        desc: 'High central vowel: Make an "ee" mouth shape while making a sound in the middle of your tongue.',
        audioKey: 'tsut'
      },
      {
        vowel: 'ɨɨ (ॗ / ٖ)',
        type: 'Centralized Long (Unique)',
        koshurWord: 'tshɨɨr (delay / late)',
        nastaliq: 'چھٖیر',
        dev: 'छ़ॗर',
        desc: 'Held long high central vowel.',
        audioKey: 'tsheer'
      },
      {
        vowel: 'ə (ऺ / ٚ)',
        type: 'Mid Central Schwa (Unique)',
        koshurWord: 'gəd (fish)',
        nastaliq: 'گٲڈ',
        dev: 'गऺड',
        desc: 'Short mid-central relaxed vowel, very common in Kashmiri noun roots.',
        audioKey: 'gud'
      },
      {
        vowel: 'əə (ऻ / ٛ)',
        type: 'Long Mid Central (Unique)',
        koshurWord: 'məəl (father)',
        nastaliq: 'مٲل',
        dev: 'मऻल',
        desc: 'Extended mid-central vowel tone.',
        audioKey: 'maal'
      },
      {
        vowel: 'ɔ (ॏ / ۄ)',
        type: 'Open Back Rounded (Unique)',
        koshurWord: 'dɔd (milk)',
        nastaliq: 'دۄد',
        dev: 'दॏद',
        desc: 'Open "aw" vowel as in English "caught" or "law".',
        audioKey: 'dawd'
      },
      {
        vowel: 'e (ऎ / ॆ)',
        type: 'Short Mid-Front',
        koshurWord: 'en (glasses)',
        nastaliq: 'ایٚن',
        dev: 'ऎन',
        desc: 'Crisp short "e" as in "bed".',
        audioKey: 'en'
      }
    ];
  }

  // --- NATIVE CONVERSATIONAL DIALOGUES DATASET ---
  getNativeConversations() {
    return [
      {
        title: 'Bazaar-as Manz (At the Market)',
        situation: 'Negotiating prices with a Srinagar fruit and spice vendor.',
        lines: [
          { speaker: 'Customer', koshur: 'Yath kyah chhu mol?', meaning: 'What is the price of this?', audio: 'Yath kyah chhu mol?' },
          { speaker: 'Shopkeeper', koshur: 'Daah rupayi darjan haz.', meaning: 'Ten rupees a dozen, sir.', audio: 'Daah rupayi darjan haz.' },
          { speaker: 'Customer', koshur: 'Kamyi dyiv na haz, bi chhus daaymi graahakh.', meaning: 'Give it for less please, I am a regular buyer.', audio: 'Kamyi dyiv na haz, bi chhus daaymi graahakh.' },
          { speaker: 'Shopkeeper', koshur: 'Wara mol chhu haz, tulyiv saaseth!', meaning: 'This is the best genuine price, take it with joy!', audio: 'Wara mol chhu haz, tulyiv saaseth!' }
        ]
      },
      {
        title: 'Kashmiri Hospitality & Tea (Chay-i Peth)',
        situation: 'Welcoming a guest into a traditional Kashmiri home.',
        lines: [
          { speaker: 'Host', koshur: 'Pakh haz andar, valiv baheev.', meaning: 'Please step inside, come sit down comfortably.', audio: 'Pakh haz andar, valiv baheev.' },
          { speaker: 'Guest', koshur: 'Shukur haz parwardigaaras.', meaning: 'Thank you very much, praise be to God.', audio: 'Shukur haz parwardigaaras.' },
          { speaker: 'Host', koshur: 'Noon Chai cheyiv kin Modur Kahwa?', meaning: 'Will you have Salted Pink Tea or Sweet Almond Kahwa?', audio: 'Noon Chai cheyiv kin Modur Kahwa?' },
          { speaker: 'Guest', koshur: 'Me dyiv akh pyala garam Kahwa tsot-i seeth.', meaning: 'Please give me a warm cup of Kahwa with traditional bread.', audio: 'Me dyiv akh pyala garam Kahwa tsot-i seeth.' }
        ]
      },
      {
        title: 'Meeting a Friend in Srinagar (Haal-Chaal)',
        situation: 'Inquiring about family and daily life.',
        lines: [
          { speaker: 'Farooq', koshur: 'Toh’ chhiva waraai? Ghar-as manz chhaa saari theek?', meaning: 'Are you doing well? Is everyone at home in good health?', audio: 'Toh’ chhiva waraai? Ghar-as manz chhaa saari theek?' },
          { speaker: 'Sameer', koshur: 'Ahan haz, meherbani. Saari chhi theek.', meaning: 'Yes sir, by your kindness. Everyone is healthy.', audio: 'Ahan haz, meherbani. Saari chhi theek.' },
          { speaker: 'Farooq', koshur: 'Koshur hetsaan chhu baasān asul.', meaning: 'Learning Kashmiri feels so good and enriching.', audio: 'Koshur hetsaan chhu baasān asul.' }
        ]
      },
      {
        title: 'Asking Directions & Road Travel (Wath Pruchhun)',
        situation: 'Asking locals for navigation along valley roads and mountain paths.',
        lines: [
          { speaker: 'Traveller', koshur: 'Yi wath kot chhi gatsaan?', meaning: 'Where does this road lead to?', audio: 'Yi wath kot chhi gatsaan?' },
          { speaker: 'Local', koshur: 'Yi wath chhi seedi shahr-as gatsaan.', meaning: 'This road leads straight to the city.', audio: 'Yi wath chhi seedi shahr-as gatsaan.' },
          { speaker: 'Traveller', koshur: 'Huti jangal-as manz gasnech wath kapeer chhi?', meaning: 'Which way leads through the forest path?', audio: 'Huti jangal-as manz gasnech wath kapeer chhi?' },
          { speaker: 'Local', koshur: 'Naalah-as nish pakhiv, wath chhi aasaan.', meaning: 'Walk along the mountain stream, the path is easy.', audio: 'Naalah-as nish pakhiv, wath chhi aasaan.' }
        ]
      },
      {
        title: 'Village & Community Inquiries (Gom-as Manz)',
        situation: 'Respectfully inquiring about homes and elders in a Kashmiri village.',
        lines: [
          { speaker: 'Visitor', koshur: 'Yi dukaan ti makaan kəmsund chhu?', meaning: 'Whose shop and house is this?', audio: 'Yi dukaan ti makaan kəmsund chhu?' },
          { speaker: 'Villager', koshur: 'Yi chhu kaandar saeb-un dukaan.', meaning: 'This is the master baker’s traditional shop.', audio: 'Yi chhu kaandar saeb-un dukaan.' },
          { speaker: 'Visitor', koshur: 'Moulvi saeb-un ghar kateth chhu?', meaning: 'Where is the respected scholar/elder’s home?', audio: 'Moulvi saeb-un ghar kateth chhu?' },
          { speaker: 'Villager', koshur: 'Makanas darwaza kholyiv, su chhu andar behith.', meaning: 'Step to the door, he is seated inside with guests.', audio: 'Makanas darwaza kholyiv, su chhu andar behith.' }
        ]
      },
      {
        title: 'Community Care & Well-being (Dawaah ti Shifa)',
        situation: 'Helping someone unwell and offering reassurance.',
        lines: [
          { speaker: 'Doctor', koshur: 'Imes kyah chhu naav? Kahan chhu daag?', meaning: 'What is his name? Where is the pain located?', audio: 'Imes kyah chhu naav? Kahan chhu daag?' },
          { speaker: 'Family', koshur: 'Meherbani kərith dyiv imes dawaah.', meaning: 'Please give him soothing medicine.', audio: 'Meherbani kərith dyiv imes dawaah.' },
          { speaker: 'Doctor', koshur: 'Asi karav mushkil door karnech koshish, aaraam kariyiv.', meaning: 'We will do our best to help relieve the pain, please rest.', audio: 'Asi karav mushkil door karnech koshish, aaraam kariyiv.' }
        ]
      },
      {
        title: 'Weather & Daily Conversation (Mousam ti Rozmarrah Baath)',
        situation: 'Chatting about Valley weather, rain, and language understanding.',
        lines: [
          { speaker: 'Traveller', koshur: 'Az maa peyi rood?', meaning: 'Is there any chance of rain today?', audio: 'Az maa peyi rood?' },
          { speaker: 'Local', koshur: 'Na haz, az chhu aasmaan saaf ti asul taaph.', meaning: 'No sir, the sky is clear with pleasant sunshine.', audio: 'Na haz, az chhu aasmaan saaf ti asul taaph.' },
          { speaker: 'Traveller', koshur: 'Tohi chhivaa angreezi bolaan?', meaning: 'Do you speak English?', audio: 'Tohi chhivaa angreezi bolaan?' },
          { speaker: 'Local', koshur: 'Kãh kãh lafz haz, tohi hekivaa dobaara vanith?', meaning: 'A few words sir, could you please say it again?', audio: 'Kãh kãh lafz haz, tohi hekivaa dobaara vanith?' }
        ]
      },
      {
        title: 'Warm Hospitality & Safe Journeys (Rukhsat ti Dua)',
        situation: 'Exchanging blessings and phone numbers with a host before traveling.',
        lines: [
          { speaker: 'Host', koshur: 'Kunsaat yiyiziv saanis gharas manz!', meaning: 'Please visit our home again soon!', audio: 'Kunsaat yiyiziv saanis gharas manz!' },
          { speaker: 'Guest', koshur: 'Yi chhu myon phone number. Agar mouqa aav, beyi samkhav.', meaning: 'Here is my phone number. If chance permits, we shall meet again.', audio: 'Yi chhu myon phone number. Agar mouqa aav, beyi samkhav.' },
          { speaker: 'Host', koshur: 'Khudaay kərinav tuhinz rachh, neryiv khudaayas havaal!', meaning: 'May the Almighty protect you, have a blessed and safe journey!', audio: 'Khudaay kərinav tuhinz rachh, neryiv khudaayas havaal!' }
        ]
      }
    ];
  }
}

// Global Singleton
window.koshurAudio = new KoshurAudioEngine();
