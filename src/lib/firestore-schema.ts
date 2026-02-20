// This file defines the TypeScript interfaces for our Firestore database documents.
// It serves as a schema and single source of truth for data structures.

/**
 * Represents a single stimulus item in our verbal content database.
 * Stored in Firestore under a collection like /verbal_stimuli/
 */
export interface VerbalStimulusDoc {
  word: string;
  phonemes: string; // IPA representation
  syllables: number;
  root?: string;
  prefix?: string;
  suffix?: string;
  part_of_speech: 'noun' | 'verb' | 'adjective' | 'adverb';
  
  // For difficulty scaling and filtering
  frequency_score: number; // e.g., Log10 frequency from a corpus
  age_appropriateness_band: 'child' | 'teen' | 'adult';
  cultural_specificity_score: number; // 0 (universal) to 1 (highly specific)
  
  // For semantic tasks
  semantic_category?: string[]; // e.g., ["animal", "mammal", "pet"]
  synonyms?: string[];
  antonyms?: string[];
}

/**
 * Represents a log of a single user session for a specific game.
 * Stored in Firestore under a path like /users/{userId}/game_sessions/{sessionId}
 */
export interface UserSessionLogDoc {
  sessionId: string;
  userId: string;
  gameId: string;
  focus: 'neutral' | 'math' | 'music' | 'verbal';
  
  session_start_time: firebase.firestore.Timestamp;
  session_end_time: firebase.firestore.Timestamp;
  
  start_level: number;
  end_level: number;
  
  total_trials: number;
  correct_trials: number;
  accuracy: number; // correct_trials / total_trials
  
  average_rt_ms: number; // Average reaction time for correct trials
  
  // Optional: A summary of difficulty parameters for this session
  difficulty_summary?: {
    mechanic_config: any;
    content_config: any;
  };
}
