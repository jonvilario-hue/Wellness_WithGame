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
   {
    id: 'gcm-music-def-04', level: 1,
    question: "What is the name for the five horizontal lines on which notes are written?",
    options: ["Scale", "Chord", "Staff", "Clef"],
    answer: "Staff",
    explanation: "The staff is the fundamental framework of musical notation."
  },
   {
    id: 'gcm-music-def-05', level: 1,
    question: "What does 'forte' (f) mean in musical dynamics?",
    options: ["Soft", "Loud", "Slow", "Getting faster"],
    answer: "Loud",
    explanation: "'Forte' is Italian for 'loud' or 'strong'."
  },
  {
    id: 'gcm-music-def-06', level: 1,
    question: "What is the term for the speed of a piece of music?",
    options: ["Tempo", "Rhythm", "Meter", "Key"],
    answer: "Tempo",
    explanation: "Tempo, from the Italian word for 'time', dictates how fast or slow the music should be played."
  },
  {
    id: 'gcm-music-def-07', level: 1,
    question: "Which of these is a percussion instrument?",
    options: ["Viola", "Oboe", "Timpani", "Harp"],
    answer: "Timpani",
    explanation: "Timpani, or kettledrums, are large drums that are part of the percussion section of an orchestra."
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
  {
    id: 'gcm-music-prop-03', level: 2,
    question: "What does the time signature 3/4 mean?",
    options: ["Three beats per measure, quarter note gets one beat", "Four beats per measure, third note gets one beat", "Three notes per song", "Fast tempo"],
    answer: "Three beats per measure, quarter note gets one beat",
    explanation: "The top number is beats per measure; the bottom number is which note value gets one beat."
  },
  {
    id: 'gcm-music-prop-04', level: 2,
    question: "What is an 'octave'?",
    options: ["A type of rhythm", "A chord with three notes", "The interval between a note and another with double the frequency", "A very loud passage"],
    answer: "The interval between a note and another with double the frequency",
    explanation: "For example, the interval from one C on a piano to the next C is an octave."
  },
   {
    id: 'gcm-music-prop-05', level: 2,
    question: "Which of these describes a 'minor' scale or chord?",
    options: ["Happy and bright", "Sad or melancholic", "Loud and powerful", "Slow and flowing"],
    answer: "Sad or melancholic",
    explanation: "Minor keys are often perceived as having a more somber or introspective quality than major keys."
  },
  {
    id: 'gcm-music-prop-06', level: 2,
    question: "What is a 'clef' used for in music notation?",
    options: ["To set the tempo", "To indicate the volume", "To assign specific pitches to the lines and spaces on a staff", "To mark the end of a piece"],
    answer: "To assign specific pitches to the lines and spaces on a staff",
    explanation: "The Treble Clef (G-clef) and Bass Clef (F-clef) are the most common."
  },
  {
    id: 'gcm-music-prop-07', level: 2,
    question: "An arpeggio is when the notes of a chord are played...",
    options: ["All at the same time", "Very loudly", "In sequence, one after the other", "Backwards"],
    answer: "In sequence, one after the other",
    explanation: "Playing a chord's notes successively rather than simultaneously is called an arpeggio or a 'broken chord'."
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
  },
  {
    id: 'gcm-music-ana-03', level: 3,
    question: "What is 'counterpoint'?",
    options: ["Playing a melody backwards", "The relationship between two or more independent melodic lines", "A very fast tempo", "A type of percussion instrument"],
    answer: "The relationship between two or more independent melodic lines",
    explanation: "Counterpoint is a key feature of Baroque music, especially in the works of J.S. Bach."
  },
  {
    id: 'gcm-music-ana-04', level: 3,
    question: "A 'perfect fifth' is an interval spanning how many semitones?",
    options: ["5", "6", "7", "8"],
    answer: "7",
    explanation: "For example, from C to G there are 7 half-steps (C#, D, D#, E, F, F#, G)."
  },
  {
    id: 'gcm-music-ana-05', level: 3,
    question: "What is a 'syncopated' rhythm?",
    options: ["A very slow and steady rhythm", "A rhythm that is always the same", "A rhythm that emphasizes off-beats or weak beats", "A rhythm played only by drums"],
    answer: "A rhythm that emphasizes off-beats or weak beats",
    explanation: "Syncopation is a defining characteristic of genres like jazz, funk, and ragtime."
  },
  {
    id: 'gcm-music-ana-06', level: 3,
    question: "In a major scale, which scale degree is the 'subdominant'?",
    options: ["The third", "The fourth", "The fifth", "The seventh"],
    answer: "The fourth",
    explanation: "The subdominant (IV) is a pre-dominant chord that often leads to the dominant (V)."
  },
  {
    id: 'gcm-music-ana-07', level: 3,
    question: "What does 'a cappella' mean?",
    options: ["With a small orchestra", "Gradually getting slower", "To be played by a solo instrument", "Vocal music without instrumental accompaniment"],
    answer: "Vocal music without instrumental accompaniment",
    explanation: "The term is Italian for 'in the manner of the chapel'."
  },
];
