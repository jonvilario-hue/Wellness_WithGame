
// This file acts as a mock database for all verbal content,
// simulating what would be stored in a production Firestore collection.

// --- 1. Word Corpus & Metadata ---
export interface WordCorpusEntry {
  word: string;
  lemma: string;
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb';
  phonemes_ipa?: string;
  syllables: number;
  frequency_score: number; // Simplified: 1-10 (10 = very common)
  tags: ('universal' | 'regional_us' | 'academic' | 'emotion' | 'tool')[];
}

// Expanded lists to mitigate repetition risk (Audit 3.4)
export const wordCorpus: Record<string, WordCorpusEntry> = {
  // Original
  "cat": { word: "cat", lemma: "cat", part_of_speech: 'noun', syllables: 1, frequency_score: 9, tags: ['universal'] },
  "dog": { word: "dog", lemma: "dog", part_of_speech: 'noun', syllables: 1, frequency_score: 9, tags: ['universal'] },
  "run": { word: "run", lemma: "run", part_of_speech: 'verb', syllables: 1, frequency_score: 9.5, tags: ['universal'] },
  "happy": { word: "happy", lemma: "happy", part_of_speech: 'adjective', syllables: 2, frequency_score: 9, tags: ['universal', 'emotion'] },
  "sad": { word: "sad", lemma: "sad", part_of_speech: 'adjective', syllables: 1, frequency_score: 8.5, tags: ['universal', 'emotion'] },
  "ability": { word: "ability", lemma: "ability", part_of_speech: 'noun', syllables: 4, frequency_score: 7, tags: ['universal'] },
  "sedulous": { word: "sedulous", lemma: "sedulous", part_of_speech: 'adjective', syllables: 3, frequency_score: 2, tags: ['academic'] },
  "ephemeral": { word: "ephemeral", lemma: "ephemeral", part_of_speech: 'adjective', syllables: 4, frequency_score: 3, tags: ['academic'] },
  "hammer": { word: "hammer", lemma: "hammer", part_of_speech: 'noun', syllables: 2, frequency_score: 6, tags: ['universal', 'tool'] },
  "saw": { word: "saw", lemma: "saw", part_of_speech: 'noun', syllables: 1, frequency_score: 7, tags: ['universal', 'tool'] },
  // Expansion
  "system": { word: "system", lemma: "system", part_of_speech: 'noun', syllables: 2, frequency_score: 8, tags: ['universal', 'academic'] },
  "analyze": { word: "analyze", lemma: "analyze", part_of_speech: 'verb', syllables: 3, frequency_score: 6, tags: ['academic'] },
  "ubiquitous": { word: "ubiquitous", lemma: "ubiquitous", part_of_speech: 'adjective', syllables: 4, frequency_score: 3, tags: ['academic'] },
  "synthesis": { word: "synthesis", lemma: "synthesis", part_of_speech: 'noun', syllables: 3, frequency_score: 4, tags: ['academic'] },
  "ameliorate": { word: "ameliorate", lemma: "ameliorate", part_of_speech: 'verb', syllables: 4, frequency_score: 2, tags: ['academic'] },
  "fast": { word: "fast", lemma: "fast", part_of_speech: 'adjective', syllables: 1, frequency_score: 9, tags: ['universal'] },
  "slow": { word: "slow", lemma: "slow", part_of_speech: 'adjective', syllables: 1, frequency_score: 9, tags: ['universal'] },
  "hot": { word: "hot", lemma: "hot", part_of_speech: 'adjective', syllables: 1, frequency_score: 9, tags: ['universal'] },
  "cold": { word: "cold", lemma: "cold", part_of_speech: 'adjective', syllables: 1, frequency_score: 9, tags: ['universal'] },
  "big": { word: "big", lemma: "big", part_of_speech: 'adjective', syllables: 1, frequency_score: 9.5, tags: ['universal'] },
  "small": { word: "small", lemma: "small", part_of_speech: 'adjective', syllables: 1, frequency_score: 9.5, tags: ['universal'] },
};

export const validationWordList: Set<string> = new Set([
  ...Object.keys(wordCorpus),
  "house", "river", "table", "green", "quick", "chair", "music", "read", "write",
  "think", "dream", "play", "work", "love", "hate", "laugh", "cry", "walk", "jump",
  "build", "design", "code", "test", "deploy", "monitor", "refactor", "scale", "optimize", "secure",
  "tree", "flower", "ocean", "mountain", "sky", "cloud", "sun", "moon", "star", "rain", "snow",
  "friend", "family", "team", "community", "world", "city", "country", "continent", "planet"
]);

