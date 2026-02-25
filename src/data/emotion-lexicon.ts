
export type EmotionCluster =
  | 'joy'
  | 'sadness'
  | 'anger'
  | 'fear'
  | 'surprise'
  | 'disgust'
  | 'love'
  | 'pride'
  | 'shame'
  | 'calm';

export type EmotionLexiconEntry = {
  lemma: string;
  cluster: EmotionCluster;
  valence: 'positive' | 'negative' | 'neutral';
  arousal: 'high' | 'low';
};

// A mapping of words to their emotion metadata.
// In a real app, this would be a much larger dataset (>500 terms).
export const emotionLexicon: Record<string, EmotionLexiconEntry> = {
  // Joy Cluster
  happy: { lemma: 'happy', cluster: 'joy', valence: 'positive', arousal: 'high' },
  happiness: { lemma: 'happy', cluster: 'joy', valence: 'positive', arousal: 'high' },
  joy: { lemma: 'joy', cluster: 'joy', valence: 'positive', arousal: 'high' },
  joyful: { lemma: 'joy', cluster: 'joy', valence: 'positive', arousal: 'high' },
  elated: { lemma: 'elated', cluster: 'joy', valence: 'positive', arousal: 'high' },
  elation: { lemma: 'elated', cluster: 'joy', valence: 'positive', arousal: 'high' },
  ecstatic: { lemma: 'ecstatic', cluster: 'joy', valence: 'positive', arousal: 'high' },
  ecstasy: { lemma: 'ecstatic', cluster: 'joy', valence: 'positive', arousal: 'high' },
  cheerful: { lemma: 'cheerful', cluster: 'joy', valence: 'positive', arousal: 'low' },
  pleased: { lemma: 'pleased', cluster: 'joy', valence: 'positive', arousal: 'low' },
  glad: { lemma: 'glad', cluster: 'joy', valence: 'positive', arousal: 'low' },

  // Calm Cluster
  content: { lemma: 'content', cluster: 'calm', valence: 'positive', arousal: 'low' },
  contentment: { lemma: 'content', cluster: 'calm', valence: 'positive', arousal: 'low' },
  satisfied: { lemma: 'satisfied', cluster: 'calm', valence: 'positive', arousal: 'low' },
  calm: { lemma: 'calm', cluster: 'calm', valence: 'positive', arousal: 'low' },
  serene: { lemma: 'serene', cluster: 'calm', valence: 'positive', arousal: 'low' },
  relaxed: { lemma: 'relaxed', cluster: 'calm', valence: 'positive', arousal: 'low' },
  peaceful: { lemma: 'peaceful', cluster: 'calm', valence: 'positive', arousal: 'low' },

  // Sadness Cluster
  sad: { lemma: 'sad', cluster: 'sadness', valence: 'negative', arousal: 'low' },
  sadness: { lemma: 'sad', cluster: 'sadness', valence: 'negative', arousal: 'low' },
  unhappy: { lemma: 'sad', cluster: 'sadness', valence: 'negative', arousal: 'low' },
  sorrow: { lemma: 'sorrow', cluster: 'sadness', valence: 'negative', arousal: 'low' },
  grief: { lemma: 'grief', cluster: 'sadness', valence: 'negative', arousal: 'high' },
  grieving: { lemma: 'grief', cluster: 'sadness', valence: 'negative', arousal: 'high' },
  depressed: { lemma: 'depressed', cluster: 'sadness', valence: 'negative', arousal: 'low' },
  miserable: { lemma: 'miserable', cluster: 'sadness', valence: 'negative', arousal: 'low' },
  melancholy: { lemma: 'melancholy', cluster: 'sadness', valence: 'negative', arousal: 'low' },
  disappointed: { lemma: 'disappointed', cluster: 'sadness', valence: 'negative', arousal: 'low' },

  // Anger Cluster
  angry: { lemma: 'angry', cluster: 'anger', valence: 'negative', arousal: 'high' },
  anger: { lemma: 'angry', cluster: 'anger', valence: 'negative', arousal: 'high' },
  furious: { lemma: 'furious', cluster: 'anger', valence: 'negative', arousal: 'high' },
  fury: { lemma: 'furious', cluster: 'anger', valence: 'negative', arousal: 'high' },
  irate: { lemma: 'irate', cluster: 'anger', valence: 'negative', arousal: 'high' },
  enraged: { lemma: 'enraged', cluster: 'anger', valence: 'negative', arousal: 'high' },
  annoyed: { lemma: 'annoyed', cluster: 'anger', valence: 'negative', arousal: 'low' },
  annoyance: { lemma: 'annoyed', cluster: 'anger', valence: 'negative', arousal: 'low' },
  irritated: { lemma: 'irritated', cluster: 'anger', valence: 'negative', arousal: 'low' },
  frustrated: { lemma: 'frustrated', cluster: 'anger', valence: 'negative', arousal: 'low' },

  // Fear Cluster
  fear: { lemma: 'fear', cluster: 'fear', valence: 'negative', arousal: 'high' },
  scared: { lemma: 'scared', cluster: 'fear', valence: 'negative', arousal: 'high' },
  afraid: { lemma: 'afraid', cluster: 'fear', valence: 'negative', arousal: 'high' },
  terrified: { lemma: 'terrified', cluster: 'fear', valence: 'negative', arousal: 'high' },
  anxious: { lemma: 'anxious', cluster: 'fear', valence: 'negative', arousal: 'low' },
  anxiety: { lemma: 'anxious', cluster: 'fear', valence: 'negative', arousal: 'low' },
  worried: { lemma: 'worried', cluster: 'fear', valence: 'negative', arousal: 'low' },
  worry: { lemma: 'worried', cluster: 'fear', valence: 'negative', arousal: 'low' },
  nervous: { lemma: 'nervous', cluster: 'fear', valence: 'negative', arousal: 'low' },

  // Surprise Cluster
  surprised: { lemma: 'surprised', cluster: 'surprise', valence: 'neutral', arousal: 'high' },
  surprise: { lemma: 'surprised', cluster: 'surprise', valence: 'neutral', arousal: 'high' },
  shocked: { lemma: 'shocked', cluster: 'surprise', valence: 'negative', arousal: 'high' },
  shock: { lemma: 'shocked', cluster: 'surprise', valence: 'negative', arousal: 'high' },
  astonished: { lemma: 'astonished', cluster: 'surprise', valence: 'positive', arousal: 'high' },
  amazed: { lemma: 'amazed', cluster: 'surprise', valence: 'positive', arousal: 'high' },
  awe: { lemma: 'awe', cluster: 'surprise', valence: 'positive', arousal: 'high' },

  // Shame/Embarrassment Cluster
  shame: { lemma: 'shame', cluster: 'shame', valence: 'negative', arousal: 'low' },
  ashamed: { lemma: 'shame', cluster: 'shame', valence: 'negative', arousal: 'low' },
  embarrassed: { lemma: 'embarrassed', cluster: 'shame', valence: 'negative', arousal: 'low' },
  embarrassment: { lemma: 'embarrassed', cluster: 'shame', valence: 'negative', arousal: 'low' },
  guilt: { lemma: 'guilt', cluster: 'shame', valence: 'negative', arousal: 'low' },
  guilty: { lemma: 'guilt', cluster: 'shame', valence: 'negative', arousal: 'low' },
  remorse: { lemma: 'remorse', cluster: 'shame', valence: 'negative', arousal: 'low' },

  // Pride Cluster
  pride: { lemma: 'pride', cluster: 'pride', valence: 'positive', arousal: 'high' },
  proud: { lemma: 'pride', cluster: 'pride', valence: 'positive', arousal: 'high' },

  // Love Cluster
  love: { lemma: 'love', cluster: 'love', valence: 'positive', arousal: 'high' },
  adoration: { lemma: 'adoration', cluster: 'love', valence: 'positive', arousal: 'high' },
  affection: { lemma: 'affection', cluster: 'love', valence: 'positive', arousal: 'low' },

  // Disgust Cluster
  disgust: { lemma: 'disgust', cluster: 'disgust', valence: 'negative', arousal: 'low' },
  disgusted: { lemma: 'disgust', cluster: 'disgust', valence: 'negative', arousal: 'low' },
  revulsion: { lemma: 'revulsion', cluster: 'disgust', valence: 'negative', arousal: 'high' },

  // Loanword Examples
  schadenfreude: { lemma: 'schadenfreude', cluster: 'joy', valence: 'negative', arousal: 'low' },
  ennui: { lemma: 'ennui', cluster: 'sadness', valence: 'negative', arousal: 'low' },
};
