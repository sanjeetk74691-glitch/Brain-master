
import { Level } from '../types';

export const LEVELS: Level[] = [
  {
    id: 1,
    questions: [
      { id: "1_1", type: 'MCQ', prompt: { en: "Which month has 28 days?", hi: "किस महीने में 28 दिन होते हैं?" }, options: { en: ["February", "January", "March", "All of them"], hi: ["फरवरी", "जनवरी", "मार्च", "वे सभी"] }, answer: 3, hint: { en: "Every month has at least 28 days!", hi: "हर महीने में कम से कम 28 दिन होते हैं!" } },
      { id: "1_2", type: 'MCQ', prompt: { en: "What goes up but never comes down?", hi: "क्या ऊपर जाता है लेकिन कभी नीचे नहीं आता?" }, options: { en: ["A Balloon", "Your Age", "Smoke", "A Bird"], hi: ["एक गुब्बारा", "आपकी उम्र", "धुआं", "एक पक्षी"] }, answer: 1, hint: { en: "It increases every birthday.", hi: "यह हर जन्मदिन पर बढ़ता है।" } },
      { id: "1_3", type: 'LOGIC', prompt: { en: "What has hands but cannot clap?", hi: "किसके हाथ हैं लेकिन वह ताली नहीं बजा सकता?" }, options: { en: ["A Clock", "A Person", "A Tree", "A Robot"], hi: ["एक घड़ी", "एक व्यक्ति", "एक पेड़", "एक रोबोट"] }, answer: 0, hint: { en: "It tells you the time.", hi: "यह आपको समय बताता है।" } },
      { id: "1_4", type: 'TRUE_FALSE', prompt: { en: "Is the sun a planet?", hi: "क्या सूर्य एक ग्रह है?" }, options: { en: ["True", "False"], hi: ["सही", "गलत"] }, answer: 1, hint: { en: "It is a star.", hi: "यह एक तारा है।" } },
      { id: "1_5", type: 'MCQ', prompt: { en: "Full of holes but holds water?", hi: "छेदों से भरा है पर पानी रोकता है?" }, options: { en: ["Sieve", "Net", "Sponge", "Cloud"], hi: ["छलनी", "जाल", "स्पंज", "बादल"] }, answer: 2, hint: { en: "Kitchen item.", hi: "रसोई की चीज़।" } },
      { id: "1_6", type: 'MCQ', prompt: { en: "What gets wetter the more it dries?", hi: "सूखने पर और गीला क्या होता है?" }, options: { en: ["Water", "Towel", "Rain", "Sponge"], hi: ["पानी", "तौलिया", "बारिश", "स्पंज"] }, answer: 1, hint: { en: "Use it after bath.", hi: "नहाने के बाद इस्तेमाल करें।" } },
      { id: "1_7", type: 'FILL_BLANKS', prompt: { en: "Capital of India? New ______", hi: "भारत की राजधानी? नई ______" }, answer: "Delhi", hint: { en: "Rhymes with Belly.", hi: "दिल्ली।" } },
      { id: "1_8", type: 'MCQ', prompt: { en: "What can't talk but will reply when spoken to?", hi: "बोल नहीं सकता पर जवाब देता है?" }, options: { en: ["Phone", "Echo", "Mirror", "Shadow"], hi: ["फोन", "गूँज", "आईना", "परछाई"] }, answer: 1, hint: { en: "In the mountains.", hi: "पहाड़ों में।" } },
      { id: "1_9", type: 'MCQ', prompt: { en: "What has a neck but no head?", hi: "गर्दन है पर सिर नहीं?" }, options: { en: ["Shirt", "Bottle", "Snake", "Guitar"], hi: ["शर्ट", "बोतल", "सांप", "गिटार"] }, answer: 1, hint: { en: "You drink from it.", hi: "आप इससे पीते हैं।" } },
      { id: "1_10", type: 'FILL_BLANKS', prompt: { en: "Starts with E, ends with E, has 1 letter?", hi: "E से शुरू, E पर खत्म, 1 अक्षर है?" }, answer: "Envelope", hint: { en: "Put letters inside.", hi: "पत्र अंदर डालें।" } }
    ]
  },
  {
    id: 2,
    questions: [
      { id: "2_1", type: 'MCQ', prompt: { en: "What has one eye but can't see?", hi: "एक आँख है पर देख नहीं सकती?" }, options: { en: ["Storm", "Needle", "Potato", "Target"], hi: ["तूफान", "सुई", "आलू", "लक्ष्य"] }, answer: 1, hint: { en: "Used for sewing.", hi: "सिलाई के काम आती है।" } },
      { id: "2_2", type: 'MCQ', prompt: { en: "What has legs but doesn't walk?", hi: "पैर हैं पर चलता नहीं?" }, options: { en: ["Dog", "Table", "Car", "Robot"], hi: ["कुत्ता", "मेज", "कार", "रोबोट"] }, answer: 1, hint: { en: "Furniture.", hi: "फर्नीचर।" } },
      { id: "2_3", type: 'MCQ', prompt: { en: "What can you catch but not throw?", hi: "पकड़ सकते हैं पर फेंक नहीं सकते?" }, options: { en: ["Ball", "Cold", "Secret", "Light"], hi: ["गेंद", "जुकाम", "रहस्य", "प्रकाश"] }, answer: 1, hint: { en: "Bless you!", hi: "छींक!" } },
      { id: "2_4", type: 'LOGIC', prompt: { en: "What belongs to you but used by others?", hi: "आपका है पर दूसरे इस्तेमाल करते हैं?" }, options: { en: ["Money", "Name", "Phone", "Car"], hi: ["पैसा", "नाम", "फोन", "कार"] }, answer: 1, hint: { en: "Identity.", hi: "पहचान।" } },
      { id: "2_5", type: 'MCQ', prompt: { en: "What has words but never speaks?", hi: "शब्द हैं पर बोलती नहीं?" }, options: { en: ["Radio", "Book", "Baby", "Mime"], hi: ["रेडियो", "किताब", "बच्चा", "माइम"] }, answer: 1, hint: { en: "Reading.", hi: "पढ़ना।" } },
      { id: "2_6", type: 'MCQ', prompt: { en: "What has many keys but can't open a lock?", hi: "चाबियाँ बहुत हैं पर ताला नहीं खुलता?" }, options: { en: ["Janitor", "Piano", "Treasure Chest", "Prison"], hi: ["चौकीदार", "पियानो", "खजाना", "जेल"] }, answer: 1, hint: { en: "Musical instrument.", hi: "वाद्य यंत्र।" } },
      { id: "2_7", type: 'TRUE_FALSE', prompt: { en: "Does 1 kg of iron weigh more than 1 kg of cotton?", hi: "क्या 1 किलो लोहा 1 किलो रुई से भारी होता है?" }, options: { en: ["Yes", "No"], hi: ["हाँ", "नहीं"] }, answer: 1, hint: { en: "Both are 1 kg.", hi: "दोनों 1 किलो हैं।" } },
      { id: "2_8", type: 'MCQ', prompt: { en: "What has a thumb and four fingers but no life?", hi: "अंगूठा और चार अंगुलियां हैं पर जान नहीं?" }, options: { en: ["Zombie", "Glove", "Hand Print", "Robot"], hi: ["ज़ोंबी", "दस्ताने", "हाथ का निशान", "रोबोट"] }, answer: 1, hint: { en: "Clothing for hands.", hi: "हाथों का पहनावा।" } },
      { id: "2_9", type: 'FILL_BLANKS', prompt: { en: "Opposite of 'Always'?", hi: "'हमेशा' का उल्टा?" }, answer: "Never", hint: { en: "N____", hi: "क____ नहीं।" } },
      { id: "2_10", type: 'MCQ', prompt: { en: "What building has the most stories?", hi: "किस इमारत में सबसे ज्यादा कहानियाँ होती हैं?" }, options: { en: ["Skyscraper", "Library", "Hotel", "Hospital"], hi: ["गगनचुंबी इमारत", "पुस्तकालय", "होटल", "अस्पताल"] }, answer: 1, hint: { en: "Books have stories.", hi: "किताबों में कहानियाँ होती हैं।" } }
    ]
  }
];
