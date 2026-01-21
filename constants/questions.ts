
import { Question } from '../types';

export const QUESTIONS: Question[] = [
  {
    id: 1,
    type: 'MCQ',
    prompt: {
      en: "Which month has 28 days?",
      hi: "किस महीने में 28 दिन होते हैं?"
    },
    options: {
      en: ["February", "January", "March", "All of them"],
      hi: ["फरवरी", "जनवरी", "मार्च", "वे सभी"]
    },
    answer: 3,
    hint: {
      en: "Every month has at least 28 days!",
      hi: "हर महीने में कम से कम 28 दिन होते हैं!"
    }
  },
  {
    id: 2,
    type: 'MATCHING',
    prompt: {
      en: "Match the animal with its sound!",
      hi: "जानवर का उसकी आवाज से मिलान करें!"
    },
    pairs: {
      en: [["Dog", "Bark"], ["Cat", "Meow"], ["Lion", "Roar"]],
      hi: [["कुत्ता", "भोंकना"], ["बिल्ली", "म्याऊ"], ["शेर", "दहाड़ना"]]
    },
    answer: "MATCH_ALL",
    hint: {
      en: "Think about the sounds they make.",
      hi: "उनके द्वारा की जाने वाली आवाजों के बारे में सोचें।"
    }
  },
  {
    id: 3,
    type: 'LOGIC',
    prompt: {
      en: "What has hands but cannot clap?",
      hi: "किसके हाथ हैं लेकिन वह ताली नहीं बजा सकता?"
    },
    options: {
      en: ["A Clock", "A Person", "A Tree", "A Robot"],
      hi: ["एक घड़ी", "एक व्यक्ति", "एक पेड़", "एक रोबोट"]
    },
    answer: 0,
    hint: {
      en: "It tells you the time.",
      hi: "यह आपको समय बताता है।"
    }
  },
  {
    id: 4,
    type: 'TRUE_FALSE',
    prompt: {
      en: "Is the sun a planet?",
      hi: "क्या सूर्य एक ग्रह है?"
    },
    options: {
      en: ["True", "False"],
      hi: ["सही", "गलत"]
    },
    answer: 1,
    hint: {
      en: "It is a star.",
      hi: "यह एक तारा है।"
    }
  },
  {
    id: 5,
    type: 'MATCHING',
    prompt: {
      en: "Match the Capital with the Country",
      hi: "राजधानी का देश के साथ मिलान करें"
    },
    pairs: {
      en: [["India", "New Delhi"], ["France", "Paris"], ["Japan", "Tokyo"]],
      hi: [["भारत", "नई दिल्ली"], ["फ्रांस", "पेरिस"], ["जापान", "टोक्यो"]]
    },
    answer: "MATCH_ALL",
    hint: {
      en: "These are major world capitals.",
      hi: "ये दुनिया की प्रमुख राजधानियाँ हैं।"
    }
  },
  {
    id: 6,
    type: 'IMAGE_MCQ',
    imageUrl: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=400",
    prompt: {
      en: "What is the common name for this animal?",
      hi: "इस जानवर का सामान्य नाम क्या है?"
    },
    options: {
      en: ["Cat", "Dog", "Wolf", "Fox"],
      hi: ["बिल्ली", "कुत्ता", "भेड़िया", "लोमड़ी"]
    },
    answer: 1,
    hint: {
      en: "Man's best friend.",
      hi: "मनुष्य का सबसे अच्छा दोस्त।"
    }
  },
  {
    id: 7,
    type: 'FILL_BLANKS',
    prompt: {
      en: "The capital of India is New ______.",
      hi: "भारत की राजधानी नई ______ है।"
    },
    answer: "Delhi",
    hint: {
      en: "It rhymes with Belly.",
      hi: "यह 'दिल्ली' है।"
    }
  },
  {
    id: 8,
    type: 'MCQ',
    prompt: {
      en: "If you have me, you want to share me. If you share me, you haven't got me. What am I?",
      hi: "अगर मैं तुम्हारे पास हूँ, तो तुम मुझे साझा करना चाहते हो। अगर तुम मुझे साझा करते हो, तो मैं तुम्हारे पास नहीं हूँ। मैं क्या हूँ?"
    },
    options: {
      en: ["Money", "Secret", "A cold", "Advice"],
      hi: ["पैसा", "रहस्य", "जुकाम", "सलाह"]
    },
    answer: 1,
    hint: {
      en: "Shhh...",
      hi: "शशश..."
    }
  }
];
