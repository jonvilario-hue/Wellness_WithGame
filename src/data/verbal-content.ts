
// This file simulates a rich database of verbal and phonetic content.
// In a real application, this would be a much larger, more structured database or API.

// For Gf: Pattern Matrix (Morphological Analogies)
export const morphologicalRules = {
  plural: (word: string) => (word.endsWith('s') ? word : word + 's'),
  past_tense: (word: string) => (word.endsWith('ed') ? word : word + 'ed'),
  antonym: (word: string) => ({ happy: 'sad', hot: 'cold', fast: 'slow', up: 'down' }[word] || `not-${word}`),
  possession: (word: string) => word + "'s",
};
export const morphologyWordPairs = {
    plural: [{base: 'cat', derived: 'cats'}, {base: 'dog', derived: 'dogs'}],
    past_tense: [{base: 'walk', derived: 'walked'}, {base: 'jump', derived: 'jumped'}],
    antonym: [{base: 'happy', derived: 'sad'}, {base: 'hot', derived: 'cold'}],
};


// For Gwm: Dynamic Sequence (Phonological Loop)
export const phoneticallySimilarSets = [
    ['CAP', 'CAT', 'CAN', 'CAB'],
    ['PIN', 'PEN', 'PAN', 'PUN'],
    ['BIT', 'BET', 'BAT', 'BUT'],
    ['SIT', 'SAT', 'SET', 'SOT'],
];
export const nonsenseWords = ['BIP', 'TEK', 'VUM', 'ZOL', 'DAX', 'FEP'];

// For Gs: Rapid Code Match (Lexical Decision & Homophones)
export const realWords = ["HOUSE", "RIVER", "TABLE", "GREEN", "QUICK", "HAPPY", "CHAIR", "MUSIC"];
export const pseudowords = ["FLIRB", "GLONK", "VOSP", "TRUD", "SPLIM", "CRITH", "MERN", "SKEP"];
export const homophonePairs = [
    ['SALE', 'SAIL'], ['KNIGHT', 'NIGHT'], ['STEAL', 'STEEL'], ['WEAK', 'WEEK'], ['SON', 'SUN']
];
export const synonymPairs = [
    ['HAPPY', 'JOYFUL'], ['BIG', 'LARGE'], ['FAST', 'QUICK'], ['SAD', 'UNHAPPY'], ['COLD', 'CHILLY']
];


// For Gv: Visual Lab (Orthographic Construction)
export const wordParts = {
    prefixes: ['UN-', 'RE-', 'PRE-', 'DIS-'],
    roots: ['FRIEND', 'VIEW', 'PORT', 'SPECT'],
    suffixes: ['-LY', '-NESS', '-ABLE', '-TION'],
};

// For Gc: Verbal Inference (Contextual Bridge Builder)
export const clozeSentences = [
    { sentence: "The man was ___ because his dog died.", options: ["grieving", "excited", "table"], answer: "grieving" },
    { sentence: "To write well, one must select the ___ word.", options: ["precise", "approximate", "heavy"], answer: "precise" },
];
export const idioms = [
    { phrase: "It's raining cats and ___.", answer: "dogs" },
];

// For EF: Focus Switch (Semantic-Phonetic Shift)
export const efWords = {
    rhyme_cat: ['BAT', 'HAT', 'FLAT'],
    rhyme_log: ['DOG', 'FROG', 'BOG'],
    category_animal: ['DOG', 'CAT', 'BAT', 'FROG'],
    category_object: ['HAT', 'LOG', 'FLAT', 'BOG'],
};

// For Glr: Fluency Storm (Constraint-Based Retrieval)
export const glrCategories = {
    semantic: "Animals",
    phonetic: "Starts with 'Tr-'",
    dual: "Adjectives that describe a person AND start with 'P'",
};

// For Ga: Auditory Lab (Cocktail Party Decoder)
export const minimalPairs = [
    { word1: 'Pin', word2: 'Pen', correct: 'Pin', prompt: "Did you hear 'Pin' or 'Pen'?" },
    { word1: 'Bat', word2: 'Pat', correct: 'Bat', prompt: "Did you hear 'Bat' or 'Pat'?" },
];
export const prosodySentences = [
    { sentence: "Oh, that's just great.", tone: 'sarcastic', options: ['Sarcastic', 'Sincere'], answer: 'Sarcastic' },
    { sentence: "You finished the project? That's great!", tone: 'sincere', options: ['Sarcastic', 'Sincere'], answer: 'Sincere' },
];
