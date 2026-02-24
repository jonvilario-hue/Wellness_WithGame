
// This file acts as a mock database for all verbal content,
// simulating what would be stored in a production Firestore collection.

// --- 1. Word Corpus & Metadata ---
// A small, curated list for the prototype. A production app would have thousands.
// The schema includes tags for future filtering (accessibility, bias).
export interface WordCorpusEntry {
  word: string;
  lemma: string;
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb';
  phonemes_ipa?: string; // e.g., /əˈbɪlɪti/
  syllables: number;
  frequency_score: number; // Simplified: 1-10 (10 = very common)
  tags: ('universal' | 'regional_us' | 'academic' | 'emotion' | 'tool')[];
}

export const wordCorpus: Record<string, WordCorpusEntry> = {
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
};

// --- 2. Lexical Decision & Fluency Validation ---
// A larger set for validating user input in Glr and generating pseudowords for Gs.
// In production, this would be a much larger, compressed data structure.
export const validationWordList: Set<string> = new Set([
  ...Object.keys(wordCorpus),
  "house", "river", "table", "green", "quick", "chair", "music", "read", "write",
  "think", "dream", "play", "work", "love", "hate", "laugh", "cry", "walk", "jump"
]);

// --- 3. Pseudoword Generation Components (for Gs) ---
export const consonantClustersStart = ['bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'sc', 'sk', 'sl', 'sm', 'sn', 'sp', 'st', 'sw', 'tr', 'tw', 'wh', 'wr'];
export const consonantClustersEnd = ['sk', 'sp', 'st', 'ct', 'ft', 'lk', 'lp', 'lt', 'mp', 'nd', 'nk', 'nt', 'pt', 'rd', 'rk', 'rt'];
export const singleConsonants = "bcdfghjklmnpqrstvwxyz".split('');
export const vowels = "aeiou".split('');

// --- 4. Morphological & Orthographic Rules (for Gf) ---
export const morphologicalRules = {
  plural: (word: string) => word.endsWith('s') ? word : word + 's',
  past_tense: (word: string) => word.endsWith('ed') ? word : word + 'ed',
  antonym: (word: string) => ({ 'happy': 'sad', 'hot': 'cold', 'fast': 'slow', 'up': 'down' }[word] || word),
};

// --- 5. Phonetic & Syntactic Content ---
// For Ga, Gwm phonological loop
export const phoneticallySimilarSets = [
    ['CAP', 'CAT', 'CAN', 'CAB'],
    ['PIN', 'PEN', 'PAN', 'PUN'],
    ['BIT', 'BET', 'BAT', 'BUT'],
    ['SIT', 'SAT', 'SET', 'SOT'],
    ['LAKE', 'LATE', 'LACE', 'LAME'],
];

// For Gc, Gwm syntax tasks
export const grammaticallyIncorrectSentences = [
  { incorrect: "The cat sit on the mat.", correct: "The cat sits on the mat." },
  { incorrect: "She run fastly.", correct: "She runs fast." },
  { incorrect: "The dogs is barking.", correct: "The dogs are barking." },
];

export const grammarScrambleSentences = [
    { sentence: "The quick brown fox jumps over the lazy dog.", complexity: 1 },
    { sentence: "She sells seashells by the seashore.", complexity: 1 },
    { sentence: "How much wood would a woodchuck chuck if a woodchuck could chuck wood?", complexity: 2 },
];


// For Gc cloze task
export const clozeSentences = [
    { question: "The man was ___ because his dog died.", options: ["ecstatic", "ambivalent"], answer: "grieving", explanation: "'Grieving' describes sorrow after a loss.", difficulty: "high" },
    { question: "To write well, one must select the ___ word.", options: ["approximate", "verbose"], answer: "precise", explanation: "'Precise' means exact and accurate, a key quality of good writing.", difficulty: "medium" },
    { question: "Despite the market crash, she remained ___ and did not panic.", options: ["agitated", "flustered"], answer: "nonchalant", explanation: "'Nonchalant' means calm and unconcerned, fitting the context.", difficulty: "high" },
];

export const morphologyWordPairs = {
    pluralization: [
        { base: 'cat', derived: 'cats' },
        { base: 'dog', derived: 'dogs' },
    ],
    tense_change: [
        { base: 'walk', derived: 'walked' },
        { base: 'sing', derived: 'sang' },
    ]
}

// For Glr category fluency task
export const generalCategories = ["Animals", "Fruits", "Countries", "Colors", "Items in a kitchen"];
export const mathCategories = ["Geometric Shapes", "Units of Measurement", "Prime Numbers", "Famous Mathematicians"];
export const musicCategories = ["Musical Instruments", "Music Genres", "Famous Composers", "Italian Terms"];
export const verbalCategories = ["Nouns", "Verbs", "Adjectives", "Figures of Speech"];

// For EF semantic shift
export const efCategories = {
  isAnimate: ['cat', 'dog', 'bird'],
  isObject: ['chair', 'table', 'hammer'],
  rhymesWithCat: ['hat', 'bat', 'mat'],
  rhymesWithDog: ['log', 'frog', 'bog'],
};

// For Gc Spatial Lexicon
export const spatialConcepts = [
    { question: "Which term describes the front of a ship?", answer: "Bow", distractors: ["Stern", "Port", "Starboard"], explanation: "The 'bow' is the forward part of a ship's hull." },
    { question: "In architecture, what is a 'keystone'?", answer: "The central stone of an arch", distractors: ["A foundation stone", "A decorative cornerstone", "A type of column"], explanation: "The keystone locks all other stones into position, completing the arch." },
    { question: "If you are facing North and turn 180 degrees, which direction are you now facing?", answer: "South", distractors: ["East", "West", "North"], explanation: "A 180-degree turn is a complete reversal of direction." },
];

// --- Word Lists for Fluency & Retrieval Games ---
export const generalWordList = ["apple", "car", "house", "river", "mountain", "book", "chair", "music", "light", "ocean", "star", "forest", "fire", "cloud", "dream", "journey", "key", "mirror", "shadow", "silence", "time", "voice", "water", "wind", "world"];
export const mathWordList = ["algebra", "calculus", "geometry", "integer", "prime", "fraction", "decimal", "vertex", "angle", "matrix", "vector", "theorem", "proof", "integral", "derivative"];
export const musicWordList = ["harmony", "melody", "rhythm", "tempo", "chord", "scale", "octave", "clef", "crescendo", "sonata", "fugue", "concerto", "aria", "pitch", "timbre"];
export const verbalWordList = ["metaphor", "irony", "syntax", "phoneme", "morpheme", "paradox", "alliteration", "onomatopoeia", "hyperbole", "prose", "verse", "narrative"];

export const realWords = Array.from(validationWordList);
export const pseudowords = ["flib", "glorp", "wux", "blicket", "zorp", "dax"];
