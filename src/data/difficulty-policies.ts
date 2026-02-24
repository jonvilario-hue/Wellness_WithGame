
import type { DifficultyPolicy, GameId } from "@/types";

const policies: Partial<Record<GameId, DifficultyPolicy>> = {
  gwm_dynamic_sequence: {
    gameId: "gwm_dynamic_sequence",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.8,
    targetAccuracyLow: 0.6,
    levelMap: {
      1: { 
        mechanic_config: { sequenceLength: 3, displayTimeMs: 2000, visualDisplayTimeMs: 1000 }, 
        content_config: { 
          neutral: { params: { charSet: "alpha" } }, 
          math: { params: { charSet: "numeric" } }, 
          music: { sub_variant: 'complex_span', params: { melody_length: 3, note_palette_size: 5, distractor_difficulty: 'major_minor' } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_distinct' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '2d', itemCount: 2 } }
        } 
      },
      2: { 
        mechanic_config: { sequenceLength: 4, displayTimeMs: 2000, visualDisplayTimeMs: 1200 }, 
        content_config: { 
          neutral: { params: { charSet: "alpha" } }, 
          math: { params: { charSet: "numeric" } }, 
          music: { sub_variant: 'complex_span', params: { melody_length: 3, note_palette_size: 6, distractor_difficulty: 'major_minor' } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_distinct' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '2d', itemCount: 3 } }
        } 
      },
      3: { 
        mechanic_config: { sequenceLength: 4, displayTimeMs: 1800, visualDisplayTimeMs: 1200 }, 
        content_config: { 
          neutral: { params: { charSet: "alphanumeric" } }, 
          math: { params: { charSet: "numeric_ops" } }, 
          music: { sub_variant: 'complex_span', params: { melody_length: 4, note_palette_size: 6, distractor_difficulty: 'major_minor' } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_similar' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '3d', itemCount: 3 } }
        } 
      },
      4: { 
        mechanic_config: { sequenceLength: 5, displayTimeMs: 1800, visualDisplayTimeMs: 1500 }, 
        content_config: { 
          neutral: { params: { charSet: "alphanumeric" } }, 
          math: { params: { charSet: "numeric_ops" } }, 
          music: { sub_variant: 'complex_span', params: { melody_length: 4, note_palette_size: 7, distractor_difficulty: 'major_minor' } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_similar' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '3d', itemCount: 4 } }
        } 
      },
      5: { 
        mechanic_config: { sequenceLength: 5, displayTimeMs: 1500, visualDisplayTimeMs: 1500 }, 
        content_config: { 
          neutral: { params: { charSet: "alphanumeric" } }, 
          math: { params: { charSet: "numeric_ops" } }, 
          music: { sub_variant: 'complex_span', params: { melody_length: 5, note_palette_size: 7, distractor_difficulty: 'augmented_diminished' } },
          verbal: { sub_variant: 'grammatical_recall', params: { error_type: 'tense' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '3d', itemCount: 4, distractors: true } }
        } 
      },
      6: { 
        mechanic_config: { sequenceLength: 6, displayTimeMs: 1500, visualDisplayTimeMs: 1800 }, 
        content_config: { 
            neutral: {}, math: {}, 
            music: { sub_variant: 'complex_span', params: { melody_length: 5, note_palette_size: 8, distractor_difficulty: 'augmented_diminished' } },
            verbal: { sub_variant: 'sentence_unscramble'}, spatial: {} 
        } 
      },
      7: { 
        mechanic_config: { sequenceLength: 6, displayTimeMs: 1200, visualDisplayTimeMs: 1800 }, 
        content_config: { 
            neutral: {}, math: {}, 
            music: { sub_variant: 'complex_span', params: { melody_length: 6, note_palette_size: 8, distractor_difficulty: 'augmented_diminished' } },
            verbal: {}, spatial: {} 
        } 
      },
      8: { 
        mechanic_config: { sequenceLength: 7, displayTimeMs: 1200, visualDisplayTimeMs: 2100 }, 
        content_config: { 
            neutral: {}, math: {}, 
            music: { sub_variant: 'complex_span', params: { melody_length: 6, note_palette_size: 9, distractor_difficulty: 'seventh_chords' } },
            verbal: {}, spatial: {} 
        } 
      },
      9: { 
        mechanic_config: { sequenceLength: 7, displayTimeMs: 1000, visualDisplayTimeMs: 2100 }, 
        content_config: { 
            neutral: {}, math: {}, 
            music: { sub_variant: 'complex_span', params: { melody_length: 7, note_palette_size: 9, distractor_difficulty: 'seventh_chords' } },
            verbal: {}, spatial: {} 
        } 
      },
      10: { 
        mechanic_config: { sequenceLength: 8, displayTimeMs: 1000, visualDisplayTimeMs: 2400 }, 
        content_config: { 
            neutral: {}, math: {}, 
            music: { sub_variant: 'dual_n_back', params: { n_back: 1, pitch_palette_size: 4, timbre_palette: ['sine', 'square', 'sawtooth'], isi_ms: 2500, target_probability: 0.25 } },
            verbal: {}, spatial: {} 
        } 
      },
       11: { mechanic_config: {}, content_config: { music: { sub_variant: 'dual_n_back', params: { n_back: 2, pitch_palette_size: 4, timbre_palette: ['sine', 'square', 'sawtooth'], isi_ms: 2500, target_probability: 0.25 } } } },
       12: { mechanic_config: {}, content_config: { music: { sub_variant: 'dual_n_back', params: { n_back: 2, pitch_palette_size: 5, timbre_palette: ['sine', 'square', 'sawtooth'], isi_ms: 2200, target_probability: 0.25 } } } },
       13: { mechanic_config: {}, content_config: { music: { sub_variant: 'dual_n_back', params: { n_back: 2, pitch_palette_size: 5, timbre_palette: ['sine', 'square', 'sawtooth', 'triangle'], isi_ms: 2200, target_probability: 0.25 } } } },
       14: { mechanic_config: {}, content_config: { music: { sub_variant: 'dual_n_back', params: { n_back: 3, pitch_palette_size: 5, timbre_palette: ['sine', 'square', 'sawtooth', 'triangle'], isi_ms: 2000, target_probability: 0.25 } } } },
       15: { mechanic_config: {}, content_config: { music: { sub_variant: 'dual_n_back', params: { n_back: 3, pitch_palette_size: 6, timbre_palette: ['sine', 'square', 'sawtooth', 'triangle'], isi_ms: 2000, target_probability: 0.20 } } } },
    }
  },
  gs_rapid_code: {
    gameId: "gs_rapid_code",
    sessionLength: 30,
    windowSize: 20,
    targetAccuracyHigh: 0.90,
    targetAccuracyLow: 0.70,
    levelMap: {
      1: { mechanic_config: { responseWindowMs: 6000, distractorCount: 2 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "parity" } }, music: { sub_variant: 'rhythm_compare', params: { types: ['simple_duple'], isSameProbability: 0.5 } }, verbal: { sub_variant: 'lexical_decision', params: { word_length: 4, frequency_min: 7 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'cardinal' }} } },
      2: { mechanic_config: { responseWindowMs: 5500, distractorCount: 2 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "sign" } }, music: { sub_variant: 'rhythm_compare', params: { types: ['simple_duple'], isSameProbability: 0.5 } }, verbal: { sub_variant: 'synonym_match', params: { word_length: 4, frequency_min: 7 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'cardinal' }} } },
      3: { mechanic_config: { responseWindowMs: 5000, distractorCount: 3 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "parity" } }, music: { sub_variant: 'rhythm_compare', params: { types: ['simple_compound'], isSameProbability: 0.5 } }, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'any' }} } },
      4: { mechanic_config: { responseWindowMs: 4500, distractorCount: 3 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "magnitude", threshold: 5 } }, music: { sub_variant: 'rhythm_compare', params: { types: ['simple_compound'], isSameProbability: 0.5 } }, verbal: { sub_variant: 'lexical_decision', params: { word_length: 5, frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'any', mirror: true }} } },
      5: { mechanic_config: { responseWindowMs: 4000, distractorCount: 4 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "perceptual_judgment", params: { type: "sign" } }, music: { sub_variant: 'rhythm_compare', params: { types: ['syncopated'], isSameProbability: 0.5 } }, verbal: { sub_variant: 'synonym_match', params: { word_length: 5, frequency_min: 6 } }, spatial: { sub_variant: 'target_interception', params: { speed: 1, prediction: false }} } },
      6: { mechanic_config: { responseWindowMs: 3500, distractorCount: 4 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "perceptual_judgment", params: { type: "parity" } }, music: { sub_variant: 'rhythm_compare', params: { types: ['syncopated'], isSameProbability: 0.5 } }, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 5 } }, spatial: { sub_variant: 'target_interception', params: { speed: 1.2, prediction: true }} } },
      7: { mechanic_config: { responseWindowMs: 3000, distractorCount: 5 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "perceptual_judgment", params: { type: "magnitude", threshold: 5 } }, music: {}, verbal: {}, spatial: {} } },
      8: { mechanic_config: { responseWindowMs: 2800, distractorCount: 5 }, content_config: { neutral: { params: { complexity: "complex" } }, math: {}, music: {}, verbal: {}, spatial: {} } },
      9: { mechanic_config: { responseWindowMs: 2500, distractorCount: 6 }, content_config: { neutral: { params: { complexity: "complex" } }, math: {}, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { responseWindowMs: 2200, distractorCount: 6 }, content_config: { neutral: { params: { complexity: "complex" } }, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  },
  gf_pattern_matrix: {
    gameId: "gf_pattern_matrix",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { gridSize: "2x2", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape" } }, math: { sub_variant: "deterministic", params: { rule: "arithmetic_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'transposition', complexity: 1 } }, verbal: { sub_variant: 'morphological_analogy', params: { type: "pseudo_word" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part' }} } },
      2: { mechanic_config: { gridSize: "2x2", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "color" } }, math: { sub_variant: "deterministic", params: { rule: "geometric_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'transposition', complexity: 2 } }, verbal: { sub_variant: 'morphological_analogy', params: { type: "pseudo_word" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part_and_rotate' }} } },
      3: { mechanic_config: { gridSize: "3x3", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape" } }, math: { sub_variant: "deterministic", params: { rule: "arithmetic_sequence" } }, music: { sub_variant: 'rhythmic_pattern', params: { rule: 'augmentation', complexity: 1 } }, verbal: { sub_variant: 'morphological_analogy', params: { type: "pseudo_word" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part' }} } },
      4: { mechanic_config: { gridSize: "3x3", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "color" } }, math: { sub_variant: "deterministic", params: { rule: "geometric_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'inversion', complexity: 2 } }, verbal: { sub_variant: 'morphological_analogy', params: { type: "pseudo_word" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part_and_rotate' }} } },
      5: { mechanic_config: { gridSize: "2x2", distractor_similarity: "medium" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color" } }, math: { sub_variant: "probabilistic", params: { samples: 5, populationSize: 30 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'diatonic_progression', complexity: 1 } }, verbal: { sub_variant: 'morphological_analogy', params: { type: "pseudo_word_complex" } }, spatial: { sub_variant: 'vector_logic', params: { rule: 'translation' }} } },
      6: { mechanic_config: { gridSize: "2x2", distractor_similarity: "medium" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      7: { mechanic_config: { gridSize: "3x3", distractor_similarity: "medium" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      8: { mechanic_config: { gridSize: "3x3", distractor_similarity: "medium" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      9: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  },
  gv_visual_lab: {
    gameId: "gv_visual_lab",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.65,
    levelMap: {
      1: { mechanic_config: { distractorCount: 3, responseWindowMs: 5000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: [90, 180, 270] } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 3, maxWeight: 5, equationTerms: 4 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q'], distractorCount: 1 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'compound', complexity: 1 } }, spatial: { sub_variant: 'voxel_jigsaw', params: { pieceCount: 3, complexity: 1 } } } },
      2: { mechanic_config: { distractorCount: 3, responseWindowMs: 4500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: [90, 180, 270] } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 3, maxWeight: 7, equationTerms: 5 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q'], distractorCount: 2 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'compound', complexity: 2 } }, spatial: { sub_variant: 'voxel_jigsaw', params: { pieceCount: 4, complexity: 1 } } } },
      3: { mechanic_config: { distractorCount: 4, responseWindowMs: 4500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free" } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 4, maxWeight: 7, equationTerms: 5 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q'], distractorCount: 2 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'affixes', complexity: 1 } }, spatial: { sub_variant: 'voxel_jigsaw', params: { pieceCount: 4, complexity: 2 } } } },
      4: { mechanic_config: { distractorCount: 4, responseWindowMs: 4000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free" } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 4, maxWeight: 9, equationTerms: 6 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q'], distractorCount: 3 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'affixes', complexity: 2 } }, spatial: { sub_variant: 'proportion_match', params: { distortion: 0.2 } } } },
      5: { mechanic_config: { distractorCount: 4, responseWindowMs: 3500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 5, maxWeight: 9, equationTerms: 6 } }, music: { sub_variant: "spectrogram_match", params: { timbres: ['sine', 'square'], distractorCount: 3 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 5, target_length: 3 } }, spatial: { sub_variant: 'proportion_match', params: { distortion: 0.1 } } } },
      6: { mechanic_config: { distractorCount: 4, responseWindowMs: 3000 }, content_config: { neutral: {}, math: { sub_variant: "balance_puzzle", params: { shapeCount: 5, maxWeight: 12, equationTerms: 7 } }, music: {}, verbal: {}, spatial: {} } },
    }
  },
  ga_auditory_lab: {
    gameId: "ga_auditory_lab",
    sessionLength: 20,
    windowSize: 15,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.65,
    levelMap: {
        1: { mechanic_config: {}, content_config: { music: { sub_variant: 'auditory_flanker', params: { flanker_detune_cents: 200, flanker_gain_relative: 0.6, incongruent_ratio: 0.5 } } } },
        2: { mechanic_config: {}, content_config: { music: { sub_variant: 'auditory_flanker', params: { flanker_detune_cents: 150, flanker_gain_relative: 0.65, incongruent_ratio: 0.5 } } } },
        3: { mechanic_config: {}, content_config: { music: { sub_variant: 'auditory_flanker', params: { flanker_detune_cents: 100, flanker_gain_relative: 0.7, incongruent_ratio: 0.5 } } } },
        4: { mechanic_config: {}, content_config: { music: { sub_variant: 'auditory_flanker', params: { flanker_detune_cents: 75, flanker_gain_relative: 0.75, incongruent_ratio: 0.5 } } } },
        5: { mechanic_config: {}, content_config: { music: { sub_variant: 'auditory_flanker', params: { flanker_detune_cents: 50, flanker_gain_relative: 0.8, incongruent_ratio: 0.5 } } } },
        6: { mechanic_config: {}, content_config: { music: { sub_variant: 'auditory_flanker', params: { flanker_detune_cents: 40, flanker_gain_relative: 0.85, incongruent_ratio: 0.5 } } } },
        7: { mechanic_config: {}, content_config: { music: { sub_variant: 'auditory_flanker', params: { flanker_detune_cents: 30, flanker_gain_relative: 0.9, incongruent_ratio: 0.5 } } } },
        8: { mechanic_config: {}, content_config: { music: { sub_variant: 'auditory_flanker', params: { flanker_detune_cents: 20, flanker_gain_relative: 0.95, incongruent_ratio: 0.5 } } } },
        9: { mechanic_config: {}, content_config: { music: { sub_variant: 'auditory_flanker', params: { flanker_detune_cents: 15, flanker_gain_relative: 1.0, incongruent_ratio: 0.5 } } } },
        10: { mechanic_config: {}, content_config: { music: { sub_variant: 'auditory_flanker', params: { flanker_detune_cents: 10, flanker_gain_relative: 1.0, incongruent_ratio: 0.5 } } } },
    }
  },
  glr_fluency_storm: {
    gameId: "glr_fluency_storm",
    sessionLength: 1, 
    windowSize: 1,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { timeSec: 45, minTarget: 5 }, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 10 } }, neutral: { params: { category: "broad_concrete" } }, music: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 10 } }, verbal: { sub_variant: 'category_sprint', params: { category: 'Animals' } }, spatial: { sub_variant: 'route_retrieval', params: { map_complexity: 1 } } } },
      2: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 15 } }, music: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 15 } } } },
      3: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 15 } }, music: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 15 } } } },
      4: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 20 } }, music: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 20 } } } },
      5: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 20 } }, music: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 20 } } } },
      6: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 25 } }, music: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 25 } } } },
      7: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 7, distractorDuration: 25 } }, music: { sub_variant: 'spaced_retrieval', params: { pairs: 7, distractorDuration: 25 } } } },
      8: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 7, distractorDuration: 30 } }, music: { sub_variant: 'spaced_retrieval', params: { pairs: 7, distractorDuration: 30 } } } },
      9: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 8, distractorDuration: 30 } }, music: { sub_variant: 'spaced_retrieval', params: { pairs: 8, distractorDuration: 30 } } } },
      10: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 8, distractorDuration: 35 } }, music: { sub_variant: 'spaced_retrieval', params: { pairs: 8, distractorDuration: 35 } } } },
    }
  },
  gc_verbal_inference: {
    gameId: "gc_verbal_inference",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } }, neutral: { sub_variant: "analogy", params: { word_rarity: 1000 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { word_rarity: 'common' } }, spatial: { sub_variant: 'spatial_lexicon', params: { type: 'preposition' } } } },
      2: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } } } },
      3: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } } } },
      4: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } } } },
      5: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } } } },
      6: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } } } },
      7: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } } } },
      8: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 4 } } } },
      9: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 4 } } } },
      10: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 4 } } } },
    }
  },
  ef_focus_switch: {
    gameId: "ef_focus_switch",
    sessionLength: 30,
    windowSize: 20,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.68,
    levelMap: {
      1: { mechanic_config: { switchProbability: 0.2, noGo: false, responseWindowMs: 3000 }, content_config: { neutral: { params: { ruleCount: 2, cueType: "explicit_text" } }, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'task_switching', params: { csi_ms: 1200, high_pitch_hz: 880, low_pitch_hz: 440, long_duration_ms: 700, short_duration_ms: 300 } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category'], switch_interval: 10 } }, spatial: { sub_variant: 'perspective_shift', params: { cue: 'explicit' } } } },
      2: { mechanic_config: { switchProbability: 0.2, responseWindowMs: 2800 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'task_switching', params: { csi_ms: 1100, high_pitch_hz: 880, low_pitch_hz: 440, long_duration_ms: 700, short_duration_ms: 300 } } } },
      3: { mechanic_config: { switchProbability: 0.25, responseWindowMs: 2800 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'task_switching', params: { csi_ms: 1000, high_pitch_hz: 784, low_pitch_hz: 440, long_duration_ms: 650, short_duration_ms: 350 } } } },
      4: { mechanic_config: { switchProbability: 0.25, responseWindowMs: 2500 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'task_switching', params: { csi_ms: 900, high_pitch_hz: 784, low_pitch_hz: 440, long_duration_ms: 650, short_duration_ms: 350 } } } },
      5: { mechanic_config: { switchProbability: 0.3, responseWindowMs: 2500 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'task_switching', params: { csi_ms: 800, high_pitch_hz: 698, low_pitch_hz: 440, long_duration_ms: 600, short_duration_ms: 400 } } } },
      6: { mechanic_config: { switchProbability: 0.3, responseWindowMs: 2200 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'task_switching', params: { csi_ms: 700, high_pitch_hz: 698, low_pitch_hz: 440, long_duration_ms: 600, short_duration_ms: 400 } } } },
      7: { mechanic_config: { switchProbability: 0.35, responseWindowMs: 2200 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'task_switching', params: { csi_ms: 600, high_pitch_hz: 659, low_pitch_hz: 440, long_duration_ms: 550, short_duration_ms: 450 } } } },
      8: { mechanic_config: { switchProbability: 0.35, responseWindowMs: 2000 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'task_switching', params: { csi_ms: 500, high_pitch_hz: 659, low_pitch_hz: 440, long_duration_ms: 550, short_duration_ms: 450 } } } },
      9: { mechanic_config: { switchProbability: 0.4, responseWindowMs: 1800 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'task_switching', params: { csi_ms: 400, high_pitch_hz: 587, low_pitch_hz: 440, long_duration_ms: 500, short_duration_ms: 500 } } } },
      10: { mechanic_config: { switchProbability: 0.4, responseWindowMs: 1800 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'task_switching', params: { csi_ms: 400, high_pitch_hz: 587, low_pitch_hz: 440, long_duration_ms: 500, short_duration_ms: 500 } } } },
    }
  }
};

export const difficultyPolicies = policies as Record<GameId, DifficultyPolicy>;
