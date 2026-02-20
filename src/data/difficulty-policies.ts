
import type { DifficultyPolicy, GameId } from "@/types";

const policies: Record<GameId, DifficultyPolicy> = {
  gwm_dynamic_sequence: {
    gameId: "gwm_dynamic_sequence",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.65,
    levelMap: {
      1: { 
        mechanic_config: { sequenceLength: 3, displayTimeMs: 2000, visualDisplayTimeMs: 1000 }, 
        content_config: { 
          neutral: { params: { charSet: "alpha" } }, 
          math: { params: { charSet: "numeric" } }, 
          music: { sub_variant: 'sequence_recall', params: { charSet: "notes", complexity: 1 } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_distinct' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '2d', itemCount: 2 } }
        } 
      },
      2: { 
        mechanic_config: { sequenceLength: 4, displayTimeMs: 2000, visualDisplayTimeMs: 1200 }, 
        content_config: { 
          neutral: { params: { charSet: "alpha" } }, 
          math: { params: { charSet: "numeric" } }, 
          music: { sub_variant: 'sequence_recall', params: { charSet: "notes", complexity: 1 } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_distinct' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '2d', itemCount: 3 } }
        } 
      },
      3: { 
        mechanic_config: { sequenceLength: 4, displayTimeMs: 1800, visualDisplayTimeMs: 1200 }, 
        content_config: { 
          neutral: { params: { charSet: "alphanumeric" } }, 
          math: { params: { charSet: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['quarter'], complexity: 2 } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_similar' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '3d', itemCount: 3 } }
        } 
      },
      4: { 
        mechanic_config: { sequenceLength: 5, displayTimeMs: 1800, visualDisplayTimeMs: 1500 }, 
        content_config: { 
          neutral: { params: { charSet: "alphanumeric" } }, 
          math: { params: { charSet: "numeric_ops" } }, 
          music: { sub_variant: 'sequence_recall', params: { charSet: "notes_symbols", complexity: 2 } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_similar' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '3d', itemCount: 4 } }
        } 
      },
      5: { 
        mechanic_config: { sequenceLength: 5, displayTimeMs: 1500, visualDisplayTimeMs: 1500 }, 
        content_config: { 
          neutral: { params: { charSet: "alphanumeric" } }, 
          math: { params: { charSet: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['quarter', 'eighth'], complexity: 3 } },
          verbal: { sub_variant: 'grammatical_recall', params: { error_type: 'tense' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '3d', itemCount: 4, distractors: true } }
        } 
      },
      // Levels 6-20 follow the same pattern of increasing mechanic and content complexity
      6: { mechanic_config: { sequenceLength: 6, displayTimeMs: 1500, visualDisplayTimeMs: 1800 }, content_config: { neutral: {}, math: {}, music: { sub_variant: 'sentence_unscramble'}, verbal: { sub_variant: 'sentence_unscramble'}, spatial: {} } },
      7: { mechanic_config: { sequenceLength: 6, displayTimeMs: 1200, visualDisplayTimeMs: 1800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      8: { mechanic_config: { sequenceLength: 7, displayTimeMs: 1200, visualDisplayTimeMs: 2100 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      9: { mechanic_config: { sequenceLength: 7, displayTimeMs: 1000, visualDisplayTimeMs: 2100 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { sequenceLength: 8, displayTimeMs: 1000, visualDisplayTimeMs: 2400 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      11: { mechanic_config: { sequenceLength: 8, displayTimeMs: 900, visualDisplayTimeMs: 2400 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      12: { mechanic_config: { sequenceLength: 9, displayTimeMs: 900, visualDisplayTimeMs: 2700 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      13: { mechanic_config: { sequenceLength: 9, displayTimeMs: 800, visualDisplayTimeMs: 2700 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      14: { mechanic_config: { sequenceLength: 10, displayTimeMs: 800, visualDisplayTimeMs: 3000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      15: { mechanic_config: { sequenceLength: 10, displayTimeMs: 700, visualDisplayTimeMs: 3000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      16: { mechanic_config: { sequenceLength: 11, displayTimeMs: 700, visualDisplayTimeMs: 3300 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      17: { mechanic_config: { sequenceLength: 11, displayTimeMs: 600, visualDisplayTimeMs: 3300 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      18: { mechanic_config: { sequenceLength: 12, displayTimeMs: 600, visualDisplayTimeMs: 3600 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      19: { mechanic_config: { sequenceLength: 12, displayTimeMs: 500, visualDisplayTimeMs: 3600 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      20: { mechanic_config: { sequenceLength: 12, displayTimeMs: 500, visualDisplayTimeMs: 3600 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  },
  gs_rapid_code: {
    gameId: "gs_rapid_code",
    sessionLength: 40,
    windowSize: 15,
    targetAccuracyHigh: 0.90,
    targetAccuracyLow: 0.70,
    levelMap: {
      1: { mechanic_config: { responseWindowMs: 3000, distractorCount: 3 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 1 } }, music: { sub_variant: 'symbol_match', params: { set: ['treble', 'bass', 'quarter', 'half'] }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 4, frequency_min: 7 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'cardinal' }} } },
      2: { mechanic_config: { responseWindowMs: 2500, distractorCount: 3 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 1 } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'octave'], direction: true }}, verbal: { sub_variant: 'synonym_match', params: { word_length: 4, frequency_min: 7 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'cardinal' }} } },
      3: { mechanic_config: { responseWindowMs: 2500, distractorCount: 4 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 2 } }, music: { sub_variant: 'symbol_match', params: { set: ['treble', 'bass', 'quarter', 'half', 'eighth', 'sharp'] }}, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'any' }} } },
      4: { mechanic_config: { responseWindowMs: 2000, distractorCount: 4 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 2 } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'M3', 'm3'], direction: true }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 5, frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'any', mirror: true }} } },
      5: { mechanic_config: { responseWindowMs: 2000, distractorCount: 5 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 3 } }, music: { sub_variant: 'rhythm_compare', params: { types: ['simple_duple'] }}, verbal: { sub_variant: 'synonym_match', params: { word_length: 5, frequency_min: 6 } }, spatial: { sub_variant: 'target_interception', params: { speed: 1, prediction: false }} } },
      6: { mechanic_config: { responseWindowMs: 1800, distractorCount: 5 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 3 } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'M3', 'm3', 'M6', 'm6'], direction: false }}, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 5 } }, spatial: { sub_variant: 'target_interception', params: { speed: 1.2, prediction: true }} } },
      // Levels 7-20...
      7: { mechanic_config: { responseWindowMs: 1600, distractorCount: 6 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      8: { mechanic_config: { responseWindowMs: 1400, distractorCount: 6 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      9: { mechanic_config: { responseWindowMs: 1200, distractorCount: 7 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { responseWindowMs: 1200, distractorCount: 7 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      11: { mechanic_config: { responseWindowMs: 1000, distractorCount: 8 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      12: { mechanic_config: { responseWindowMs: 900, distractorCount: 8 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      13: { mechanic_config: { responseWindowMs: 800, distractorCount: 9 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      14: { mechanic_config: { responseWindowMs: 700, distractorCount: 9 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      15: { mechanic_config: { responseWindowMs: 600, distractorCount: 9 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      16: { mechanic_config: { responseWindowMs: 500, distractorCount: 9 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      17: { mechanic_config: { responseWindowMs: 450, distractorCount: 9 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      18: { mechanic_config: { responseWindowMs: 400, distractorCount: 9 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      19: { mechanic_config: { responseWindowMs: 350, distractorCount: 9 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      20: { mechanic_config: { responseWindowMs: 300, distractorCount: 9 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  },
  gf_pattern_matrix: {
    gameId: "gf_pattern_matrix",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { gridSize: "2x2", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape" } }, math: { sub_variant: "deterministic", params: { rule: "arithmetic_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'transposition', complexity: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { word_rarity: "common" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part' }} } },
      2: { mechanic_config: { gridSize: "2x2", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "color" } }, math: { sub_variant: "deterministic", params: { rule: "geometric_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'transposition', complexity: 2 } }, verbal: { sub_variant: 'cloze_deletion', params: { word_rarity: "common" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part_and_rotate' }} } },
      3: { mechanic_config: { gridSize: "3x3", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape" } }, math: { sub_variant: "deterministic", params: { rule: "arithmetic_sequence" } }, music: { sub_variant: 'rhythmic_pattern', params: { rule: 'augmentation', complexity: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { word_rarity: "medium" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part' }} } },
      4: { mechanic_config: { gridSize: "3x3", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "color" } }, math: { sub_variant: "deterministic", params: { rule: "geometric_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'inversion', complexity: 2 } }, verbal: { sub_variant: 'cloze_deletion', params: { word_rarity: "medium" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part_and_rotate' }} } },
      5: { mechanic_config: { gridSize: "2x2", distractor_similarity: "medium" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color" } }, math: { sub_variant: "probabilistic", params: { samples: 5, populationSize: 30 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'diatonic_progression', complexity: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { word_rarity: "high" } }, spatial: { sub_variant: 'vector_logic', params: { rule: 'translation' }} } },
      // Levels 6-20...
      6: { mechanic_config: { gridSize: "2x2", distractor_similarity: "medium" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      7: { mechanic_config: { gridSize: "3x3", distractor_similarity: "medium" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      8: { mechanic_config: { gridSize: "3x3", distractor_similarity: "medium" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      9: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      11: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      12: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      13: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      14: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      15: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      16: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      17: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      18: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      19: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      20: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  },
  gv_visual_lab: {
    gameId: "gv_visual_lab",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.65,
    levelMap: {
      1: { mechanic_config: { distractorCount: 3, responseWindowMs: 5000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: [90, 180, 270] } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 2, equationTerms: 2, maxWeight: 3} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q'], distractorCount: 1 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'compound', complexity: 1 } }, spatial: { sub_variant: 'voxel_jigsaw', params: { pieceCount: 3, complexity: 1 } } } },
      2: { mechanic_config: { distractorCount: 3, responseWindowMs: 4500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: [90, 180, 270] } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 2, equationTerms: 3, maxWeight: 3} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q'], distractorCount: 2 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'compound', complexity: 2 } }, spatial: { sub_variant: 'voxel_jigsaw', params: { pieceCount: 4, complexity: 1 } } } },
      3: { mechanic_config: { distractorCount: 4, responseWindowMs: 4500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free" } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 3, equationTerms: 3, maxWeight: 3} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q'], distractorCount: 2 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'affixes', complexity: 1 } }, spatial: { sub_variant: 'voxel_jigsaw', params: { pieceCount: 4, complexity: 2 } } } },
      4: { mechanic_config: { distractorCount: 4, responseWindowMs: 4000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free" } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 3, equationTerms: 3, maxWeight: 4} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q'], distractorCount: 3 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'affixes', complexity: 2 } }, spatial: { sub_variant: 'proportion_match', params: { distortion: 0.2 } } } },
      5: { mechanic_config: { distractorCount: 4, responseWindowMs: 3500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 3, equationTerms: 4, maxWeight: 4} }, music: { sub_variant: "spectrogram_match", params: { timbres: ['sine', 'square'], distractorCount: 3 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 5, target_length: 3 } }, spatial: { sub_variant: 'proportion_match', params: { distortion: 0.1 } } } },
      // Levels 6-20...
      6: { mechanic_config: { distractorCount: 4, responseWindowMs: 3000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      7: { mechanic_config: { distractorCount: 5, responseWindowMs: 3000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      8: { mechanic_config: { distractorCount: 5, responseWindowMs: 2500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      9: { mechanic_config: { distractorCount: 5, responseWindowMs: 2500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { distractorCount: 6, responseWindowMs: 2000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      11: { mechanic_config: { distractorCount: 6, responseWindowMs: 2000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      12: { mechanic_config: { distractorCount: 6, responseWindowMs: 1800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      13: { mechanic_config: { distractorCount: 6, responseWindowMs: 1800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      14: { mechanic_config: { distractorCount: 7, responseWindowMs: 1500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      15: { mechanic_config: { distractorCount: 7, responseWindowMs: 1500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      16: { mechanic_config: { distractorCount: 7, responseWindowMs: 1200 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      17: { mechanic_config: { distractorCount: 7, responseWindowMs: 1200 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      18: { mechanic_config: { distractorCount: 8, responseWindowMs: 1000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      19: { mechanic_config: { distractorCount: 8, responseWindowMs: 1000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      20: { mechanic_config: { distractorCount: 8, responseWindowMs: 800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  },
  ga_auditory_lab: {
    gameId: "ga_auditory_lab",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.65,
    levelMap: {
        1: { mechanic_config: { noiseLevel: 0, responseWindowMs: 3000 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 120 } }, math: { sub_variant: "auditory_calculation", params: { operands: 2, operations: ['+'] } }, music: { sub_variant: 'pitch_discrimination', params: { freqDelta: 50 } }, verbal: { sub_variant: 'phoneme_discrimination', params: { noise_level: 0, pairs: ['p', 'b'] } }, spatial: { sub_variant: 'sound_localization', params: { pan: [-1, 1], gain: [1, 1] } } } },
        2: { mechanic_config: { noiseLevel: 0, responseWindowMs: 3000 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 100 } }, math: { sub_variant: "auditory_calculation", params: { operands: 2, operations: ['+', '-'] } }, music: { sub_variant: 'rhythm_matching', params: { complexity: 1 } }, verbal: { sub_variant: 'phoneme_discrimination', params: { noise_level: 0, pairs: ['p', 'b', 't', 'd'] } }, spatial: { sub_variant: 'sound_localization', params: { pan: [-0.5, 0.5], gain: [1, 1] } } } },
        // ... and so on
        3: { mechanic_config: { noiseLevel: 0.1, responseWindowMs: 2800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        4: { mechanic_config: { noiseLevel: 0.1, responseWindowMs: 2800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        5: { mechanic_config: { noiseLevel: 0.1, responseWindowMs: 2500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        6: { mechanic_config: { noiseLevel: 0.2, responseWindowMs: 2500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        7: { mechanic_config: { noiseLevel: 0.2, responseWindowMs: 2200 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        8: { mechanic_config: { noiseLevel: 0.3, responseWindowMs: 2200 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        9: { mechanic_config: { noiseLevel: 0.3, responseWindowMs: 2000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        10: { mechanic_config: { noiseLevel: 0.3, responseWindowMs: 2000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        11: { mechanic_config: { noiseLevel: 0.4, responseWindowMs: 1800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        12: { mechanic_config: { noiseLevel: 0.4, responseWindowMs: 1800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        13: { mechanic_config: { noiseLevel: 0.4, responseWindowMs: 1600 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        14: { mechanic_config: { noiseLevel: 0.5, responseWindowMs: 1600 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        15: { mechanic_config: { noiseLevel: 0.5, responseWindowMs: 1500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        16: { mechanic_config: { noiseLevel: 0.6, responseWindowMs: 1500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        17: { mechanic_config: { noiseLevel: 0.6, responseWindowMs: 1200 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        18: { mechanic_config: { noiseLevel: 0.7, responseWindowMs: 1200 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        19: { mechanic_config: { noiseLevel: 0.7, responseWindowMs: 1000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
        20: { mechanic_config: { noiseLevel: 0.8, responseWindowMs: 1000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  },
  glr_fluency_storm: {
    gameId: "glr_fluency_storm",
    sessionLength: 1, 
    windowSize: 1,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { timeSec: 45, minTarget: 5 }, content_config: { neutral: { params: { category: "broad_concrete" } }, math: { params: { category: "broad_concrete" } }, music: { sub_variant: 'category_sprint', params: { category: "instrument_families" } }, verbal: { sub_variant: 'category_sprint', params: { category: 'Animals' } }, spatial: { sub_variant: 'route_retrieval', params: { map_complexity: 1 } } } },
      // ... and so on
      2: { mechanic_config: { timeSec: 40, minTarget: 6 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      3: { mechanic_config: { timeSec: 40, minTarget: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      4: { mechanic_config: { timeSec: 35, minTarget: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      5: { mechanic_config: { timeSec: 35, minTarget: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      6: { mechanic_config: { timeSec: 30, minTarget: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      7: { mechanic_config: { timeSec: 30, minTarget: 6 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      8: { mechanic_config: { timeSec: 30, minTarget: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      9: { mechanic_config: { timeSec: 25, minTarget: 3 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { timeSec: 25, minTarget: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      11: { mechanic_config: { timeSec: 20, minTarget: 3 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      12: { mechanic_config: { timeSec: 20, minTarget: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      13: { mechanic_config: { timeSec: 20, minTarget: 2 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      14: { mechanic_config: { timeSec: 20, minTarget: 3 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      15: { mechanic_config: { timeSec: 20, minTarget: 3 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      16: { mechanic_config: { timeSec: 20, minTarget: 3 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      17: { mechanic_config: { timeSec: 15, minTarget: 2 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      18: { mechanic_config: { timeSec: 15, minTarget: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      19: { mechanic_config: { timeSec: 15, minTarget: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      20: { mechanic_config: { timeSec: 15, minTarget: 2 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  },
  gc_verbal_inference: {
    gameId: "gc_verbal_inference",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { distractor_count: 3 }, content_config: { neutral: { sub_variant: "analogy", params: { word_rarity: 1000 } }, math: { sub_variant: "word_problem", params: { complexity: 1 } }, music: { sub_variant: 'knowledge', params: { type: 'instrument_family', complexity: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { type: 'noun_verb_agreement' } }, spatial: { sub_variant: 'spatial_lexicon', params: { type: 'preposition' } } } },
      // ... and so on
      2: { mechanic_config: { distractor_count: 3 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      3: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      4: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      5: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      6: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      7: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      8: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      9: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      11: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      12: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      13: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      14: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      15: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      16: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      17: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      18: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      19: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      20: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  },
  ef_focus_switch: {
    gameId: "ef_focus_switch",
    sessionLength: 20,
    windowSize: 15,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.68,
    levelMap: {
      1: { mechanic_config: { switchInterval: 10, noGo: false, responseWindowMs: 3000 }, content_config: { neutral: { params: { ruleCount: 2, cueType: "explicit_text" } }, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { params: { ruleCount: 2, rules: ["pitch_direction", "rhythm_evenness"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category'], switch_interval: 10 } }, spatial: { sub_variant: 'perspective_shift', params: { cue: 'explicit' } } } },
      // ... and so on
      2: { mechanic_config: { switchInterval: 8, noGo: false, responseWindowMs: 2800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      3: { mechanic_config: { switchInterval: 8, noGo: false, responseWindowMs: 2800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      4: { mechanic_config: { switchInterval: 6, noGo: false, responseWindowMs: 2500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      5: { mechanic_config: { switchInterval: 6, noGo: false, responseWindowMs: 2500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      6: { mechanic_config: { switchInterval: 5, noGo: false, responseWindowMs: 2200 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      7: { mechanic_config: { switchInterval: 5, noGo: true, noGoWaitMs: 1500, responseWindowMs: 2200 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      8: { mechanic_config: { switchInterval: 4, noGo: true, noGoWaitMs: 1500, responseWindowMs: 2000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      9: { mechanic_config: { switchInterval: 4, noGo: true, noGoWaitMs: 1400, responseWindowMs: 1800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { switchInterval: 4, noGo: true, noGoWaitMs: 1300, responseWindowMs: 1800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      11: { mechanic_config: { switchInterval: 3, noGo: true, noGoWaitMs: 1200, responseWindowMs: 1600 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      12: { mechanic_config: { switchInterval: 3, noGo: true, noGoWaitMs: 1100, responseWindowMs: 1500 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      13: { mechanic_config: { switchInterval: 3, noGo: true, noGoWaitMs: 1000, responseWindowMs: 1400 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      14: { mechanic_config: { switchInterval: 2, noGo: true, noGoWaitMs: 1000, responseWindowMs: 1200 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      15: { mechanic_config: { switchInterval: 2, noGo: true, noGoWaitMs: 900, responseWindowMs: 1100 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      16: { mechanic_config: { switchInterval: 2, noGo: true, noGoWaitMs: 800, responseWindowMs: 1000 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      17: { mechanic_config: { switchInterval: 2, noGo: true, noGoWaitMs: 700, responseWindowMs: 900 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      18: { mechanic_config: { switchInterval: 1.5, noGo: true, noGoWaitMs: 600, responseWindowMs: 800 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      19: { mechanic_config: { switchInterval: 1, noGo: true, noGoWaitMs: 500, responseWindowMs: 700 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      20: { mechanic_config: { switchInterval: 1, noGo: true, noGoWaitMs: 500, responseWindowMs: 600 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  }
};

export const difficultyPolicies = policies;