// --- 3. Pseudoword Generation Components (for Gs) ---
export const consonantClustersStart = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'wh', 'wr'];
export const consonantClustersEnd = ['sk', 'sp', 'st', 'ct', 'ft', 'lk', 'lp', 'lt', 'mp', 'nd', 'nk', 'nt', 'pt', 'rd', 'rk', 'rt'];
export const singleConsonants = "bcdfghjklmnpqrstvwxyz".split('');
export const vowels = "aeiou".split('');


export const phoneticallySimilarSets = [
    ['CAP', 'CAT', 'CAN', 'CAB', 'CAM'],
    ['PIN', 'PEN', 'PAN', 'PUN', 'PIT'],
    ['BIT', 'BET', 'BAT', 'BUT', 'BIG'],
    ['SIT', 'SAT', 'SET', 'SOT', 'SIX'],
    ['LAKE', 'LATE', 'LACE', 'LAME', 'LANE'],
    ['PEAK', 'PEEK', 'PIKE', 'PACK', 'POCK'],
];

export const grammarScrambleSentences = [
    { sentence: "The quick brown fox jumps over the lazy dog.", complexity: 1 },
    { sentence: "She sells seashells by the seashore.", complexity: 1 },
    { sentence: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?", complexity: 2 },
    { sentence: "A journey of a thousand miles begins with a single step.", complexity: 2 },
    { sentence: "To be or not to be that is the question.", complexity: 3 },
];

export const clozeSentences = [
    { question: "The man was ___ because his dog died.", options: ["ecstatic", "ambivalent"], answer: "grieving", explanation: "'Grieving' describes sorrow after a loss.", difficulty: "high" },
    { question: "To write well, one must select the ___ word.", options: ["approximate", "verbose"], answer: "precise", explanation: "'Precise' means exact and accurate, a key quality of good writing.", difficulty: "medium" },
    { question: "Despite the market crash, she remained ___ and did not panic.", options: ["agitated", "flustered"], answer: "nonchalant", explanation: "'Nonchalant' means calm and unconcerned, fitting the context.", difficulty: "high" },
    { question: "The ___ student diligently reviewed her notes every night.", options: ["apathetic", "lazy"], answer: "sedulous", explanation: "'Sedulous' means showing dedication and diligence.", difficulty: "high" },
];

export const morphologyWordPairs = {
    pluralization: [
        { base: 'cat', derived: 'cats' },
        { base: 'dog', derived: 'dogs' },
        { base: 'fox', derived: 'foxes' },
        { base: 'leaf', derived: 'leaves' },
    ],
    tense_change: [
        { base: 'walk', derived: 'walked' },
        { base: 'sing', derived: 'sang' },
        { base: 'run', derived: 'ran' },
        { base: 'think', derived: 'thought' },
    ]
}

export const generalCategories = ["Animals", "Fruits", "Countries", "Colors", "Items in a kitchen", "Clothing", "Vehicles", "Professions"];
export const mathCategories = ["Geometric Shapes", "Units of Measurement", "Prime Numbers", "Famous Mathematicians", "Algebraic Terms"];
export const musicCategories = ["Musical Instruments", "Music Genres", "Famous Composers", "Italian Terms", "Time Signatures"];
export const verbalCategories = ["Nouns", "Verbs", "Adjectives", "Figures of Speech", "Mythological Creatures"];

export const efCategories = {
  isAnimate: ['cat', 'dog', 'bird', 'fish', 'human', 'insect'],
  isObject: ['chair', 'table', 'hammer', 'rock', 'computer', 'book'],
  rhymesWithCat: ['hat', 'bat', 'mat', 'flat', 'splat'],
  rhymesWithDog: ['log', 'frog', 'bog', 'smog', 'jog'],
};

export const spatialConcepts = [
    { question: "Which term describes the front of a ship?", answer: "Bow", distractors: ["Stern", "Port", "Starboard"], explanation: "The 'bow' is the forward part of a ship's hull." },
    { question: "In architecture, what is a 'keystone'?", answer: "The central stone of an arch", distractors: ["A foundation stone", "A decorative cornerstone", "A type of column"], explanation: "The keystone locks all other stones into position, completing the arch." },
    { question: "If you are facing North and turn 180 degrees, which direction are you now facing?", answer: "South", distractors: ["East", "West", "North"], explanation: "A 180-degree turn is a complete reversal of direction." },
    { question: "Which term means 'situated at the side'?", answer: "Lateral", distractors: ["Medial", "Dorsal", "Ventral"], explanation: "Lateral refers to the sides, while medial refers to the middle." },
];

export const realWords = Array.from(validationWordList);
export const pseudowords = ["flib", "glorp", "wux", "blicket", "zorp", "dax", "splunge", "grick", "veb", "trask"];
