
import type { DifficultyPolicy, GameId, TrainingFocus } from "@/types";

const policies: Partial<Record<GameId, DifficultyPolicy>> = {
  gwm_dynamic_sequence: {
    gameId: "gwm_dynamic_sequence",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.65,
    levelMap: {
      1: { mechanic_config: { sequenceLength: 3, displayTimeMs: 2000, visualDisplayTimeMs: 1000 }, content_config: { logic: {}, neutral: { params: { charSet: "alpha" } }, math: { params: { charSet: "numeric" } }, music: { sub_variant: 'complex_span', params: { melody_length: 3, note_palette_size: 5, distractor_difficulty: 1 } }, verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_distinct' } }, spatial: { sub_variant: 'spatial_span', params: { blockCount: 9, spanLength: 3, depthVariance: 2, reverse: false } }, eq: { sub_variant: 'affective_span', params: { sequence_length: 3, presentation_rate_ms: 1500, recall_delay_ms: 0, lure_emotion_count: 0, label_shown: true } } } },
      2: { mechanic_config: { sequenceLength: 4, displayTimeMs: 2000, visualDisplayTimeMs: 1200 }, content_config: { logic: {}, neutral: { params: { charSet: "alpha" } }, math: { params: { charSet: "numeric" } }, music: { sub_variant: 'complex_span', params: { melody_length: 3, note_palette_size: 6, distractor_difficulty: 1 } }, verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_distinct' } }, spatial: { sub_variant: 'spatial_span', params: { blockCount: 9, spanLength: 4, depthVariance: 2, reverse: false } }, eq: { sub_variant: 'affective_span', params: { sequence_length: 4, presentation_rate_ms: 1500, recall_delay_ms: 0, lure_emotion_count: 1, label_shown: true } } } },
      3: { mechanic_config: { sequenceLength: 4, displayTimeMs: 1800, visualDisplayTimeMs: 1200 }, content_config: { logic: {}, neutral: { params: { charSet: "alphanumeric" } }, math: { params: { charSet: "numeric_ops" } }, music: { sub_variant: 'complex_span', params: { melody_length: 4, note_palette_size: 6, distractor_difficulty: 2 } }, verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_similar' } }, spatial: { sub_variant: 'spatial_span', params: { blockCount: 12, spanLength: 4, depthVariance: 4, reverse: false } }, eq: { sub_variant: 'affective_span', params: { sequence_length: 5, presentation_rate_ms: 1200, recall_delay_ms: 0, lure_emotion_count: 2, label_shown: false } } } },
      4: { mechanic_config: { sequenceLength: 5, displayTimeMs: 1800, visualDisplayTimeMs: 1500 }, content_config: { logic: {}, neutral: { params: { charSet: "alphanumeric" } }, math: { params: { charSet: "numeric_ops" } }, music: { sub_variant: 'complex_span', params: { melody_length: 4, note_palette_size: 7, distractor_difficulty: 2 } }, verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_similar' } }, spatial: { sub_variant: 'spatial_span', params: { blockCount: 12, spanLength: 5, depthVariance: 4, reverse: false } }, eq: { sub_variant: 'affective_span', params: { sequence_length: 5, presentation_rate_ms: 1200, recall_delay_ms: 5000, lure_emotion_count: 2, label_shown: false } } } },
      5: { mechanic_config: { sequenceLength: 5, displayTimeMs: 1500, visualDisplayTimeMs: 1500 }, content_config: { logic: {}, neutral: { params: { charSet: "alphanumeric" } }, math: { params: { charSet: "numeric_ops" } }, music: { sub_variant: 'complex_span', params: { melody_length: 5, note_palette_size: 7, distractor_difficulty: 3 } }, verbal: { sub_variant: 'grammatical_recall', params: { error_type: 'tense' } }, spatial: { sub_variant: 'spatial_span', params: { blockCount: 12, spanLength: 5, depthVariance: 6, reverse: true } }, eq: { sub_variant: 'affective_span', params: { sequence_length: 6, presentation_rate_ms: 1000, recall_delay_ms: 5000, lure_emotion_count: 3, label_shown: false } } } },
      6: { mechanic_config: { sequenceLength: 6, displayTimeMs: 1500, visualDisplayTimeMs: 1800 }, content_config: { logic: {}, neutral: {}, math: {}, music: { sub_variant: 'complex_span', params: { melody_length: 5, note_palette_size: 8, distractor_difficulty: 3 } }, verbal: { sub_variant: 'sentence_unscramble'}, spatial: { sub_variant: 'spatial_span', params: { blockCount: 16, spanLength: 6, depthVariance: 6, reverse: true } }, eq: { sub_variant: 'affective_span', params: { sequence_length: 6, presentation_rate_ms: 800, recall_delay_ms: 7000, lure_emotion_count: 3, label_shown: false } } } },
      7: { mechanic_config: { sequenceLength: 6, displayTimeMs: 1200, visualDisplayTimeMs: 1800 }, content_config: { logic: {}, neutral: {}, math: {}, music: { sub_variant: 'complex_span', params: { melody_length: 6, note_palette_size: 8, distractor_difficulty: 4 } }, verbal: {}, spatial: { sub_variant: 'spatial_span', params: { blockCount: 16, spanLength: 6, depthVariance: 8, reverse: true } }, eq: { sub_variant: 'affective_span', params: { sequence_length: 7, presentation_rate_ms: 800, recall_delay_ms: 7000, lure_emotion_count: 4, label_shown: false } } } },
      8: { mechanic_config: { sequenceLength: 7, displayTimeMs: 1200, visualDisplayTimeMs: 2100 }, content_config: { logic: {}, neutral: {}, math: {}, music: { sub_variant: 'complex_span', params: { melody_length: 6, note_palette_size: 9, distractor_difficulty: 4 } }, verbal: {}, spatial: { sub_variant: 'spatial_span', params: { blockCount: 16, spanLength: 7, depthVariance: 8, reverse: true } }, eq: { sub_variant: 'affective_span', params: { sequence_length: 8, presentation_rate_ms: 600, recall_delay_ms: 10000, lure_emotion_count: 4, label_shown: false } } } },
    }
  },
  gs_rapid_code: {
    gameId: "gs_rapid_code",
    sessionLength: 30,
    windowSize: 20,
    targetAccuracyHigh: 0.90,
    targetAccuracyLow: 0.70,
    levelMap: {
      1: { mechanic_config: { responseWindowMs: 6000, distractorCount: 2 }, content_config: { logic: {}, neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "parity" } }, music: { sub_variant: 'auditory_oddball', params: { oddball_probability: 0.2, min_standards_between_oddballs: 3, tempo_bpm: 80, timbre_pair: ['sine', 'square'] } }, verbal: { sub_variant: 'lexical_decision', params: { word_length: 4, frequency_min: 7 } }, spatial: { sub_variant: 'rapid_rotation', params: { polycubeSize: 3, rotationAxes: 1, timeLimit: 60 }}, eq: { sub_variant: 'flash_recognition', params: { catch_trial_probability: 0.15, response_options: 2 } } } },
      2: { mechanic_config: { responseWindowMs: 5500, distractorCount: 2 }, content_config: { logic: {}, neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "sign" } }, music: { sub_variant: 'auditory_oddball', params: { oddball_probability: 0.2, min_standards_between_oddballs: 3, tempo_bpm: 90, timbre_pair: ['sine', 'square'] } }, verbal: { sub_variant: 'synonym_match', params: { word_length: 4, frequency_min: 7 } }, spatial: { sub_variant: 'rapid_rotation', params: { polycubeSize: 3, rotationAxes: 1, timeLimit: 60 }}, eq: { sub_variant: 'flash_recognition', params: { catch_trial_probability: 0.15, response_options: 2 } } } },
      3: { mechanic_config: { responseWindowMs: 5000, distractorCount: 3 }, content_config: { logic: {}, neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "parity" } }, music: { sub_variant: 'auditory_oddball', params: { oddball_probability: 0.2, min_standards_between_oddballs: 3, tempo_bpm: 100, timbre_pair: ['sine', 'triangle'] } }, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { polycubeSize: 4, rotationAxes: 2, timeLimit: 60 }}, eq: { sub_variant: 'flash_recognition', params: { catch_trial_probability: 0.20, response_options: 3 } } } },
      4: { mechanic_config: { responseWindowMs: 4500, distractorCount: 3 }, content_config: { logic: {}, neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "magnitude", threshold: 5 } }, music: { sub_variant: 'auditory_oddball', params: { oddball_probability: 0.2, min_standards_between_oddballs: 3, tempo_bpm: 110, timbre_pair: ['sine', 'triangle'] } }, verbal: { sub_variant: 'lexical_decision', params: { word_length: 5, frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { polycubeSize: 4, rotationAxes: 2, timeLimit: 60 }}, eq: { sub_variant: 'flash_recognition', params: { catch_trial_probability: 0.20, response_options: 3 } } } },
      5: { mechanic_config: { responseWindowMs: 4000, distractorCount: 4 }, content_config: { logic: {}, neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "perceptual_judgment", params: { type: "sign" } }, music: { sub_variant: 'auditory_oddball', params: { oddball_probability: 0.2, min_standards_between_oddballs: 4, tempo_bpm: 120, timbre_pair: ['triangle', 'sawtooth'] } }, verbal: { sub_variant: 'synonym_match', params: { word_length: 5, frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { polycubeSize: 5, rotationAxes: 2, timeLimit: 45 }}, eq: { sub_variant: 'flash_recognition', params: { catch_trial_probability: 0.25, response_options: 4 } } } },
      6: { mechanic_config: { responseWindowMs: 3500, distractorCount: 4 }, content_config: { logic: {}, neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "perceptual_judgment", params: { type: "parity" } }, music: { sub_variant: 'auditory_oddball', params: { oddball_probability: 0.2, min_standards_between_oddballs: 4, tempo_bpm: 130, timbre_pair: ['triangle', 'sawtooth'] } }, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 5 } }, spatial: { sub_variant: 'rapid_rotation', params: { polycubeSize: 5, rotationAxes: 3, timeLimit: 45 }}, eq: { sub_variant: 'flash_recognition', params: { catch_trial_probability: 0.25, response_options: 4 } } } },
      7: { mechanic_config: { responseWindowMs: 3000, distractorCount: 5 }, content_config: { logic: {}, neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "perceptual_judgment", params: { type: "magnitude", threshold: 5 } }, music: { sub_variant: 'auditory_oddball', params: { oddball_probability: 0.18, min_standards_between_oddballs: 4, tempo_bpm: 140, timbre_pair: ['sawtooth', 'square'] } }, verbal: {}, spatial: { sub_variant: 'rapid_rotation', params: { polycubeSize: 6, rotationAxes: 3, timeLimit: 45 }}, eq: { sub_variant: 'flash_recognition', params: { catch_trial_probability: 0.30, response_options: 4 } } } },
      8: { mechanic_config: { responseWindowMs: 2800, distractorCount: 5 }, content_config: { logic: {}, neutral: { params: { complexity: "complex" } }, math: {}, music: { sub_variant: 'auditory_oddball', params: { oddball_probability: 0.18, min_standards_between_oddballs: 4, tempo_bpm: 150, timbre_pair: ['sawtooth', 'square'] } }, verbal: {}, spatial: { sub_variant: 'rapid_rotation', params: { polycubeSize: 6, rotationAxes: 3, timeLimit: 45 }}, eq: { sub_variant: 'flash_recognition', params: { catch_trial_probability: 0.30, response_options: 4 } } } },
    }
  },
  gf_pattern_matrix: {
    gameId: "gf_pattern_matrix",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { gridSize: "2x2", distractor_similarity: "low" }, content_config: { logic: {}, neutral: { sub_variant: 'default', params: { rule: "shape" } }, math: { sub_variant: "deterministic", params: { rule: "arithmetic_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'transposition', complexity: 1 } }, verbal: { sub_variant: 'morphological_analogy', params: { type: "pseudo_word" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part' }}, eq: { sub_variant: 'emotion_matrix', params: { rule_family: ['Intensity'], distractor_count: 3 } } } },
      2: { mechanic_config: { gridSize: "2x2", distractor_similarity: "low" }, content_config: { logic: {}, neutral: { sub_variant: 'default', params: { rule: "color" } }, math: { sub_variant: "deterministic", params: { rule: "geometric_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'transposition', complexity: 2 } }, verbal: { sub_variant: 'morphological_analogy', params: { type: "pseudo_word" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part_and_rotate' }}, eq: { sub_variant: 'emotion_matrix', params: { rule_family: ['Intensity'], distractor_count: 4 } } } },
      3: { mechanic_config: { gridSize: "3x3", distractor_similarity: "low" }, content_config: { logic: {}, neutral: { sub_variant: 'default', params: { rule: "shape" } }, math: { sub_variant: "deterministic", params: { rule: "arithmetic_sequence" } }, music: { sub_variant: 'rhythmic_pattern', params: { rule: 'augmentation', complexity: 1 } }, verbal: { sub_variant: 'morphological_analogy', params: { type: "pseudo_word" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part' }}, eq: { sub_variant: 'emotion_matrix', params: { rule_family: ['Intensity', 'Valence Alternation'], distractor_count: 3 } } } },
      4: { mechanic_config: { gridSize: "3x3", distractor_similarity: "low" }, content_config: { logic: {}, neutral: { sub_variant: 'default', params: { rule: "color" } }, math: { sub_variant: "deterministic", params: { rule: "geometric_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'inversion', complexity: 2 } }, verbal: { sub_variant: 'morphological_analogy', params: { type: "pseudo_word" } }, spatial: { sub_variant: 'assembly_logic', params: { rule: 'add_part_and_rotate' }}, eq: { sub_variant: 'emotion_matrix', params: { rule_family: ['Valence Alternation', 'Arousal Shift'], distractor_count: 4 } } } },
      5: { mechanic_config: { gridSize: "2x2", distractor_similarity: "medium" }, content_config: { logic: {}, neutral: { sub_variant: 'default', params: { rule: "shape+color" } }, math: { sub_variant: "probabilistic", params: { samples: 5, populationSize: 30 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'diatonic_progression', complexity: 1 } }, verbal: { sub_variant: 'morphological_analogy', params: { type: "pseudo_word_complex" } }, spatial: { sub_variant: 'vector_logic', params: { rule: 'translation' }}, eq: { sub_variant: 'emotion_matrix', params: { rule_family: ['Emotion Blending'], distractor_count: 5 } } } },
      6: { mechanic_config: { gridSize: "2x2", distractor_similarity: "medium" }, content_config: { logic: {}, neutral: {}, math: {}, music: {}, verbal: {}, spatial: {}, eq: { sub_variant: 'emotion_matrix', params: { rule_family: ['Emotion Blending', 'Context Negation'], distractor_count: 5 } } } },
      7: { mechanic_config: { gridSize: "3x3", distractor_similarity: "medium" }, content_config: { logic: {}, neutral: {}, math: {}, music: {}, verbal: {}, spatial: {}, eq: { sub_variant: 'emotion_matrix', params: { rule_family: ['Intensity', 'Valence Alternation', 'Emotion Blending'], distractor_count: 6 } } } },
      8: { mechanic_config: { gridSize: "3x3", distractor_similarity: "medium" }, content_config: { logic: {}, neutral: {}, math: {}, music: {}, verbal: {}, spatial: {}, eq: { sub_variant: 'emotion_matrix', params: { rule_family: ['Arousal Shift', 'Context Negation', 'Emotion Blending'], distractor_count: 6 } } } },
    }
  },
  gv_visual_lab: {
    gameId: "gv_visual_lab",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.65,
    levelMap: {
      1: { mechanic_config: {}, content_config: { logic: {}, eq: { params: { angles: [90, 180, 270], emotionFoil: false, distractorCount: 2 } }, neutral: { sub_variant: "mental_rotation", params: { angles: [90, 180, 270] } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 3, maxWeight: 5, equationTerms: 4 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q'], distractorCount: 1 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'compound', complexity: 1 } }, spatial: { sub_variant: 'spatial_assembly', params: { pieceCount: 5, complexity: 1 } } } },
      2: { mechanic_config: {}, content_config: { logic: {}, eq: { params: { angles: [45, 90, 135, 180], emotionFoil: false, distractorCount: 2 } }, neutral: { sub_variant: "mental_rotation", params: { angles: [90, 180, 270] } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 3, maxWeight: 7, equationTerms: 5 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q'], distractorCount: 2 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'compound', complexity: 2 } }, spatial: { sub_variant: 'spatial_assembly', params: { pieceCount: 6, complexity: 1 } } } },
      3: { mechanic_config: {}, content_config: { logic: {}, eq: { params: { angles: [45, 90, 135, 180, 225, 270], emotionFoil: true, distractorCount: 4 } }, neutral: { sub_variant: "mental_rotation", params: { angles: "free" } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 4, maxWeight: 7, equationTerms: 5 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q'], distractorCount: 2 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'affixes', complexity: 1 } }, spatial: { sub_variant: 'spatial_assembly', params: { pieceCount: 7, complexity: 2 } } } },
      4: { mechanic_config: {}, content_config: { logic: {}, eq: { params: { angles: [45, 90, 135, 180, 225, 270, 315], emotionFoil: true, distractorCount: 4 } }, neutral: { sub_variant: "mental_rotation", params: { angles: "free" } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 4, maxWeight: 9, equationTerms: 6 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q'], distractorCount: 3 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'affixes', complexity: 2 } }, spatial: { sub_variant: 'spatial_assembly', params: { pieceCount: 8, complexity: 2 } } } },
      5: { mechanic_config: {}, content_config: { logic: {}, eq: { params: { angles: [45, 90, 135, 180, 225, 270, 315], emotionFoil: true, distractorCount: 4 } }, neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 5, maxWeight: 9, equationTerms: 6 } }, music: { sub_variant: "spectrogram_match", params: { timbres: ['sine', 'square'], distractorCount: 3 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 5, target_length: 3 } }, spatial: { sub_variant: 'spatial_assembly', params: { pieceCount: 9, complexity: 3 } } } },
      6: { mechanic_config: {}, content_config: { logic: {}, neutral: {}, math: { sub_variant: "balance_puzzle", params: { shapeCount: 5, maxWeight: 12, equationTerms: 7 } }, music: {}, verbal: {}, spatial: { sub_variant: 'spatial_assembly', params: { pieceCount: 10, complexity: 3 } } } },
      7: { mechanic_config: {}, content_config: { logic: {}, spatial: { sub_variant: 'spatial_assembly', params: { pieceCount: 11, complexity: 4 } } } },
      8: { mechanic_config: {}, content_config: { logic: {}, spatial: { sub_variant: 'spatial_assembly', params: { pieceCount: 12, complexity: 4 } } } },
    }
  },
  ga_auditory_lab: {
    gameId: "ga_auditory_lab",
    sessionLength: 20,
    windowSize: 15,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.65,
    levelMap: {
        1: { mechanic_config: { replaysAllowed: 2 }, content_config: { logic: {}, eq: { params: { distractor_count: 2, noise_level: 0 }}, music: { sub_variant: 'pitch_discrimination', params: { pitchDelta: 200 } }, verbal: { sub_variant: 'phoneme_discrimination', params: {} }, math: { sub_variant: "auditory_math_word_problem", params: { digits: 1, operations: ['+'] } }, spatial: { sub_variant: 'spatial_sound_localization', params: { positionCount: 4, sequenceLength: 3, pitchSet: [200, 400, 600, 800] }} } },
        2: { mechanic_config: { replaysAllowed: 2 }, content_config: { logic: {}, eq: { params: { distractor_count: 3, noise_level: 0 }}, music: { sub_variant: 'pitch_discrimination', params: { pitchDelta: 150 } }, verbal: { sub_variant: 'phoneme_discrimination', params: {} }, math: { sub_variant: "auditory_math_word_problem", params: { digits: 1, operations: ['+', '-'] } }, spatial: { sub_variant: 'spatial_sound_localization', params: { positionCount: 4, sequenceLength: 3, pitchSet: [200, 400, 600, 800] }} } },
        3: { mechanic_config: { replaysAllowed: 1 }, content_config: { logic: {}, eq: { params: { distractor_count: 3, noise_level: 0.05 }}, music: { sub_variant: 'pitch_discrimination', params: { pitchDelta: 100 } }, verbal: { sub_variant: 'phoneme_discrimination', params: {} }, math: { sub_variant: "auditory_math_word_problem", params: { digits: 2, operations: ['+'] } }, spatial: { sub_variant: 'spatial_sound_localization', params: { positionCount: 6, sequenceLength: 5, pitchSet: [200, 275, 350, 425, 500, 575] }} } },
        4: { mechanic_config: { replaysAllowed: 1 }, content_config: { logic: {}, eq: { params: { distractor_count: 4, noise_level: 0.05 }}, music: { sub_variant: 'pitch_discrimination', params: { pitchDelta: 75 } }, verbal: { sub_variant: 'phoneme_discrimination', params: {} }, math: { sub_variant: "auditory_math_word_problem", params: { digits: 2, operations: ['+', '-'] } }, spatial: { sub_variant: 'spatial_sound_localization', params: { positionCount: 6, sequenceLength: 5, pitchSet: [200, 275, 350, 425, 500, 575] }} } },
        5: { mechanic_config: { replaysAllowed: 0 }, content_config: { logic: {}, eq: { params: { distractor_count: 4, noise_level: 0.1 }}, music: { sub_variant: 'pitch_discrimination', params: { pitchDelta: 50 } }, verbal: { sub_variant: 'phoneme_discrimination', params: {} }, math: { sub_variant: "auditory_math_word_problem", params: { digits: 2, operations: ['+', '-'] } }, spatial: { sub_variant: 'spatial_sound_localization', params: { positionCount: 8, sequenceLength: 7, pitchSet: [200, 240, 280, 320, 360, 400, 440, 480] }} } },
        6: { mechanic_config: { replaysAllowed: 0 }, content_config: { logic: {}, eq: { params: { distractor_count: 4, noise_level: 0.1 }}, music: { sub_variant: 'pitch_discrimination', params: { pitchDelta: 40 } }, verbal: { sub_variant: 'phoneme_discrimination', params: {} }, math: { sub_variant: "auditory_math_word_problem", params: { digits: 3, operations: ['+'] } }, spatial: { sub_variant: 'spatial_sound_localization', params: { positionCount: 8, sequenceLength: 7, pitchSet: [200, 240, 280, 320, 360, 400, 440, 480] }} } },
    }
  },
  glr_fluency_storm: {
    gameId: "glr_fluency_storm",
    sessionLength: 1, 
    windowSize: 1,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: {}, content_config: {
          spatial: { sub_variant: 'memory_palace', params: { landmarkCount: 4, objectCount: 4, encodingDurationMs: 30000, delayDurationMs: 10000, distractorCount: 2 } },
          neutral: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 10 } },
          math: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 10 } },
          music: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 10 } },
          verbal: { sub_variant: 'category_sprint', params: {} },
          eq: { sub_variant: 'category_sprint', params: {} },
          logic: { sub_variant: 'associative_chain', params: {} },
      }},
      2: { mechanic_config: {}, content_config: {
          spatial: { sub_variant: 'memory_palace', params: { landmarkCount: 4, objectCount: 4, encodingDurationMs: 30000, delayDurationMs: 15000, distractorCount: 2 } },
          neutral: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 15 } },
          math: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 15 } },
          music: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 15 } },
          verbal: { sub_variant: 'associative_chain', params: {} },
          eq: { sub_variant: 'category_sprint', params: {} },
          logic: { sub_variant: 'associative_chain', params: {} },
      }},
      3: { mechanic_config: {}, content_config: {
          spatial: { sub_variant: 'memory_palace', params: { landmarkCount: 6, objectCount: 6, encodingDurationMs: 25000, delayDurationMs: 20000, distractorCount: 3 } },
          neutral: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 15 } },
          math: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 15 } },
          music: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 15 } },
          verbal: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 15 } },
          eq: { sub_variant: 'category_sprint', params: {} },
          logic: { sub_variant: 'associative_chain', params: {} },
      }},
      4: { mechanic_config: {}, content_config: {
          spatial: { sub_variant: 'memory_palace', params: { landmarkCount: 6, objectCount: 6, encodingDurationMs: 25000, delayDurationMs: 20000, distractorCount: 3 } },
          neutral: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 20 } },
          math: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 20 } },
          music: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 20 } },
          verbal: { sub_variant: 'category_sprint', params: {} },
          eq: { sub_variant: 'category_sprint', params: {} },
          logic: { sub_variant: 'associative_chain', params: {} },
      }},
      5: { mechanic_config: {}, content_config: {
          spatial: { sub_variant: 'memory_palace', params: { landmarkCount: 8, objectCount: 8, encodingDurationMs: 20000, delayDurationMs: 30000, distractorCount: 4 } },
          neutral: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 20 } },
          math: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 20 } },
          music: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 20 } },
          verbal: { sub_variant: 'associative_chain', params: {} },
          eq: { sub_variant: 'category_sprint', params: {} },
          logic: { sub_variant: 'associative_chain', params: {} },
      }},
      6: { mechanic_config: {}, content_config: {
          spatial: { sub_variant: 'memory_palace', params: { landmarkCount: 8, objectCount: 8, encodingDurationMs: 20000, delayDurationMs: 30000, distractorCount: 4 } },
          neutral: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 25 } },
          math: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 25 } },
          music: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 25 } },
          verbal: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 25 } },
          eq: { sub_variant: 'category_sprint', params: {} },
          logic: { sub_variant: 'associative_chain', params: {} },
      }},
    }
  },
  gc_verbal_inference: {
    gameId: "gc_verbal_inference",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { timeLimit: 20000 }, content_config: { logic: {}, math: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } }, neutral: { sub_variant: "analogy", params: { word_rarity: 1000 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { word_rarity: 'common' } }, spatial: { sub_variant: 'spatial_concept_map', params: { nodeCount: 8, abstraction: 'concrete' } }, eq: { sub_variant: 'novel_concept_learning', params: { concept_complexity: 1 } } } },
      2: { mechanic_config: { timeLimit: 20000 }, content_config: { logic: {}, math: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } }, spatial: { sub_variant: 'spatial_concept_map', params: { nodeCount: 10, abstraction: 'concrete' } }, eq: { sub_variant: 'novel_concept_learning', params: { concept_complexity: 1 } } } },
      3: { mechanic_config: { timeLimit: 20000 }, content_config: { logic: {}, math: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } }, spatial: { sub_variant: 'spatial_concept_map', params: { nodeCount: 10, abstraction: 'concrete' } }, eq: { sub_variant: 'novel_concept_learning', params: { concept_complexity: 2 } } } },
      4: { mechanic_config: { timeLimit: 20000 }, content_config: { logic: {}, math: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } }, spatial: { sub_variant: 'spatial_concept_map', params: { nodeCount: 12, abstraction: 'abstract' } }, eq: { sub_variant: 'novel_concept_learning', params: { concept_complexity: 2 } } } },
      5: { mechanic_config: { timeLimit: 20000 }, content_config: { logic: {}, math: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } }, spatial: { sub_variant: 'spatial_concept_map', params: { nodeCount: 12, abstraction: 'abstract' } }, eq: { sub_variant: 'novel_concept_learning', params: { concept_complexity: 3 } } } },
      6: { mechanic_config: { timeLimit: 20000 }, content_config: { logic: {}, math: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } }, spatial: { sub_variant: 'spatial_concept_map', params: { nodeCount: 15, abstraction: 'abstract' } }, eq: { sub_variant: 'novel_concept_learning', params: { concept_complexity: 3 } } } },
      7: { mechanic_config: { timeLimit: 20000 }, content_config: { logic: {}, math: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 4 } }, spatial: { sub_variant: 'spatial_concept_map', params: { nodeCount: 15, abstraction: 'abstract' } }, eq: { sub_variant: 'novel_concept_learning', params: { concept_complexity: 4 } } } },
      8: { mechanic_config: { timeLimit: 20000 }, content_config: { logic: {}, math: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } }, music: { sub_variant: 'knowledge_retrieval', params: { question_level: 4 } }, spatial: { sub_variant: 'spatial_concept_map', params: { nodeCount: 15, abstraction: 'abstract' } }, eq: { sub_variant: 'novel_concept_learning', params: { concept_complexity: 4 } } } },
    }
  },
  ef_focus_switch: {
    gameId: "ef_focus_switch",
    sessionLength: 30,
    windowSize: 20,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.68,
    levelMap: {
      1: { mechanic_config: { switchProbability: 0.3, noGo: false, responseWindowMs: 3000 }, content_config: { logic: {}, neutral: { params: { ruleCount: 2, rules: ["position", "arrow"] } }, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'auditory_stroop', params: { incongruent_ratio: 0.25, high_pitch_hz: 300, low_pitch_hz: 150 } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category'], switch_interval: 10 } }, spatial: { sub_variant: 'perspective_shift', params: { cue: 'explicit' } }, eq: { params: { ruleCount: 2, rules: ["emotion", "gaze"], incongruent_ratio: 0.1 } } } },
      2: { mechanic_config: { switchProbability: 0.3, responseWindowMs: 2800 }, content_config: { logic: {}, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'auditory_stroop', params: { incongruent_ratio: 0.25, high_pitch_hz: 280, low_pitch_hz: 160 } }, eq: { params: { ruleCount: 2, rules: ["emotion", "gaze"], incongruent_ratio: 0.15 } } } },
      3: { mechanic_config: { switchProbability: 0.3, responseWindowMs: 2800 }, content_config: { logic: {}, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'auditory_go_no_go', params: { go_probability: 0.78, nogo_probability: 0.22, isi_ms: 1400 } }, eq: { params: { ruleCount: 2, rules: ["emotion", "gaze"], incongruent_ratio: 0.2 } } } },
      4: { mechanic_config: { switchProbability: 0.3, responseWindowMs: 2500 }, content_config: { logic: {}, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'auditory_stroop', params: { incongruent_ratio: 0.30, high_pitch_hz: 260, low_pitch_hz: 170 } }, eq: { params: { ruleCount: 2, rules: ["emotion", "gaze"], incongruent_ratio: 0.25 } } } },
      5: { mechanic_config: { switchProbability: 0.35, responseWindowMs: 2500 }, content_config: { logic: {}, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'auditory_go_no_go', params: { go_probability: 0.75, nogo_probability: 0.25, isi_ms: 1300 } }, eq: { params: { ruleCount: 2, rules: ["emotion", "gaze"], incongruent_ratio: 0.3 } } } },
      6: { mechanic_config: { switchProbability: 0.35, responseWindowMs: 2200 }, content_config: { logic: {}, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'auditory_stroop', params: { incongruent_ratio: 0.35, high_pitch_hz: 240, low_pitch_hz: 180 } }, eq: { params: { ruleCount: 2, rules: ["emotion", "gaze"], incongruent_ratio: 0.35 } } } },
      7: { mechanic_config: { switchProbability: 0.35, responseWindowMs: 2200 }, content_config: { logic: {}, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'auditory_go_no_go', params: { go_probability: 0.72, nogo_probability: 0.28, isi_ms: 1200 } }, eq: { params: { ruleCount: 2, rules: ["emotion", "gaze"], incongruent_ratio: 0.4 } } } },
      8: { mechanic_config: { switchProbability: 0.4, responseWindowMs: 2000 }, content_config: { logic: {}, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { sub_variant: 'auditory_stroop', params: { incongruent_ratio: 0.40, high_pitch_hz: 220, low_pitch_hz: 190 } }, eq: { params: { ruleCount: 2, rules: ["emotion", "gaze"], incongruent_ratio: 0.5 } } } },
    }
  }
};

export const difficultyPolicies = policies as Record<GameId, DifficultyPolicy>;

export const getDifficultyParams = (gameId: GameId, level: number, focus: TrainingFocus) => {
    const policy = difficultyPolicies[gameId];
    if (!policy) return null;
    
    const levelDef = policy.levelMap[level] || policy.levelMap[Object.keys(policy.levelMap).length];
    if (!levelDef) return null;

    const content = levelDef.content_config[focus];
    return {
        mechanics: levelDef.mechanic_config,
        content: content?.params,
        subVariant: content?.sub_variant
    };
};
