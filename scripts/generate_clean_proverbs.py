"""
Clean Kashmiri Proverbs Generator
Creates human-readable, easily pronounceable proverbs in:
- Roman (natural phonetic spelling, matching vocabulary & dialogues)
- Devanagari (standard readable script)
- Nastaliq (Kashmiri Arabic script)
- Hindi (natural Hindi meaning / equivalent kahawat)
- English (wisdom & translation)
"""

import json
import os

PROVERBS = [
    {
        "id": 1,
        "roman": "Dohas gare doh, raathas gare raath",
        "dev": "दॊहस गरे दॊह, रातस गरे रात",
        "nastaliq": "دۄہس گرٕ دۄہ، راتھس گرٕ راتھ",
        "hindi": "दिन का काम दिन में, रात का काम रात में (हर काम का अपना एक निश्चित समय होता है)।",
        "english": "Day has its time, and night has its time — everything in its own season.",
        "category": "Wisdom",
        "pronunciation": "Doh-has ga-ray doh, raa-thas ga-ray raath"
    },
    {
        "id": 2,
        "roman": "Panun chhu panun, beyi sund chhu beyi sund",
        "dev": "पनुन छु पनुन, बेयिसुंद छु बेयिसुंद",
        "nastaliq": "پَنُن چھُ پَنُن، بیٚیِسُنٛد چھُ بیٚیِسُنٛد",
        "hindi": "अपना तो अपना होता है, पराया पराया ही रहता है (खून का रिश्ता हमेशा गहरा होता है)।",
        "english": "One's own is one's own, a stranger is a stranger (Blood is thicker than water).",
        "category": "Family",
        "pronunciation": "Pa-nun chhu pa-nun, bay-yi sund chhu bay-yi sund"
    },
    {
        "id": 3,
        "roman": "Gharas manz chhu aab, te nallan chhu tshondaan",
        "dev": "घरस मंज़ छु आब, तॖ नलन छु छ़ॊन्दान",
        "nastaliq": "گَھرَس مَنٛز چھُ آب، تہٕ نَلَن چھُ ژھونٛڈان",
        "hindi": "घर में पानी मौजूद है और बाहर नालों में तलाश कर रहे हैं (बगल में छोरा, नगर में ढिंढोरा)।",
        "english": "Water is right at home, yet one searches the mountain streams for it.",
        "category": "Humor",
        "pronunciation": "Gha-ras manz chhu aab, tay nal-lan chhu tshoan-daan"
    },
    {
        "id": 4,
        "roman": "Haakh ti gadh chhu shahi khorak",
        "dev": "हाख तॖ गद छु शाही ख़ॊराक़",
        "nastaliq": "ہاخ تہٕ گَد چھُ شاہی خوراک",
        "hindi": "साग और मछली कश्मीरी के लिए शाही दावत के समान है (सादगी में ही सच्चा सुख है)।",
        "english": "Collard greens and fish is a feast fit for a king.",
        "category": "Food",
        "pronunciation": "Haakh ti gadh chhu shaa-hee kho-raak"
    },
    {
        "id": 5,
        "roman": "Gharas manz bati, ti lukan manz daawat",
        "dev": "घरस मंज़ बतॖ, तॖ लुकन मंज़ दावत",
        "nastaliq": "گَھرَس مَنٛز بَتہٕ، تہٕ لۄکَن مَنٛز دَعوَت",
        "hindi": "घर में भले ही सादा चावल हो, लेकिन मेहमानों की शान से दावत करना (कश्मीरी मेहमाननवाज़ी)।",
        "english": "Modest rice at home, yet a lavish feast for guests.",
        "category": "Society",
        "pronunciation": "Gha-ras manz ba-tay, ti loo-kan manz daa-wat"
    },
    {
        "id": 6,
        "roman": "Zabān chhi shirin, te duniya chhu panun",
        "dev": "ज़बान छि शीरीं, तॖ दुनिया छु पनुन",
        "nastaliq": "زَبان چھِ شیٖریٖن، تہٕ دُنِیا چھُ پَنُن",
        "hindi": "मीठी बोली से सारी दुनिया अपनी बन जाती है (मधुर वाणी सबसे बड़ा धन है)।",
        "english": "With a sweet tongue, the whole world becomes your friend.",
        "category": "Wisdom",
        "pronunciation": "Za-baan chhi shee-reen, tay doo-nee-yaa chhu pa-nun"
    },
    {
        "id": 7,
        "roman": "Panun gar chhu hekmat-i daulat",
        "dev": "पनुन गर छु हिकमत-इ दौलत",
        "nastaliq": "پَنُن گَر چھُ حِکمَتِ دَولَت",
        "hindi": "अपना घर ही सबसे बड़ा सुकून और असली दौलत है (अपने घर जैसा कोई सुख नहीं)।",
        "english": "One's own home is the greatest wealth and sanctuary.",
        "category": "Wisdom",
        "pronunciation": "Pa-nun gar chhu hik-mat-ay dow-lat"
    },
    {
        "id": 8,
        "roman": "Lal ti gohar chhi rəchhi tal aasaan",
        "dev": "लाल तॖ गोहर छि रछ़ि तल आसान",
        "nastaliq": "لال تہٕ گوہَر چھِ رَچھِ تَل آسان",
        "hindi": "हीरे-मोती मिट्टी और पत्थरों के नीचे ही छुपे होते हैं (सच्ची प्रतिभा सादगी में छिपी होती है)।",
        "english": "Rubies and gems are concealed beneath the dust.",
        "category": "Wisdom",
        "pronunciation": "Laal tay go-har chhi rachh-ay tal aa-saan"
    },
    {
        "id": 9,
        "roman": "Votsh chhi laaran, ti goor chhu pakaan",
        "dev": "वॊछ़ छि लारान, तॖ गूर छु पकान",
        "nastaliq": "وۆژھ چھِ لارَن، تہٕ گوٗر چھُ پَکان",
        "hindi": "बछड़ा भागता-दौड़ता रहता है, मगर चरवाहा स्थिर चाल से चलता है (जल्दबाज़ी से नहीं, धैर्य से मंज़िल मिलती है)।",
        "english": "The calf runs wildly, but the cowherd walks steadily (Slow and steady wins the race).",
        "category": "Wisdom",
        "pronunciation": "Voatchh chhi laa-raan, tay goor chhu pa-kaan"
    },
    {
        "id": 10,
        "roman": "Batas peth chhu zun rozun",
        "dev": "बतस पॆठ छु ज़ून रोज़ुन",
        "nastaliq": "بَتَس پیٚٹھ چھُ زوٗن روزُن",
        "hindi": "चावल की थाली पर चंद्रमा की चमक होना (अत्यंत भाग्यशाली और शुभ होना)।",
        "english": "Moonlight shining upon a plate of rice (A state of supreme blessing and prosperity).",
        "category": "Food",
        "pronunciation": "Ba-tas pyeth chhu zoon ro-zun"
    },
    {
        "id": 11,
        "roman": "Kaal chhu pakaan, ti zindagani chhi gatsaan",
        "dev": "काल छु पकान, तॖ ज़िंदगानी छि गछ़ान",
        "nastaliq": "کال چھُ پَکان، تہٕ زِندَگانی چھِ گَژھان",
        "hindi": "वक्त बीतता जाता है और ज़िंदगी गुज़रती जाती है (समय किसी का इंतज़ार नहीं करता)।",
        "english": "Time marches on, and life passes by (Time and tide wait for no one).",
        "category": "Life",
        "pronunciation": "Kaal chhu pa-kaan, tay zin-da-gaa-nee chhi ga-tsaan"
    },
    {
        "id": 12,
        "roman": "Sabras chhu mive meeth",
        "dev": "सबरस छु मिवे मीठ",
        "nastaliq": "صَبرَس چھُ میٖوٕ میٖٹھ",
        "hindi": "सब्र का फल हमेशा मीठा होता है।",
        "english": "The fruit of patience is sweet.",
        "category": "Wisdom",
        "pronunciation": "Sab-ras chhu mee-vay meeth"
    },
    {
        "id": 13,
        "roman": "Nov gav naav, pooran gav zaav",
        "dev": "नॊव गव नाव, पूरन गव ज़ाव",
        "nastaliq": "نۆو گَو ناو، پوٗرَن گَو زاو",
        "hindi": "नया नौ दिन, पुराना सौ दिन (पुराने रिश्ते और पुरानी चीज़ें ही अंत में काम आती हैं)।",
        "english": "The new is a novelty, but the old is tried and true.",
        "category": "Life",
        "pronunciation": "Nov gav naav, poo-ran gav zaav"
    },
    {
        "id": 14,
        "roman": "Kukur chhu panun gura baasaan baadhshah",
        "dev": "कुकुर छु पनुन गुर बासान बादशाह",
        "nastaliq": "کُکُر چھُ پَنُن گُر باسان بادشاہ",
        "hindi": "मुर्गा अपने दड़बे में खुद को बादशाह समझता है (अपनी गली में कुत्ता भी शेर होता है)।",
        "english": "The rooster considers himself king in his own coop.",
        "category": "Humor",
        "pronunciation": "Koo-koor chhu pa-nun goor baa-saan baad-shah"
    },
    {
        "id": 15,
        "roman": "Aab chhu travun, ti aab chhu pethun",
        "dev": "आब छु त्रावुन, तॖ आब छु पेथुन",
        "nastaliq": "آب چھُ تراوُن، تہٕ آب چھُ پؠتھُن",
        "hindi": "पानी को जितना भी काटो, पानी कभी अलग नहीं होता (अपनों में लड़ाई हो भी जाए तो रिश्ते नहीं टूटते)।",
        "english": "Pour water on water, it still unites (Family ties cannot be severed).",
        "category": "Family",
        "pronunciation": "Aab chhu traa-vun, tay aab chhu pyay-thun"
    },
    {
        "id": 16,
        "roman": "Dand chhi aasan ti maaz chhu neyvan",
        "dev": "दंद छि आसान तॖ माज़ छु नेवान",
        "nastaliq": "دَند چھِ آسان تہٕ ماز چھُ نیٖوان",
        "hindi": "जब दांत होते हैं तब मांस नहीं मिलता, जब मांस मिलता है तब दांत नहीं रहते (समय और अवसर का मेल न होना)।",
        "english": "When there are teeth there is no meat; when meat arrives, teeth are gone.",
        "category": "Life",
        "pronunciation": "Dand chhi aa-saan tay maaz chhu nay-vaan"
    },
    {
        "id": 17,
        "roman": "Sadras manz chhu chashma rozaan",
        "dev": "सदरस मंज़ छु चश्मा रोज़ान",
        "nastaliq": "سَدرَس مَنٛز چھُ چَشمَہ روزان",
        "hindi": "खारे समंदर के बीच भी मीठे पानी का सोता फूट सकता है (कठिन माहौल में भी अच्छाई कायम रहती है)।",
        "english": "Even within the salty ocean, a fresh spring can flow.",
        "category": "Nature",
        "pronunciation": "Sad-ras manz chhu chash-ma ro-zaan"
    },
    {
        "id": 18,
        "roman": "Naad kariv ta aalav booziv",
        "dev": "नाद करिव तॖ आलव बूज़िव",
        "nastaliq": "ناد کَرِیو تہٕ آلَو بوٗزِیو",
        "hindi": "पुकारोगे तभी तो आवाज़ सुनाई देगी (बिना मांगे या बिना कोशिश किए कुछ नहीं मिलता)।",
        "english": "Call out, and only then will your echo return (Effort brings response).",
        "category": "Wisdom",
        "pronunciation": "Naad ka-riv tay aa-lav boo-ziv"
    },
    {
        "id": 19,
        "roman": "Wath chhi vuchhaan ti kadam chhu thavaan",
        "dev": "वथ छि वुछ़ान तॖ क़दम छु थवान",
        "nastaliq": "وَتھ چھِ وُچھان تہٕ قَدَم چھُ تھاوان",
        "hindi": "रास्ता देखकर ही कदम आगे बढ़ाना चाहिए (सोच-समझकर कदम उठाना)।",
        "english": "Observe the path before taking a step (Look before you leap).",
        "category": "Wisdom",
        "pronunciation": "Wath chhi voochh-aan tay qa-dam chhu tha-vaan"
    },
    {
        "id": 20,
        "roman": "Sheen chhu galan, te aab chhu banan",
        "dev": "शीन छु गलन, तॖ आब छु बनन",
        "nastaliq": "شیٖن چھُ گَلَن، تہٕ آب چھُ بَنَن",
        "hindi": "बर्फ पिघलती है और वही जीवनदायी पानी बनती है (कठिनाइयां ही अंततः खुशहाली लाती हैं)।",
        "english": "The snow melts and turns into life-giving water (Every hardship gives way to ease).",
        "category": "Nature",
        "pronunciation": "Sheen chhu ga-lan, tay aab chhu ba-nan"
    },
    {
        "id": 21,
        "roman": "Dushmanas ti kariyiv meherbani",
        "dev": "दुश्मनस ति करियिव मेहरबानी",
        "nastaliq": "دُشمَنَس تِ کَرِیو مِہربانی",
        "hindi": "दुश्मन के साथ भी भलाई का बर्ताव करो (नेकी से शत्रुता भी मिट जाती है)।",
        "english": "Show kindness even to your adversary.",
        "category": "Wisdom",
        "pronunciation": "Doosh-ma-nas tee ka-ri-yiv may-har-baa-nee"
    },
    {
        "id": 22,
        "roman": "Mehanath chhi barkath",
        "dev": "मेहनत छि बरकत",
        "nastaliq": "مِحنَت چھِ بَرکَت",
        "hindi": "मेहनत में ही बरकत और कामयाबी छिपी है।",
        "english": "In honest hard work lies divine blessing.",
        "category": "Life",
        "pronunciation": "May-ha-nath chhi bar-kath"
    },
    {
        "id": 23,
        "roman": "Aql chhu saaf moti",
        "dev": "अक़्ल छु साफ़ मोती",
        "nastaliq": "عَقل چھُ صاف موتی",
        "hindi": "अक्ल एक बेदाग और अनमोल मोती है (बुद्धि ही सबसे बड़ा आभूषण है)।",
        "english": "Wisdom is a pure, unblemished pearl.",
        "category": "Wisdom",
        "pronunciation": "Aq-la chhu saaf mo-tee"
    },
    {
        "id": 24,
        "roman": "Dost chhu aasan museebatas manz",
        "dev": "दोस्त छु आसान मुसीबतस मंज़",
        "nastaliq": "دوست چھُ آسان مُصیٖبَتَس مَنٛز",
        "hindi": "सच्चा दोस्त वही होता है जो मुसीबत के समय साथ खड़ा रहे।",
        "english": "A true friend is known in times of distress.",
        "category": "Society",
        "pronunciation": "Dost chhu aa-saan moo-see-ba-tas manz"
    },
    {
        "id": 25,
        "roman": "Khuda chhu saarneyi hund madatgaar",
        "dev": "ख़ुदा छु सारनेयी हुंद मददगार",
        "nastaliq": "خُدا چھُ سارنَے ہُند مَدَدگار",
        "hindi": "ईश्वर सबका सच्चा मददगार और रखवाला है।",
        "english": "God is the helper and refuge of all.",
        "category": "Wisdom",
        "pronunciation": "Khoo-daa chhu saar-nay-yee hoond ma-dat-gaar"
    },
    {
        "id": 26,
        "roman": "Panun gām chhu paristan",
        "dev": "पनुन गाम छु परिस्तान",
        "nastaliq": "پَنُن گام چھُ پَرِستان",
        "hindi": "अपना गाँव परियों के देश जैसा खूबसूरत लगता है (मातृभूमि सबको प्यारी होती है)।",
        "english": "One's own village is paradise on earth.",
        "category": "Nature",
        "pronunciation": "Pa-nun gaam chhu pa-rees-taan"
    },
    {
        "id": 27,
        "roman": "Bati chhu aasan taem-as peth",
        "dev": "बतॖ छु आसान तऻमस पॆठ",
        "nastaliq": "بَتہٕ چھُ آسان تامَس پیٚٹھ",
        "hindi": "खाना तभी स्वादिष्ट लगता है जब सचमुच भूख लगी हो।",
        "english": "Food tastes sweetest to those who are truly hungry.",
        "category": "Food",
        "pronunciation": "Ba-tay chhu aa-saan tay-mas pyeth"
    },
    {
        "id": 28,
        "roman": "Koshur chhu meeth zabaan",
        "dev": "कॉशुर छु मीठ ज़बान",
        "nastaliq": "کٲشُر چھُ میٖٹھ زَبان",
        "hindi": "कश्मीरी बोली शहद जैसी मीठी और सुरीली भाषा है।",
        "english": "Kashmiri is a tongue as sweet as nectar.",
        "category": "Society",
        "pronunciation": "Koa-shoor chhu meeth za-baan"
    },
    {
        "id": 29,
        "roman": "Rozmarrah koshish chhi manzil vath",
        "dev": "रोज़मर्रा कोशिश छि मंज़िल वथ",
        "nastaliq": "روزمَرّہ کوشِش چھِ مَنزِل وَتھ",
        "hindi": "रोज़ाना का निरंतर प्रयास ही मंज़िल तक पहुंचाता है।",
        "english": "Daily perseverance is the highway to success.",
        "category": "Life",
        "pronunciation": "Roz-mar-rah ko-shish chhi man-zil vath"
    },
    {
        "id": 30,
        "roman": "Asun chhu sehat-as fayidemand",
        "dev": "असुन छु सेहतस फ़ायदेमंद",
        "nastaliq": "اَسُن چھُ صِحَتَس فایدہٕ مَند",
        "hindi": "हंसना सेहत के लिए सबसे अच्छी दवा है।",
        "english": "Laughter is the best medicine for the body and soul.",
        "category": "Life",
        "pronunciation": "A-sun chhu say-ha-tas faa-yee-day-mand"
    },
    {
        "id": 31,
        "roman": "Kul chhu phal dyith neveth gatsaan",
        "dev": "कुल छु फल द्यित्थ नेवेथ गछ़ान",
        "nastaliq": "کُل چھُ پَھل دِتھ نِوؠتھ گَژھان",
        "hindi": "पेड़ जब फल देता है तो झुक जाता है (ज्ञानी व्यक्ति हमेशा विनम्र होता है)।",
        "english": "The tree bows low when laden with fruit (Wisdom brings humility).",
        "category": "Nature",
        "pronunciation": "Kool chhu phal dyith nay-veth ga-tsaan"
    },
    {
        "id": 32,
        "roman": "Treysh lagech tas, yus rood vuchhith khosh gov",
        "dev": "त्रेश लगेच तस, युस रूद वुछ़ित्थ ख़ॊश गव",
        "nastaliq": "تریٚش لَگیٚچ تَس، یُس روٗد وُچھِتھ خوش گَو",
        "hindi": "प्यासा वही खुश होता है जिसे बारिश की पहली बूंदें दिखाई देती हैं।",
        "english": "He who is truly thirsty rejoices most at the sight of rain.",
        "category": "Nature",
        "pronunciation": "Tray-sh la-gech tas, yus rood voochh-ith khosh gav"
    },
    {
        "id": 33,
        "roman": "Saanis gām-as manz chhu aman ti shanti",
        "dev": "सानिस गामस मंज़ छु अमन तॖ शांति",
        "nastaliq": "سانِس گامَس مَنٛز چھُ اَمَن تہٕ شانتی",
        "hindi": "हमारे गाँव में अमन और सुकून का बसेरा है।",
        "english": "In our village dwells peace and tranquility.",
        "category": "Society",
        "pronunciation": "Saa-nis gaa-mas manz chhu a-man tay shaan-tee"
    },
    {
        "id": 34,
        "roman": "Badi chhi bad tareen wath",
        "dev": "बदी छि बद तरीन वथ",
        "nastaliq": "بَدی چھِ بَد تَرین وَتھ",
        "hindi": "बुराई का रास्ता हमेशा बर्बादी की तरफ ले जाता है।",
        "english": "The path of wrongdoing leads only to ruin.",
        "category": "Wisdom",
        "pronunciation": "Ba-dee chhi bad ta-reen vath"
    },
    {
        "id": 35,
        "roman": "Məəl ti məəj chhi zameen peth khudaa-yik noor",
        "dev": "मऻल तॖ मऻज छि ज़मीन पॆठ ख़ुदा-इक नूर",
        "nastaliq": "مٲل تہٕ مٲج چھِ زٔمیٖن پیٚٹھ خُدا اِک نوٗر",
        "hindi": "माता-पिता धरती पर ईश्वर का साक्षात रूप और आशीर्वाद हैं।",
        "english": "Father and mother are God's luminous blessing upon earth.",
        "category": "Family",
        "pronunciation": "Mael tay maej chhi za-meen pyeth khoo-daa-yik noor"
    },
    {
        "id": 36,
        "roman": "Posh ti meve chhi chinar-as nish shobhaan",
        "dev": "पोश तॖ मेवे छि चिनारस निश शोभान",
        "nastaliq": "پوش تہٕ میٖوٕ چھِ چِنارَس نِش شوبھان",
        "hindi": "फूल और फल चिनार के साए में और भी सुंदर लगते हैं।",
        "english": "Flowers and fruits look most glorious under the shade of the Chinar.",
        "category": "Nature",
        "pronunciation": "Posh tay may-vay chhi chi-naa-ras nish sho-bhaan"
    },
    {
        "id": 37,
        "roman": "Kitaab chhi akli-hond chashma",
        "dev": "किताब छि अक्लि-हुंद चश्मा",
        "nastaliq": "کِتاب چھِ عَقلی ہُند چَشمَہ",
        "hindi": "किताब ज्ञान और समझ का कभी न सूखने वाला चश्मा है।",
        "english": "A book is an inexhaustible fountain of wisdom.",
        "category": "Wisdom",
        "pronunciation": "Ki-taab chhi aq-lee hoond chash-ma"
    },
    {
        "id": 38,
        "roman": "Wandas chhu shīn, bahaaras chhi posh",
        "dev": "वंदस छु शीन, बहारस छि पोश",
        "nastaliq": "وَندَس چھُ شیٖن، بَہارَس چھِ پوش",
        "hindi": "सर्दियों में बर्फ और वसंत में खिले हुए फूल (हर मौसम की अपनी खूबी है)।",
        "english": "Winter brings snow, and spring brings blooming blossoms.",
        "category": "Nature",
        "pronunciation": "Wan-das chhu sheen, ba-haa-ras chhi posh"
    },
    {
        "id": 39,
        "roman": "Neki kariyiv ti aabas manz traviv",
        "dev": "नेकी करियिव तॖ आबस मंज़ त्राविव",
        "nastaliq": "نیکی کَرِیو تہٕ آبَس مَنٛز تراوِیو",
        "hindi": "नेकी कर और दरिया में डाल (भलाई करके अहसान मत जताओ)।",
        "english": "Do good and cast it into the flowing waters (Give without expectation of return).",
        "category": "Wisdom",
        "pronunciation": "Nay-kee ka-ri-yiv tay aa-bas manz traa-viv"
    },
    {
        "id": 40,
        "roman": "Hamsaya chhu bhai-yas barabar",
        "dev": "हमसाया छु भायस बराबर",
        "nastaliq": "ہَمسایَہ چھُ بھائی یَس بَرابَر",
        "hindi": "पड़ोसी सगे भाई के बराबर होता है (पड़ोसियों से मधुर संबंध रखना चाहिए)।",
        "english": "A good neighbor is equal to a brother in times of need.",
        "category": "Society",
        "pronunciation": "Ham-saa-yaa chhu bhaay-yas ba-raa-bar"
    },
    {
        "id": 41,
        "roman": "Daulat chhi aasaan chalan-wath",
        "dev": "दौलत छि आसान चलन-वथ",
        "nastaliq": "دَولَت چھِ آسان چَلَن وَتھ",
        "hindi": "दौलत तो आती-जाती छाया है, असली धन चरित्र है।",
        "english": "Wealth is transient like a passing shadow; character remains.",
        "category": "Wisdom",
        "pronunciation": "Dow-lat chhi aa-saan cha-lan vath"
    },
    {
        "id": 42,
        "roman": "Boh chhus gatsaan panun gām",
        "dev": "बॊह छुस गछ़ान पनुन गाम",
        "nastaliq": "بۆہ چُھس گَژھان پَنُن گام",
        "hindi": "अपने गाँव और अपनी जड़ों की ओर लौटना सबसे बड़ा सुख है।",
        "english": "Returning to one's roots and native soil brings true peace.",
        "category": "Family",
        "pronunciation": "Boh chhus ga-tsaan pa-nun gaam"
    },
    {
        "id": 43,
        "roman": "Chay ti kashur chhu jannat-i mive",
        "dev": "चाय तॖ कॉशुर छु जन्नत-इ मेवे",
        "nastaliq": "چاے تہٕ کٲشُر چھُ جَنَّتِ میٖوٕ",
        "hindi": "नून चाय और कश्मीरी कुल्चा स्वर्ग के सुख जैसा है।",
        "english": "Kashmiri tea and traditional bread is heaven's feast on earth.",
        "category": "Food",
        "pronunciation": "Chaay tay koa-shoor chhu jan-nat-ay may-vay"
    },
    {
        "id": 44,
        "roman": "Sats chhu chamkaan zolamas manz",
        "dev": "सत्स छु चमकान ज़ोलमस मंज़",
        "nastaliq": "سَتس چھُ چَمکان زولَمَس مَنٛز",
        "hindi": "सत्य अंधेरे में भी सूर्य की तरह चमकता है।",
        "english": "Truth shines bright even through the darkest veil.",
        "category": "Wisdom",
        "pronunciation": "Sats chhu cham-kaan zo-la-mas manz"
    },
    {
        "id": 45,
        "roman": "Koh chhu thod, magar aab chhu vath kadan",
        "dev": "कोह छु थॊद, मगर आब छु वथ कदन",
        "nastaliq": "کوہ چھُ تھۆد، مَگَر آب چھُ وَتھ کَدَن",
        "hindi": "पहाड़ भले ही कितना ऊंचा हो, पानी अपना रास्ता काट ही लेता है (दृढ़ संकल्प से हर बाधा पार होती है)।",
        "english": "The mountain is tall, yet water carves its way through (Perseverance conquers heights).",
        "category": "Nature",
        "pronunciation": "Koh chhu thod, ma-gar aab chhu vath ka-dan"
    },
    {
        "id": 46,
        "roman": "Shukriya karun chhu dilsi saaf aasan",
        "dev": "शुक्रिया करुन छु दिलसि साफ़ आसान",
        "nastaliq": "شُکرِیَہ کَرُن چھُ دِلسِ صاف آسان",
        "hindi": "धन्यवाद और कृतज्ञता व्यक्त करना साफ़ दिल की निशानी है।",
        "english": "Giving thanks is the mark of a pure and noble heart.",
        "category": "Wisdom",
        "pronunciation": "Shook-ree-ya ka-roon chhu dil-see saaf aa-saan"
    },
    {
        "id": 47,
        "roman": "Dohai vath pakiv te manzil aasi nish",
        "dev": "दॊहय वथ पकिव तॖ मंज़िल आसी निश",
        "nastaliq": "دۄہے وَتھ پَکِیو تہٕ مَنزِل آسی نِش",
        "hindi": "प्रतिदिन थोड़ा-थोड़ा आगे बढ़ो, मंज़िल खुद ब खुद करीब आ जाएगी।",
        "english": "Walk your path daily, and the destination will soon be reached.",
        "category": "Life",
        "pronunciation": "Doh-hay vath pa-kiv tay man-zil aa-see nish"
    },
    {
        "id": 48,
        "roman": "Maza chhu panun mehnatas manz",
        "dev": "मज़ा छु पनुन मेहनतम मंज़",
        "nastaliq": "مَزَہ چھُ پَنُن مِحنَتَس مَنٛز",
        "hindi": "अपनी मेहनत से कमाए टुकड़े में ही असली आनंद है।",
        "english": "True joy is tasting the fruit of one's own honest labor.",
        "category": "Life",
        "pronunciation": "Ma-zaa chhu pa-noon may-ha-na-tas manz"
    },
    {
        "id": 49,
        "roman": "Sharafat chhi insaan-as asali zevar",
        "dev": "शराफ़त छि इंसानस असली ज़ेवर",
        "nastaliq": "شَرافَت چھِ اِنسانَس اَصلی زیٖوَر",
        "hindi": "शराफत और सदाचार ही मनुष्य का असली गहना है।",
        "english": "Decency and honor are humanity's finest ornaments.",
        "category": "Wisdom",
        "pronunciation": "Sha-raa-fat chhi in-saa-nas as-lee zay-var"
    },
    {
        "id": 50,
        "roman": "Koshur chhu sabzi ti safed sheen",
        "dev": "कॉशुर छु सबज़ी तॖ सफ़ेद शीन",
        "nastaliq": "کٲشُر چھُ سَبزی تہٕ سَفید شیٖن",
        "hindi": "कश्मीर हरी-भरी वादियों और सफेद बर्फ का जन्नत-नसीब गुलशन है।",
        "english": "Kashmir is a tapestry of emerald green meadows and pure white snow.",
        "category": "Nature",
        "pronunciation": "Koa-shoor chhu sab-zee tay sa-fayd sheen"
    },
    {
        "id": 51,
        "roman": "Dilsi dil chhu aasaan",
        "dev": "दिलसी दिल छु आसान",
        "nastaliq": "دِلسِ دِل چھُ آسان",
        "hindi": "दिल को दिल से राह होती है (सच्चा प्रेम और सद्भाव दिलों को जोड़ता है)।",
        "english": "Heart speaks to heart (Love and empathy create an unspoken bond).",
        "category": "Family",
        "pronunciation": "Dil-see dil chhu aa-saan"
    },
    {
        "id": 52,
        "roman": "Tsoonth gasi tsoonth-as nish rang kadan",
        "dev": "च़ूंट़ गसी च़ूंटस निश रंग कदन",
        "nastaliq": "ژوٗنٛٹھ گَسی ژوٗنٛٹھَس نِش رَنٛگ کَدَن",
        "hindi": "खरबूजे को देखकर खरबूजा रंग बदलता है (जैसी संगत, वैसी रंगत)।",
        "english": "An apple takes its color from the adjacent apple (We reflect the company we keep).",
        "category": "Society",
        "pronunciation": "Tsoonth ga-see tsoon-thas nish rang ka-dan"
    },
    {
        "id": 53,
        "roman": "Gari gari chhu aab pakaan",
        "dev": "गरे गरे छु आब पकान",
        "nastaliq": "گَرٕ گَرٕ چھُ آب پَکان",
        "hindi": "बूंद-बूंद से घड़ा भरता है और सागर बनता है (छोटी-छोटी बचत से बड़ा संचय होता है)।",
        "english": "Drop by drop, the vessel fills to overflowing (Patience builds abundance).",
        "category": "Wisdom",
        "pronunciation": "Ga-ray ga-ray chhu aab pa-kaan"
    },
    {
        "id": 54,
        "roman": "Aasan gav vanaan, na aasan gav maaraan",
        "dev": "आसन गव वनान, न आसन गव मारान",
        "nastaliq": "آسَن گَو وَنان، نَہ آسَن گَو ماران",
        "hindi": "सम्पन्नता बोलती है, और अभाव इंसान को तोड़ देता है (संसाधन आत्मबल देते हैं)।",
        "english": "Plenty speaks aloud; scarcity strikes in silence.",
        "category": "Life",
        "pronunciation": "Aa-san gav va-naan, na aa-san gav maa-raan"
    },
    {
        "id": 55,
        "roman": "Kavur gasi bronth, kan chhu path",
        "dev": "कवुर गसी ब्रोंठ, कन छु पथर",
        "nastaliq": "کَوُر گَسی برونٛٹھ، کَن چھُ پَتھ",
        "hindi": "कौवा आगे-आगे उड़ता है और अफ़वाह पीछे-पीछे (सुनी-सुनाई बातों पर अंधविश्वास मत करो)।",
        "english": "The crow flies ahead and rumors follow behind (Verify before believing hearsay).",
        "category": "Humor",
        "pronunciation": "Ka-voor ga-see bronth, kan chhu path"
    },
    {
        "id": 56,
        "roman": "Panun hath chhu daulat",
        "dev": "पनुन हथ छु दौलत",
        "nastaliq": "پَنُن ہَتھ چھُ دَولَت",
        "hindi": "अपने हाथ ही सबसे बड़ी दौलत हैं (आत्मनिर्भरता ही सबसे बड़ा सहारा है)।",
        "english": "One's own hands are one's true wealth (Self-reliance is supreme).",
        "category": "Wisdom",
        "pronunciation": "Pa-nun hath chhu dow-lat"
    },
    {
        "id": 57,
        "roman": "Bati chhu aab-as barabar",
        "dev": "बतॖ छु आबस बराबर",
        "nastaliq": "بَتہٕ چھُ آبَس بَرابَر",
        "hindi": "अन्न और जल जीवन के दो सबसे पवित्र उपहार हैं (भोजन का कभी अनादर न करें)।",
        "english": "Bread and water are life's twin sanctuaries (Never waste sustenance).",
        "category": "Food",
        "pronunciation": "Ba-tay chhu aa-bas ba-raa-bar"
    },
    {
        "id": 58,
        "roman": "Rood-as chhu zameen tresh kadan",
        "dev": "रूदस छु ज़मीन त्रेश कदन",
        "nastaliq": "روٗدَس چھُ زٔمیٖن تریٚش کَدَن",
        "hindi": "बरसात धरती की सदियों की प्यास बुझाती है (रहमत सब पर समान रूप से बरसती है)।",
        "english": "Rain slakes the deep thirst of the earth (Grace falls upon all alike).",
        "category": "Nature",
        "pronunciation": "Roo-das chhu za-meen tray-sh ka-dan"
    },
    {
        "id": 59,
        "roman": "Lukh chhi vanaan, haq chhu rozan",
        "dev": "लुख छि वनान, हक़ छु रोज़न",
        "nastaliq": "لۄکھ چھِ وَنان، حَق چھُ روزَن",
        "hindi": "लोग तो कुछ भी कहते रहेंगे, मगर सत्य हमेशा अडिग रहता है (सत्य की ही जीत होती है)।",
        "english": "People will talk, but truth endures forever.",
        "category": "Wisdom",
        "pronunciation": "Lukh chhi va-naan, haq chhu ro-zan"
    },
    {
        "id": 60,
        "roman": "Sondar chhu dil-as aasaan",
        "dev": "सुंदर छु दिलस आसान",
        "nastaliq": "سُندَر چھُ دِلَس آسان",
        "hindi": "सच्ची सुंदरता चेहरे में नहीं, बल्कि साफ़ और नेक दिल में होती है।",
        "english": "True beauty resides within a noble and compassionate heart.",
        "category": "Wisdom",
        "pronunciation": "Sun-dar chhu di-las aa-saan"
    },
    {
        "id": 61,
        "roman": "Chinar chhu sayawaan",
        "dev": "चिनार छु सायवान",
        "nastaliq": "چِنار چھُ سایہٕ وان",
        "hindi": "चिनार का विशाल पेड़ हर राहगीर को बिना भेद-भाव के छांव देता है (परोपकार की भावना)।",
        "english": "The majestic Chinar shelters every wanderer without distinction.",
        "category": "Nature",
        "pronunciation": "Chi-naar chhu saa-ya-vaan"
    },
    {
        "id": 62,
        "roman": "Zulm-as chhu ant",
        "dev": "ज़ुल्मस छु अंत",
        "nastaliq": "ظُلمَس چھُ اَنت",
        "hindi": "अत्याचार और अन्याय का अंत होना निश्चित है।",
        "english": "Every form of injustice meets its eventual end.",
        "category": "Wisdom",
        "pronunciation": "Zul-mas chhu ant"
    },
    {
        "id": 63,
        "roman": "Yaar aasi tɔth, ta dushman kyah kari",
        "dev": "यार आसी तॊथ, तॖ दुश्मन क्याह करी",
        "nastaliq": "یار آسی تۄتھ، تہٕ دُشمَن کَیاہ کَری",
        "hindi": "जब सच्चा दोस्त और ईश्वर साथ हो, तो दुश्मन बाल भी बांका नहीं कर सकता।",
        "english": "When your true friend stands by you, no foe can harm you.",
        "category": "Society",
        "pronunciation": "Yaar aa-see toth, tay doosh-man kyaah ka-ree"
    },
    {
        "id": 64,
        "roman": "Wazwan chhu kashir-hond fakhr",
        "dev": "वाज़वान छु कशीर-हुंद फ़ख़्र",
        "nastaliq": "وازوان چھُ کٔشیٖر ہُند فَخر",
        "hindi": "कश्मीरी वाज़वान हमारी तहज़ीब और मेहमाननवाज़ी का सबसे बड़ा गौरव है।",
        "english": "The traditional Wazwan feast is the proud jewel of Kashmiri culinary culture.",
        "category": "Food",
        "pronunciation": "Vaaz-vaan chhu ka-sheer hoond fakh-ra"
    },
    {
        "id": 65,
        "roman": "Doh chhu aasaan roshan",
        "dev": "दॊह छु आसान रोशन",
        "nastaliq": "دۄہ چھُ آسان روشَن",
        "hindi": "हर नया दिन जीवन में एक नई रोशनी और नया अवसर लेकर आता है।",
        "english": "Each new dawn brings fresh light and renewed hope.",
        "category": "Life",
        "pronunciation": "Doh chhu aa-saan ro-shan"
    },
    {
        "id": 66,
        "roman": "Beni ti boi chhi ek jism",
        "dev": "बेनि तॖ बोय छि एक जिस्म",
        "nastaliq": "بیٚنہِ تہٕ بوی چھِ اؠک جِسم",
        "hindi": "भाई और बहन एक ही डाली के दो फूल हैं (भाई-बहन का अटूट स्नेह)।",
        "english": "Brother and sister share a single soul across two lives.",
        "category": "Family",
        "pronunciation": "Bay-nee tay bo-yee chhi ayk jis-ma"
    },
    {
        "id": 67,
        "roman": "Aqlmandas chhu ishaara kafi",
        "dev": "अक़्लमंदस छु इशारा काफ़ी",
        "nastaliq": "عَقل مَندَس چھُ اِشارَہ کافی",
        "hindi": "समझदार इंसान के लिए केवल एक इशारा ही काफी होता है।",
        "english": "A subtle hint suffices for the wise.",
        "category": "Wisdom",
        "pronunciation": "Aq-la-man-das chhu i-shaa-ra kaa-fee"
    },
    {
        "id": 68,
        "roman": "Andhar chhu aab, barabar chhu pyeyaar",
        "dev": "अंदर छु आब, बराबर छु प्यार",
        "nastaliq": "اَندَر چھُ آب، بَرابَر چھُ پیار",
        "hindi": "अंदर से गंगा जैसा निर्मल और बाहर से सबके लिए अपार प्रेम।",
        "english": "Pure as mountain spring water within, overflowing with affection without.",
        "category": "Wisdom",
        "pronunciation": "An-dar chhu aab, ba-raa-bar chhu pyaay-yaar"
    },
    {
        "id": 69,
        "roman": "Hathas ti khoran chhu mehanath sabaab",
        "dev": "हथस तॖ खॊरन छु मेहनत सबाब",
        "nastaliq": "ہَتھَس تہٕ کھۄرَن چھُ مِحنَت سَباب",
        "hindi": "हाथ और पैरों की सच्ची मेहनत ही इंसान को समाज में प्रतिष्ठा दिलाती है।",
        "english": "Honest sweat of one's hands and feet is the true root of honor.",
        "category": "Life",
        "pronunciation": "Ha-thas tay kho-ran chhu may-ha-nath sa-baab"
    },
    {
        "id": 70,
        "roman": "Koshish kariv ta rasta neri",
        "dev": "कोशिश करिव तॖ रास्ता नेरी",
        "nastaliq": "کوشِش کَرِیو تہٕ راستہٕ نیٖری",
        "hindi": "सच्चे दिल से कोशिश करो तो रास्ते खुद ब खुद खुल जाते हैं।",
        "english": "Make an earnest endeavor, and the way forward will reveal itself.",
        "category": "Life",
        "pronunciation": "Ko-shish ka-riv tay raas-taa nay-ree"
    },
    {
        "id": 71,
        "roman": "Naav chhi gatsaan kinare",
        "dev": "नाव छि गछ़ान किनारे",
        "nastaliq": "ناو چھِ گَژھان کِنارِ",
        "hindi": "लहरों और तूफ़ानों के बाद भी नाव किनारे लग ही जाती है (धैर्य रखने से नैया पार होती है)।",
        "english": "Through tempests and high tides, the boat ultimately reaches the shore.",
        "category": "Life",
        "pronunciation": "Naav chhi ga-tsaan ki-naa-ray"
    },
    {
        "id": 72,
        "roman": "Aash chhi zindagani",
        "dev": "आश छि ज़िंदगानी",
        "nastaliq": "آش چھِ زِندَگانی",
        "hindi": "उम्मीद पर ही सारी दुनिया कायम है (उम्मीद कभी नहीं छोड़नी चाहिए)।",
        "english": "Hope is the breath of life (As long as there is hope, there is life).",
        "category": "Life",
        "pronunciation": "Aash chhi zin-da-gaa-nee"
    }
]

def save_proverbs():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    destinations = [
        os.path.join(base_dir, "koshurgo", "data", "proverbs.json"),
        os.path.join(base_dir, "duolingo_methodology", "data", "proverbs.json"),
        os.path.join(base_dir, "android", "app", "src", "main", "assets", "data", "proverbs.json")
    ]

    # Ensure cross-platform field compatibility (dev + devanagari, hindi + explanation)
    cleaned_entries = []
    for item in PROVERBS:
        entry = dict(item)
        entry["devanagari"] = item["dev"]
        entry["explanation"] = item["hindi"]
        cleaned_entries.append(entry)

    for dest in destinations:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "w", encoding="utf-8") as f:
            json.dump(cleaned_entries, f, ensure_ascii=False, indent=2)
        print(f"Saved {len(cleaned_entries)} clean proverbs to: {dest}")

if __name__ == "__main__":
    save_proverbs()
