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
  },
  {
    id: 9,
    type: 'IMAGE_MCQ',
    imageUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=400",
    prompt: {
      en: "What is the main subject of this image?",
      hi: "इस चित्र का मुख्य विषय क्या है?"
    },
    options: {
      en: ["Microchip", "Chocolate Bar", "Skyscraper", "City Map"],
      hi: ["माइक्रोचिप", "चॉकलेट बार", "गगनचुंबी इमारत", "शहर का नक्शा"]
    },
    answer: 0,
    hint: {
      en: "It's the brain of a computer.",
      hi: "यह कंप्यूटर का दिमाग है।"
    }
  },
  {
    id: 10,
    type: 'IMAGE_MCQ',
    imageUrl: "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=400",
    prompt: {
      en: "Which instrument is shown here?",
      hi: "यहाँ कौन सा वाद्य यंत्र दिखाया गया है?"
    },
    options: {
      en: ["Violin", "Guitar", "Piano", "Drums"],
      hi: ["वायलिन", "गिटार", "पियानो", "ड्रम"]
    },
    answer: 1,
    hint: {
      en: "It has six strings.",
      hi: "इसमें छह तार होते हैं।"
    }
  },
  {
    id: 11,
    type: 'IMAGE_MCQ',
    imageUrl: "https://images.unsplash.com/photo-1564507592333-c60657eaa0ae?auto=format&fit=crop&q=80&w=400",
    prompt: {
      en: "Identify this famous world landmark.",
      hi: "इस प्रसिद्ध विश्व स्थल को पहचानें।"
    },
    options: {
      en: ["Eiffel Tower", "Taj Mahal", "Pyramids", "Colosseum"],
      hi: ["एफिल टॉवर", "ताज महल", "पिरामिड", "कोलोजियम"]
    },
    answer: 1,
    hint: {
      en: "It is located in Agra, India.",
      hi: "यह आगरा, भारत में स्थित है।"
    }
  },
  {
    id: 12,
    type: 'LOGIC',
    prompt: {
      en: "Which number comes next: 2, 4, 8, 16, ?",
      hi: "अगली संख्या कौन सी है: 2, 4, 8, 16, ?"
    },
    options: {
      en: ["20", "24", "32", "64"],
      hi: ["20", "24", "32", "64"]
    },
    answer: 2,
    hint: {
      en: "It's doubling every time.",
      hi: "यह हर बार दोगुना हो रहा है।"
    }
  },
  {
    id: 13,
    type: 'IMAGE_MCQ',
    imageUrl: "https://images.unsplash.com/photo-1444464666168-49d633b86747?auto=format&fit=crop&q=80&w=400",
    prompt: {
      en: "Identify this beautiful creature.",
      hi: "इस सुंदर जीव को पहचानें।"
    },
    options: {
      en: ["Eagle", "Sparrow", "Kingfisher", "Parrot"],
      hi: ["बाज", "गौरैया", "किंगफिशर", "तोता"]
    },
    answer: 2,
    hint: {
      en: "Known for fishing in water.",
      hi: "पानी में मछली पकड़ने के लिए जाना जाता है।"
    }
  },
  {
    id: 14,
    type: 'MCQ',
    prompt: {
      en: "The more of this there is, the less you see. What is it?",
      hi: "यह जितना अधिक होता है, उतना ही कम आप देख पाते हैं। यह क्या है?"
    },
    options: {
      en: ["Light", "Fog", "Darkness", "Air"],
      hi: ["प्रकाश", "कोहरा", "अंधेरा", "हवा"]
    },
    answer: 2,
    hint: {
      en: "Opposite of light.",
      hi: "प्रकाश का विलोम।"
    }
  },
  {
    id: 15,
    type: 'FILL_BLANKS',
    prompt: {
      en: "I follow you all day but don't have a body. What am I?",
      hi: "मैं दिन भर आपके पीछे चलता हूँ लेकिन मेरा शरीर नहीं है। मैं क्या हूँ?"
    },
    answer: "Shadow",
    hint: {
      en: "It appears when there is light.",
      hi: "यह तब दिखाई देता है जब प्रकाश होता है।"
    }
  },
  {
    id: 16,
    type: 'TRUE_FALSE',
    prompt: {
      en: "The Earth is the largest planet in the Solar System.",
      hi: "पृथ्वी सौर मंडल का सबसे बड़ा ग्रह है।"
    },
    options: {
      en: ["True", "False"],
      hi: ["सही", "गलत"]
    },
    answer: 1,
    hint: {
      en: "Jupiter is much larger.",
      hi: "बृहस्पति बहुत बड़ा है।"
    }
  },
  {
    id: 17,
    type: 'IMAGE_MCQ',
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=400",
    prompt: {
      en: "What device is shown in this picture?",
      hi: "इस चित्र में कौन सा उपकरण दिखाया गया है?"
    },
    options: {
      en: ["Monitor", "Laptop", "Keyboard", "Mouse"],
      hi: ["मॉनिटर", "लैपटॉप", "कीबोर्ड", "माउस"]
    },
    answer: 1,
    hint: {
      en: "A portable computer.",
      hi: "एक पोर्टेबल कंप्यूटर।"
    }
  },
  {
    id: 18,
    type: 'MCQ',
    prompt: {
      en: "What month of the year has 28 days?",
      hi: "साल के किस महीने में 28 दिन होते हैं?"
    },
    options: {
      en: ["Only February", "All of them", "Every leap year", "None"],
      hi: ["केवल फरवरी", "वे सभी", "हर लीप वर्ष", "कोई नहीं"]
    },
    answer: 1,
    hint: {
      en: "Tricky question! Every month has at least 28 days.",
      hi: "पेचीदा सवाल! हर महीने में कम से कम 28 दिन होते हैं।"
    }
  },
  {
    id: 19,
    type: 'LOGIC',
    prompt: {
      en: "If 1=3, 2=3, 3=5, 4=4, 5=4, then 6=?",
      hi: "यदि 1=3, 2=3, 3=5, 4=4, 5=4, तो 6=?"
    },
    options: {
      en: ["3", "4", "5", "6"],
      hi: ["3", "4", "5", "6"]
    },
    answer: 0,
    hint: {
      en: "Count the number of letters in the English word for the digit.",
      hi: "अंक के अंग्रेजी शब्द में अक्षरों की संख्या गिनें (SIX has 3 letters)."
    }
  },
  {
    id: 20,
    type: 'FILL_BLANKS',
    prompt: {
      en: "What has many keys but can't open a single lock?",
      hi: "किसके पास बहुत सारी चाबियाँ हैं लेकिन वह एक भी ताला नहीं खोल सकता?"
    },
    answer: "Piano",
    hint: {
      en: "It makes music.",
      hi: "यह संगीत बनाता है।"
    }
  },
  {
    id: 21,
    type: 'IMAGE_MCQ',
    imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&q=80&w=400",
    prompt: {
      en: "What are these objects?",
      hi: "ये वस्तुएं क्या हैं?"
    },
    options: {
      en: ["Books", "Tablets", "Phones", "Magazines"],
      hi: ["किताबें", "टैबलेट", "फोन", "पत्रिकाएं"]
    },
    answer: 0,
    hint: {
      en: "You read them to gain knowledge.",
      hi: "आप ज्ञान प्राप्त करने के लिए उन्हें पढ़ते हैं।"
    }
  }
];
