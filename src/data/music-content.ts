
// This file acts as a mock database for music-related content,
// simulating what would be stored in a production Firestore collection.

// --- 1. Music Theory Knowledge Questions (for Gc) ---
export const musicTheoryQuestions = [
  // Level 1: Basic Definitions
  {
    id: 'gcm-music-def-01', level: 1,
    question: "What does 'piano' (p) mean in musical dynamics?",
    options: ["Loud", "Soft", "Medium", "Fast"],
    answer: "Soft",
    explanation: "'Piano' is Italian for 'soft' or 'quiet'."
  },
  {
    id: 'gcm-music-def-02', level: 1,
    question: "How many beats does a whole note typically get in 4/4 time?",
    options: ["1", "2", "3", "4"],
    answer: "4",
    explanation: "In 4/4 time, a whole note lasts for the entire measure of four beats."
  },
  {
    id: 'gcm-music-def-03', level: 1,
    question: "Which of these instruments belongs to the brass family?",
    options: ["Flute", "Violin", "Trumpet", "Clarinet"],
    answer: "Trumpet",
    explanation: "Brass instruments produce sound by vibrating the lips into a mouthpiece."
  },

  // Level 2: Intermediate Concepts
  {
    id: 'gcm-music-prop-01', level: 2,
    question: "A C major chord is made of which three notes?",
    options: ["C, D, E", "C, E, G", "C, F, G", "C, E, A"],
    answer: "C, E, G",
    explanation: "A major chord is built from the root (C), a major third (E), and a perfect fifth (G)."
  },
  {
    id: 'gcm-music-prop-02', level: 2,
    question: "What does a 'sharp' (♯) symbol do to a note?",
    options: ["Makes it longer", "Makes it shorter", "Raises its pitch by a half step", "Lowers its pitch by a half step"],
    answer: "Raises its pitch by a half step",
    explanation: "Conversely, a flat (♭) lowers the pitch by a half step."
  },

  // Level 3: Advanced Theory & Analysis
  {
    id: 'gcm-music-ana-01', level: 3,
    question: "In harmony, what is the function of a 'dominant' chord (V)?",
    options: ["To create a sense of rest and finality", "To provide a soft, gentle feeling", "To create tension that wants to resolve to the tonic", "To act as a bridge between sections"],
    answer: "To create tension that wants to resolve to the tonic",
    explanation: "The V-I (dominant to tonic) cadence is the strongest and most common harmonic resolution in Western music."
  },
  {
    id: 'gcm-music-ana-02', level: 3,
    question: "Which musical form is typically structured as A-B-A?",
    options: ["Sonata Form", "Ternary Form", "Rondo Form", "Binary Form"],
    answer: "Ternary Form",
    explanation: "Ternary form consists of an opening section (A), a contrasting section (B), and a return to the opening section's material (A)."
  }
];
