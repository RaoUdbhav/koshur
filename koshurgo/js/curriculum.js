/**
 * KoshurGo Curriculum & Course Blueprint
 * Structured across 3 Levels (Scratch, Basic, Intense) and 3 Paces (Easy, Go, Intense).
 * Supports triple-script: Roman Latin, Devanagari, and Nastaliq.
 */

const KOSHUR_CURRICULUM = {
  levels: {
    scratch: {
      id: 'scratch',
      title: 'Scratch',
      subTitle: 'Novice · Absolute Beginner',
      nastaliq: 'نوآموز',
      dev: 'नौसिखिया',
      description: 'Zero prior knowledge required. Learn sounds, essential greetings, family members, numbers, and basic survival words with Roman transliteration.',
      color: '#3E7C82',
      accent: '#7FC3C9',
      units: [
        {
          id: 'u1',
          title: 'Unit 1: Greetings & Warmth',
          nastaliq: 'سلام تہٕ خیریت',
          dev: 'सलाम तऺ खैरियत',
          description: 'Essential polite greetings and well-wishes used daily in Kashmir.',
          icon: '👋',
          lessons: [
            {
              id: 'u1_l1',
              title: 'First Encounters',
              xp: 15,
              items: [
                {
                  type: 'scramble',
                  instruction: 'Assemble the Kashmiri sentence for: "Peace be upon you / Hello"',
                  targetEn: 'Peace be upon you',
                  targetRoman: 'As-salāmu ʿalaykum',
                  targetDev: 'अस्सलामु अलैकुम',
                  targetNastaliq: 'اَلسَّلَامُ عَلَیْکُمْ',
                  tokensRoman: ['As-salāmu', 'ʿalaykum', 'shukriya', 'moli'],
                  tokensDev: ['अस्सलामु', 'अलैकुम', 'शुक्रिया', 'मोली'],
                  tokensNastaliq: ['اَلسَّلَامُ', 'عَلَیْکُمْ', 'شُکریہ', 'مولی'],
                  correctOrder: [0, 1]
                },
                {
                  type: 'choice',
                  promptEn: 'How do you say "Thank you" in Koshur?',
                  options: [
                    { roman: 'Shukriya', dev: 'शुक्रिया', nastaliq: 'شُکریہ', correct: true },
                    { roman: 'Ãb', dev: 'आब', nastaliq: 'آب', correct: false },
                    { roman: 'Tsot', dev: 'च़ॊत', nastaliq: 'ژۄٹ', correct: false },
                    { roman: 'Nãr', dev: 'नार', nastaliq: 'نار', correct: false }
                  ]
                },
                {
                  type: 'match',
                  instruction: 'Match the greeting pairs',
                  pairs: [
                    { en: 'Hello / Greetings', roman: 'Namaskār / Salam', dev: 'नमस्कार / सलाम', nastaliq: 'نمَسکار / سَلام' },
                    { en: 'Thank you', roman: 'Shukriya', dev: 'शुक्रिया', nastaliq: 'شُکریہ' },
                    { en: 'Yes', roman: 'Aahan', dev: 'आहन', nastaliq: 'آہن' },
                    { en: 'No', roman: 'Na', dev: 'न', nastaliq: 'نہٕ' }
                  ]
                },
                {
                  type: 'listen',
                  instruction: 'Listen to the audio and select the matching word',
                  audioText: 'Varāi',
                  correctEn: 'Fine / In good health',
                  options: [
                    { roman: 'Varāi', dev: 'वराई', nastaliq: 'ورٲی', correct: true },
                    { roman: 'Ghar', dev: 'घर', nastaliq: 'گھر', correct: false },
                    { roman: 'Chai', dev: 'चाय', nastaliq: 'چائے', correct: false },
                    { roman: 'Dah', dev: 'दह', nastaliq: 'دہ', correct: false }
                  ]
                },
                {
                  type: 'cloze',
                  sentenceEn: 'How are you? (To an elder/formal)',
                  sentenceTemplate: '{blank} chhiva varāi?',
                  sentenceTemplateDev: '{blank} छिवा वराई?',
                  sentenceTemplateNastaliq: '{blank} چھِوا ورٲی؟',
                  correctOption: { roman: 'Tohi', dev: 'तॊहि', nastaliq: 'تۆہہِ' },
                  distractors: [
                    { roman: 'Me', dev: 'मे', nastaliq: 'مےٚ' },
                    { roman: 'Su', dev: 'सु', nastaliq: 'سُہ' }
                  ]
                }
              ]
            },
            {
              id: 'u1_l2',
              title: 'Daily Well-Being',
              xp: 15,
              items: [
                {
                  type: 'scramble',
                  instruction: 'Translate: "I am fine"',
                  targetEn: 'I am fine',
                  targetRoman: 'Bi chhus varāi',
                  targetDev: 'बॖ छुस वराई',
                  targetNastaliq: 'بِہ چھُس ورٲی',
                  tokensRoman: ['Bi', 'chhus', 'varāi', 'chhes', 'na'],
                  tokensDev: ['बॖ', 'छुस', 'वराई', 'छॆस', 'न'],
                  tokensNastaliq: ['بِہ', 'چھُس', 'ورٲی', 'چھؠس', 'نہٕ'],
                  correctOrder: [0, 1, 2]
                },
                {
                  type: 'choice',
                  promptEn: 'What does "Khosh amdeed" mean?',
                  options: [
                    { roman: 'Welcome', dev: 'स्वागत (वेलकम)', nastaliq: 'خوش آمدید', correct: true },
                    { roman: 'Goodbye', dev: 'अलविदा', nastaliq: 'خدا حافظ', correct: false },
                    { roman: 'Water', dev: 'पानी', nastaliq: 'آب', correct: false },
                    { roman: 'Good night', dev: 'शुभ रात्रि', nastaliq: 'شب بخیر', correct: false }
                  ]
                },
                {
                  type: 'match',
                  instruction: 'Match words with meanings',
                  pairs: [
                    { en: 'Welcome', roman: 'Khosh amdeed', dev: 'खॊश आमदीद', nastaliq: 'خوش آمدید' },
                    { en: 'I am fine', roman: 'Bi chhus varāi', dev: 'बॖ छुस वराई', nastaliq: 'بِہ چھُس ورٲی' },
                    { en: 'Please', roman: 'Meharbāni', dev: 'मॆहरबानी', nastaliq: 'مِہربٲنی' },
                    { en: 'See you', roman: 'Beyi melav', dev: 'बॆयि मेलव', nastaliq: 'بییہِ میلو' }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'u2',
          title: 'Unit 2: Family & The Home',
          nastaliq: 'خاندان تہٕ گَرٕ',
          dev: 'ख़ानदान तऺ घर',
          description: 'Learn terms for family relatives and essential parts of a home.',
          icon: '🏡',
          lessons: [
            {
              id: 'u2_l1',
              title: 'Immediate Family',
              xp: 15,
              items: [
                {
                  type: 'match',
                  instruction: 'Match family relations',
                  pairs: [
                    { en: 'Mother', roman: 'Māji', dev: 'माजि', nastaliq: 'مٲج' },
                    { en: 'Father', roman: 'Mōli', dev: 'मोलि', nastaliq: 'مول' },
                    { en: 'Brother', roman: 'Bōy', dev: 'बोय', nastaliq: 'بوی' },
                    { en: 'Sister', roman: 'Bēni', dev: 'बेनि', nastaliq: 'بینہِ' }
                  ]
                },
                {
                  type: 'choice',
                  promptEn: 'What is the Koshur word for "House / Home"?',
                  options: [
                    { roman: 'Ghar', dev: 'घर', nastaliq: 'گھر', correct: true },
                    { roman: 'Tsot', dev: 'च़ॊत', nastaliq: 'ژۄٹ', correct: false },
                    { roman: 'Dukan', dev: 'दुकान', nastaliq: 'دُکان', correct: false },
                    { roman: 'Gām', dev: 'गाम', nastaliq: 'گام', correct: false }
                  ]
                },
                {
                  type: 'scramble',
                  instruction: 'Assemble: "This is my brother"',
                  targetEn: 'This is my brother',
                  targetRoman: 'Yi chhu myon bōy',
                  targetDev: 'यि छु म्योन बोय',
                  targetNastaliq: 'یہِ چھُ مِون بوی',
                  tokensRoman: ['Yi', 'chhu', 'myon', 'bōy', 'bēni', 'son'],
                  tokensDev: ['यि', 'छु', 'म्योन', 'बोय', 'बेनि', 'सोन'],
                  tokensNastaliq: ['یہِ', 'چھُ', 'مِون', 'بوی', 'بینہِ', 'سون'],
                  correctOrder: [0, 1, 2, 3]
                }
              ]
            }
          ]
        },
        {
          id: 'u3',
          title: 'Unit 3: Kashmiri Flavors & Essentials',
          nastaliq: 'کٲشُر کھؠن تہٕ ضَروری چیٖز',
          dev: 'कॉशुर ख्यॆन तऺ ज़रूरी चीज़',
          description: 'Key words for food, tea (Kahwa), water, and traditional utensils.',
          icon: '☕',
          lessons: [
            {
              id: 'u3_l1',
              title: 'Cuisine & Daily Sustenance',
              xp: 20,
              items: [
                {
                  type: 'match',
                  instruction: 'Match food and drinks',
                  pairs: [
                    { en: 'Water', roman: 'Ãb', dev: 'आब', nastaliq: 'آب' },
                    { en: 'Bread (Traditional)', roman: 'Tsot', dev: 'च़ॊत', nastaliq: 'ژۄٹ' },
                    { en: 'Tea / Kahwa', roman: 'Chai / Kahwe', dev: 'चाय / कहवे', nastaliq: 'چائے / قَہوہ' },
                    { en: 'Cooked Rice', roman: 'Batta', dev: 'बत्त', nastaliq: 'بَتہٕ' }
                  ]
                },
                {
                  type: 'scramble',
                  instruction: 'Translate: "I want water"',
                  targetEn: 'I want water',
                  targetRoman: 'Me chhu ãb bãsãn',
                  targetDev: 'मे छु आब बासान',
                  targetNastaliq: 'مےٚ چھُ آب باسان',
                  tokensRoman: ['Me', 'chhu', 'ãb', 'bãsãn', 'chhes', 'batta'],
                  tokensDev: ['मे', 'छु', 'आब', 'बासान', 'छॆस', 'बत्त'],
                  tokensNastaliq: ['مےٚ', 'چھُ', 'آب', 'باسان', 'چھؠس', 'بَتہٕ'],
                  correctOrder: [0, 1, 2, 3]
                },
                {
                  type: 'choice',
                  promptEn: 'What is a "Samovar" used for in Kashmir?',
                  options: [
                    { roman: 'Brewing Kahwa & Noon Chai', dev: 'कहवा और चाय बनाने का पारंपरिक बर्तन', nastaliq: 'سماوار (چائے بنانا)', correct: true },
                    { roman: 'Rowing boats', dev: 'नाव चलाना', nastaliq: 'کشتی چلانا', correct: false },
                    { roman: 'Weaving carpets', dev: 'कालीन बुनना', nastaliq: 'قالین بافی', correct: false },
                    { roman: 'Measuring grain', dev: 'अनाज नापना', nastaliq: 'اناج ناپنا', correct: false }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'u4',
          title: 'Unit 4: Numbers (1-10) & Counting',
          nastaliq: 'ہِساب تہٕ گِنٛدُن (۱-۱۰)',
          dev: 'हिसाब तऺ गिन्दन (१-१०)',
          description: 'Master Kashmiri counting from 1 to 10 with audio and phonetic drills.',
          icon: '🔢',
          lessons: [
            {
              id: 'u4_l1',
              title: 'Numbers 1 to 5',
              xp: 20,
              items: [
                {
                  type: 'match',
                  instruction: 'Match numbers 1 to 5',
                  pairs: [
                    { en: '1 (One)', roman: 'Akh', dev: 'अख', nastaliq: 'اَکھ' },
                    { en: '2 (Two)', roman: 'Zə', dev: 'ज़ऺ', nastaliq: 'زٕ' },
                    { en: '3 (Three)', roman: 'Tre', dev: 'त्रे', nastaliq: 'ترےٚ' },
                    { en: '4 (Four)', roman: 'Tsor', dev: 'च़ोर', nastaliq: 'ژور' }
                  ]
                },
                {
                  type: 'choice',
                  promptEn: 'What is the Koshur number for 5 (Five)?',
                  options: [
                    { roman: 'Pãnts', dev: 'पांज़ (पांच)', nastaliq: 'پانژ', correct: true },
                    { roman: 'She', dev: 'शे', nastaliq: 'شےٚ', correct: false },
                    { roman: 'Sath', dev: 'सथ', nastaliq: 'سَتھ', correct: false },
                    { roman: 'Dah', dev: 'दह', nastaliq: 'دہ', correct: false }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    basic: {
      id: 'basic',
      title: 'Basic',
      subTitle: 'Foundational · Everyday Fluency',
      nastaliq: 'بَنیٲدی',
      dev: 'बुनियादी',
      description: 'Build complete sentences with Kashmiri V2 word order, question words, shopping at Lal Chowk, and present/past expressions.',
      color: '#EAA023',
      accent: '#F3C065',
      units: [
        {
          id: 'u5',
          title: 'Unit 5: Kashmiri Sentence Builder (V2 Word Order)',
          nastaliq: 'جُملہٕ بَناوُن',
          dev: 'जुमला बनावुन',
          description: 'Kashmiri puts the auxiliary verb in the second position (V2 rule). Practice sentence assembly.',
          icon: '🧩',
          lessons: [
            {
              id: 'u5_l1',
              title: 'Present Actions (Going & Coming)',
              xp: 25,
              items: [
                {
                  type: 'scramble',
                  instruction: 'Assemble: "I am going home" (Speaker: Male)',
                  targetEn: 'I am going home',
                  targetRoman: 'Bi chhus ghar gatsaan',
                  targetDev: 'बॖ छुस घर गछ़ान',
                  targetNastaliq: 'بِہ چھُس گھر گژھان',
                  tokensRoman: ['Bi', 'chhus', 'ghar', 'gatsaan', 'chhes', 'yivaan'],
                  tokensDev: ['बॖ', 'छुस', 'घर', 'गछ़ान', 'छॆस', 'यिवान'],
                  tokensNastaliq: ['بِہ', 'چھُس', 'گھر', 'گژھان', 'چھؠس', 'یِوان'],
                  correctOrder: [0, 1, 2, 3]
                },
                {
                  type: 'choice',
                  promptEn: 'Which sentence is feminine for "I am going"?',
                  options: [
                    { roman: 'Bi chhes gatsaan', dev: 'बॖ छॆस गछ़ान', nastaliq: 'بِہ چھؠس گژھان', correct: true },
                    { roman: 'Bi chhus gatsaan', dev: 'बॖ छुस गछ़ान', nastaliq: 'بِہ چھُس گژھان', correct: false },
                    { roman: 'Su chhu gatsaan', dev: 'सु छु गछ़ान', nastaliq: 'سُہ چھُ گژھان', correct: false },
                    { roman: 'Asi chhi gatsaan', dev: 'असि छि गछ़ान', nastaliq: 'اَسہِ چھِ گژھان', correct: false }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'u6',
          title: 'Unit 6: Inquiries & Questions (Kyah, Kati, Kar)',
          nastaliq: 'سَوال پُرژھُن',
          dev: 'सवाल प्रुछुन',
          description: 'Ask where places are, what things cost, and when events happen.',
          icon: '❓',
          lessons: [
            {
              id: 'u6_l1',
              title: 'Question Words',
              xp: 25,
              items: [
                {
                  type: 'match',
                  instruction: 'Match question words',
                  pairs: [
                    { en: 'What?', roman: 'Kyah?', dev: 'क्याह?', nastaliq: 'کیاہ؟' },
                    { en: 'Where?', roman: 'Kati?', dev: 'कति?', nastaliq: 'کَتہِ؟' },
                    { en: 'When?', roman: 'Kar?', dev: 'कर?', nastaliq: 'کَر؟' },
                    { en: 'Who?', roman: 'Kus?', dev: 'कुस?', nastaliq: 'کُس؟' }
                  ]
                },
                {
                  type: 'scramble',
                  instruction: 'Assemble: "What is your name?"',
                  targetEn: 'What is your name?',
                  targetRoman: 'Che kyah chhuy nav?',
                  targetDev: 'चे क्याह छुय नाव?',
                  targetNastaliq: 'ژےٚ کیاہ چھُی ناو؟',
                  tokensRoman: ['Che', 'kyah', 'chhuy', 'nav?', 'myon', 'kati'],
                  tokensDev: ['चे', 'क्याह', 'छुय', 'नाव?', 'म्योन', 'कति'],
                  tokensNastaliq: ['ژےٚ', 'کیاہ', 'چھُی', 'ناو؟', 'مِون', 'کَتہِ'],
                  correctOrder: [0, 1, 2, 3]
                },
                {
                  type: 'scramble',
                  instruction: 'Assemble: "Where does this road go?"',
                  targetEn: 'Where does this road go?',
                  targetRoman: 'Yi wath kot chhi gatsaan?',
                  targetDev: 'यिह वथ कोत छि गछ़ान?',
                  targetNastaliq: 'یِہ وَتھ کوت چھِ گَژھان؟',
                  tokensRoman: ['Yi', 'wath', 'kot', 'chhi', 'gatsaan?', 'ghar'],
                  tokensDev: ['यिह', 'वथ', 'कोत', 'छि', 'गछ़ान?', 'घर'],
                  tokensNastaliq: ['یِہ', 'وَتھ', 'کوت', 'چھِ', 'گَژھان؟', 'گَر'],
                  correctOrder: [0, 1, 2, 3, 4]
                },
                {
                  type: 'choice',
                  promptEn: 'How do you ask "Whose shop is this?" in Kashmiri?',
                  options: [
                    { roman: 'Yi dukaan kəmsund chhu?', dev: 'यिह दुकान कऺमिसुंद छु?', nastaliq: 'یِہ دُکان کٔمؠ سُنٛد چھُ؟', correct: true },
                    { roman: 'Yi dukaan katis chhu?', dev: 'यिह दुकान कतिस छु?', nastaliq: 'یِہ دُکان کَتِس چھُ؟', correct: false },
                    { roman: 'Yi gaadi kyah chhi?', dev: 'यिह गाड़ी क्याह छि?', nastaliq: 'یِہ گاڑی کیاہ چھِ؟', correct: false },
                    { roman: 'Dukaan kar kholiyiv?', dev: 'दुकान कर खोलियिव?', nastaliq: 'دُکان کَر کھولِیو؟', correct: false }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'u7',
          title: 'Unit 7: Shopping in Lal Chowk Bazaar',
          nastaliq: 'لال چوکَس مَنٛز سودا',
          dev: 'लाल चोकस मंज़ सौदा',
          description: 'Bargaining, asking prices, and buying fruits (Tsoonth) and crafts.',
          icon: '🛍️',
          lessons: [
            {
              id: 'u7_l1',
              title: 'At the Fruit Stall',
              xp: 25,
              items: [
                {
                  type: 'scramble',
                  instruction: 'Assemble: "What is the price of this apple?"',
                  targetEn: 'What is the price of this apple?',
                  targetRoman: 'Yath tsoonthas kyah mol chhu?',
                  targetDev: 'यथ च़ूंटस क्याह मोल छु?',
                  targetNastaliq: 'یَتھ ژوٗنٛٹھَس کیاہ مول چھُ؟',
                  tokensRoman: ['Yath', 'tsoonthas', 'kyah', 'mol', 'chhu?', 'ãb'],
                  tokensDev: ['यथ', 'च़ूंटस', 'क्याह', 'मोल', 'छु?', 'आब'],
                  tokensNastaliq: ['یَتھ', 'ژوٗنٛٹھَس', 'کیاہ', 'مول', 'چھُ؟', 'آب'],
                  correctOrder: [0, 1, 2, 3, 4]
                },
                {
                  type: 'story',
                  storyTitle: 'Bargaining for Kangri',
                  storyNastaliq: 'کانٛگٕرِ ہُنٛد سودا',
                  storyDev: 'कांग्रि हुंद सौदा',
                  dialogues: [
                    { speaker: 'Learner', textRoman: 'Salam! Yi Kangir katis chha?', textDev: 'सलाम! यि कांगिर कतिस छा?', textNastaliq: 'سَلام! یہِ کانٛگٕر کَتِس چھا؟', translation: 'Hello! How much is this Kangri?' },
                    { speaker: 'Shopkeeper', textRoman: 'Yi chha pants hath rupiye.', textDev: 'यि छा पांज़ हथ रुपिये।', textNastaliq: 'یہِ چھا پانژ ہَتھ رۄپیہِ۔', translation: 'This is 500 rupees.' },
                    { speaker: 'Learner', textRoman: 'Krahin kyah kam lagya?', textDev: 'क्याह कम लाग्या?', textNastaliq: 'کیاہ کَم لاگیا؟', translation: 'Can you lower the price a little?' }
                  ],
                  question: {
                    promptEn: 'What was the shopkeeper selling?',
                    options: [
                      { roman: 'Kangri (Traditional Firepot)', dev: 'कांगड़ी', nastaliq: 'کانٛگٕر', correct: true },
                      { roman: 'Apples', dev: 'सेब', nastaliq: 'ژوٗنٛٹھ', correct: false },
                      { roman: 'Tea leaves', dev: 'चायपत्ती', nastaliq: 'چائے', correct: false }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    },
    intense: {
      id: 'intense',
      title: 'Intense',
      subTitle: 'Advanced · Immersion & Cultural Mastery',
      nastaliq: 'ماہیٖر',
      dev: 'माहिर / तीव्र',
      description: 'Master Kashmiri ergativity, complex verb inflections, classic Kashmiri proverbs from Omkar N. Koul, and rapid real-world dialogues.',
      color: '#D14937',
      accent: '#F27A6C',
      units: [
        {
          id: 'u8',
          title: 'Unit 8: Kashmiri Proverbs & Ancient Wisdom',
          nastaliq: 'کٲشِرؠ کَہاوَت تہٕ عِلم',
          dev: 'कॉशिरि कहावत तऺ इल्म',
          description: 'Study profound Kashmiri proverbs with philosophical contexts.',
          icon: '📜',
          lessons: [
            {
              id: 'u8_l1',
              title: 'Proverbs of Nature & Effort',
              xp: 30,
              items: [
                {
                  type: 'choice',
                  promptEn: 'What is the meaning of the proverb: "Ãb chhu zindagāni"?',
                  options: [
                    { roman: 'Water is life', dev: 'पानी ही जीवन है', nastaliq: 'آب چھُ زِندَگانی', correct: true },
                    { roman: 'Fire burns cold', dev: 'आग ठंडी है', nastaliq: 'نار چھُ یخ', correct: false },
                    { roman: 'Time waits for none', dev: 'वक्त किसी का इंतज़ार नहीं करता', nastaliq: 'وقت نَہ چھُ تَھمَن', correct: false },
                    { roman: 'Words speak louder', dev: 'बातें भारी हैं', nastaliq: 'کَتھ چھِ بَڑی', correct: false }
                  ]
                },
                {
                  type: 'scramble',
                  instruction: 'Assemble the proverb: "A good friend is like sweet water"',
                  targetEn: 'A good friend is like sweet water',
                  targetRoman: 'Asul dost chhu modur ãb',
                  targetDev: 'असल दोस्त छु मोदुर आब',
                  targetNastaliq: 'اَصٕل دوست چھُ مودُر آب',
                  tokensRoman: ['Asul', 'dost', 'chhu', 'modur', 'ãb', 'kharab', 'tot'],
                  tokensDev: ['असल', 'दोस्त', 'छु', 'मोदुर', 'आब', 'ख़राब', 'तॊत'],
                  tokensNastaliq: ['اَصٕل', 'دوست', 'چھُ', 'مودُر', 'آب', 'خراب', 'تَتہٕ'],
                  correctOrder: [0, 1, 2, 3, 4]
                }
              ]
            }
          ]
        },
        {
          id: 'u9',
          title: 'Unit 9: Complex Verb Ergativity & Past Tense',
          nastaliq: 'ماضی تہٕ فِعِل ہُنٛد نِظام',
          dev: 'माज़ी तऺ फेल हुंद निज़ाम',
          description: 'Deep dive into transitive verbs in past tense requiring ergative markers on subjects.',
          icon: '⚡',
          lessons: [
            {
              id: 'u9_l1',
              title: 'Transitive Past Verbs',
              xp: 30,
              items: [
                {
                  type: 'cloze',
                  sentenceEn: 'I ate an apple (Transitive past requires "Me" instead of "Bi")',
                  sentenceTemplate: '{blank} kheyi tsoonth.',
                  sentenceTemplateDev: '{blank} खॆयि च़ूंट।',
                  sentenceTemplateNastaliq: '{blank} کھؠیہِ ژوٗنٛٹھ۔',
                  correctOption: { roman: 'Me', dev: 'मे', nastaliq: 'مےٚ' },
                  distractors: [
                    { roman: 'Bi', dev: 'बॖ', nastaliq: 'بِہ' },
                    { roman: 'Su', dev: 'सु', nastaliq: 'سُہ' }
                  ]
                }
              ]
            }
          ]
        },
        {
          id: 'u10',
          title: 'Unit 10: Master Story Immersion — Dal Lake Journey',
          nastaliq: 'ڈَل جھیل ہُنٛد سَفَر',
          dev: 'डल झील हुंद सफ़र',
          description: 'Long-form narrative dialogue test with native cultural references.',
          icon: '⛵',
          lessons: [
            {
              id: 'u10_l1',
              title: 'Evening on a Shikara',
              xp: 35,
              items: [
                {
                  type: 'story',
                  storyTitle: 'A Shikara Ride on Dal Lake',
                  storyNastaliq: 'ڈَل سَرَس مَنٛز شِکارِ ہُنٛد سَفَر',
                  storyDev: 'डल सरस मंज़ शिकारि हुंद सफ़र',
                  dialogues: [
                    { speaker: 'Boatman', textRoman: 'Salam janab! Dal pyath lagya phiraavun?', textDev: 'सलाम जनाब! डल प्यथ लाग्या फिरावुन?', textNastaliq: 'سَلام جَناب! ڈَل پؠٹھ لاگیا پھِراوُن؟', translation: 'Greetings sir! Shall I take you on a tour across Dal Lake?' },
                    { speaker: 'Traveler', textRoman: 'Aahan, Char Chinar kun pakan.', textDev: 'आहन, चार चिनार कुन पकन।', textNastaliq: 'آہن، چار چِنار کُن پَکَن۔', translation: 'Yes, let us head toward Char Chinar island.' },
                    { speaker: 'Boatman', textRoman: 'Dal chhu aaz setha khubsurat bãsãn.', textDev: 'डल छु आज़ सॆठा खूबसूरत बासान।', textNastaliq: 'ڈَل چھُ آز سؠٹھاہ خوٗبصوٗرَت باسان۔', translation: 'The Dal looks extraordinarily beautiful today.' }
                  ],
                  question: {
                    promptEn: 'Where did the traveler ask to go?',
                    options: [
                      { roman: 'Char Chinar Island', dev: 'चार चिनार', nastaliq: 'چار چِنار', correct: true },
                      { roman: 'Gulmarg', dev: 'गुलमर्ग', nastaliq: 'گُلمَرگ', correct: false },
                      { roman: 'Pahalgam', dev: 'पहलगाम', nastaliq: 'پَہَلگام', correct: false }
                    ]
                  }
                }
              ]
            }
          ]
        }
      ]
    }
  },

  paces: {
    easy: {
      id: 'easy',
      name: 'Easy / Relaxed',
      dailyGoalXP: 10,
      estimatedMinutes: 3,
      tagline: '1 lesson per day · Build a stress-free daily habit'
    },
    go: {
      id: 'go',
      name: 'Go / Regular (Recommended)',
      dailyGoalXP: 30,
      estimatedMinutes: 8,
      tagline: '2–3 lessons per day · Optimal language retention'
    },
    intense: {
      id: 'intense',
      name: 'Intense / Hardcore',
      dailyGoalXP: 60,
      estimatedMinutes: 18,
      tagline: '5+ lessons per day + Speed challenge mode'
    }
  }
};

window.KOSHUR_CURRICULUM = KOSHUR_CURRICULUM;
