
// This file defines the ideal Firestore schema for verbal content.

/**
 * Represents a single word or concept in the verbal database.
 */
export interface VerbalStimulus {
  id: string; // The word itself, lowercased, e.g., "happiness"
  word: string; // The display word, e.g., "Happiness"
  ipa?: string; // International Phonetic Alphabet representation
  syllables: number;
  root?: string; // e.g., "happy"
  prefix?: string;
  suffix?: string; // e.g., "-ness"
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb';
  
  // For semantic network tasks (Glr, Gc)
  semantic_category: string[]; // e.g., ["emotion", "state_of_being"]
  
  // For difficulty scaling
  frequency_score: number; // Logarithmic frequency score (e.g., from a corpus like COCA)
  
  // For accessibility and bias control
  cultural_specificity: 'universal' | 'regional_us' | 'regional_uk' | 'idiom';
  age_appropriateness: 'child' | 'teen' | 'adult';
}

/**
 * Represents a log of a user's training session for a single game.
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
  
  // Detailed trial data
  trials: {
    level: number;
    correct: boolean;
    rt: number;
    stimulus?: any; // The stimulus presented
    response?: any; // The user's response
  }[];
}
