
export const morphologyWordPairs = {
  plural: [{base: 'cat', derived: 'cats'}, {base: 'dog', derived: 'dogs'}],
  past_tense: [{base: 'walk', derived: 'walked'}, {base: 'jump', derived: 'jumped'}],
  antonym: [{base: 'happy', derived: 'sad'}, {base: 'hot', derived: 'cold'}],
};

export const phoneticallySimilarSets = [
    ['CAP', 'CAT', 'CAN', 'CAB'],
    ['PIN', 'PEN', 'PAN', 'PUN'],
    ['BIT', 'BET', 'BAT', 'BUT'],
    ['SIT', 'SAT', 'SET', 'SOT'],
];
export const nonsenseWords = ['BIP', 'TEK', 'VUM', 'ZOL', 'DAX', 'FEP'];

export const realWords = ["HOUSE", "RIVER", "TABLE", "GREEN", "QUICK", "HAPPY", "CHAIR", "MUSIC"];
export const pseudowords = ["FLIRB", "GLONK", "VOSP", "TRUD", "SPLIM", "CRITH", "MERN", "SKEP"];

export const homophonePairs = [
    ['SALE', 'SAIL'], ['KNIGHT', 'NIGHT'], ['STEAL', 'STEEL'], ['WEAK', 'WEEK'], ['SON', 'SUN']
];
export const synonymPairs = [
    ['HAPPY', 'JOYFUL'], ['BIG', 'LARGE'], ['FAST', 'QUICK'], ['SAD', 'UNHAPPY'], ['COLD', 'CHILLY']
];

export const wordParts = {
    compound_words: [
        { parts: ["SUN", "FLOWER"], answer: "SUNFLOWER", hint: "A tall, yellow plant" },
        { parts: ["RAIN", "BOW"], answer: "RAINBOW", hint: "An arc of color in the sky" }
    ],
    affix_words: [
        { parts: ["UN-", "FRIEND", "-LY"], answer: "UNFRIENDLY", hint: "Not amiable or pleasant" },
        { parts: ["RE-", "VIEW"], answer: "REVIEW", hint: "To examine or assess again" }
    ]
};

export const clozeSentences = [
    { question: "The man was ___ because his dog died.", options: ["excited", "table"], answer: "grieving", explanation: "'Grieving' is an emotion associated with loss.", difficulty: 1 },
    { question: "To write well, one must select the ___ word.", options: ["approximate", "heavy"], answer: "precise", explanation: "'Precise' means exact and accurate, which is desirable in good writing.", difficulty: 5 },
    { question: "Despite the market crash, she remained ___ and did not panic.", options: ["flustered", "nonchalant"], answer: "nonchalant", explanation: "'Nonchalant' means calm and unconcerned, fitting the context of not panicking.", difficulty: 10 },
];

export const efWords = {
    rhyme_cat: ['BAT', 'HAT', 'FLAT'],
    rhyme_log: ['DOG', 'FROG', 'BOG'],
    category_animal: ['DOG', 'CAT', 'BAT', 'FROG'],
    category_object: ['HAT', 'LOG', 'FLAT', 'BOG'],
};

export const generalCategories = ["Animals", "Tools", "Countries", "Foods", "Body Parts", "Professions", "Clothing", "Colors"];
export const mathCategories = ["Geometric Shapes", "Units of Measurement", "Mathematical Operations", "Famous Mathematicians", "Branches of Mathematics", "Types of Numbers", "Statistical Terms", "Constants"];
export const musicCategories = ["Musical Instruments", "Music Genres", "Elements of Music", "Time Signatures", "Famous Composers", "Types of Scales", "Italian Terms", "Vocal Ranges"];
export const verbalCategories = ["Literary Devices", "Parts of Speech", "Types of Poetry", "Figures of Speech", "Punctuation Marks"];

export const minimalPairs = [
    { word1: 'Pin', word2: 'Pen', correct: 'Pin', prompt: "Did you hear 'Pin' or 'Pen'?" },
    { word1: 'Bat', word2: 'Pat', correct: 'Bat', prompt: "Did you hear 'Bat' or 'Pat'?" },
    { word1: 'Ship', word2: 'Sheep', correct: 'Sheep', prompt: "Did you hear 'Ship' or 'Sheep'?" },
];
export const prosodySentences = [
    { sentence: "Oh, that's just great.", options: ['Sarcastic', 'Sincere'], answer: 'Sarcastic' },
    { sentence: "You finished the project? That's great!", options: ['Sarcastic', 'Sincere'], answer: 'Sincere' },
];
