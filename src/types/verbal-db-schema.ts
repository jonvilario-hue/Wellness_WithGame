// This file defines the TypeScript interfaces for our verbal content database.
// It serves as a schema and single source of truth for data structures,
// simulating what would be stored in a production Firestore database.

/**
 * Represents a single word/concept in the verbal stimulus database.
 * This structured data allows for dynamic, difficulty-scaled stimulus generation.
 */
export interface VerbalStimulus {
  id: string; // The word itself, lowercased, e.g., "happiness"
  word: string; // The display word, e.g., "Happiness"
  ipa?: string; // International Phonetic Alphabet representation
  syllables: number;
  root?: string; // e.g., "happy"
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb';
  
  // For semantic network tasks (Glr, Gc)
  semantic_category: string[]; // e.g., ["emotion", "state_of_being"]
  
  // For difficulty scaling
  frequency_score: number; // Logarithmic frequency score (e.g., from a corpus)
  
  // For accessibility and bias control
  cultural_specificity: 'universal' | 'regional_us' | 'regional_uk' | 'idiom';
  age_appropriateness: 'child' | 'teen' | 'adult';
}

/**
 * Represents a log of a user's training session for a single game.
 * This is the structure that would be saved to a user's subcollection in Firestore.
 */
export interface UserSessionLog {
  sessionId: string; // Unique ID for this session
  userId: string;
  gameId: string;
  focus: 'neutral' | 'math' | 'music' | 'verbal';
  sessionVariant?: string; // e.g., "homophone_hunter" for Gs game
  timestamp: any; // Firestore Server Timestamp

  startLevel: number;
  endLevel: number;
  
  // Aggregate performance metrics for the session
  accuracy: number; // Overall % correct
  medianRT: number; // Median reaction time for correct trials
  totalTrials: number;
  
  // Detailed trial data for deep analysis
  trials: {
    level: number;
    correct: boolean;
    rt: number;
    stimulus?: any; // The stimulus presented (e.g., {word: 'cat'})
    response?: any; // The user's response
  }[];
}