
import type { DifficultyPolicy, GameId } from "@/types";

const policies: Partial<Record<GameId, DifficultyPolicy>> = {
  gwm_dynamic_sequence: {
    gameId: "gwm_dynamic_sequence",
    sessionLength: 30, // Updated to match spec
    windowSize: 20, // Updated to match spec
    targetAccuracyHigh: 0.8, // Updated to match spec
    targetAccuracyLow: 0.5, // Updated to match spec
    levelMap: {
      1: { 
        mechanic_config: { sequenceLength: 3, displayTimeMs: 2000, visualDisplayTimeMs: 1000 }, 
        content_config: { 
          neutral: { params: { charSet: "alpha" } }, 
          math: { params: { charSet: "numeric" } }, 
          music: { sub_variant: 'dual_n_back', params: { n_back: 1, isi_ms: 2500, pitch_palette_size: 4, timbre_palette: ['sine', 'square', 'sawtooth'], target_probability: 0.25 } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_distinct' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '2d', itemCount: 2 } }
        } 
      },
      2: { 
        mechanic_config: { sequenceLength: 4, displayTimeMs: 2000, visualDisplayTimeMs: 1200 }, 
        content_config: { 
          neutral: { params: { charSet: "alpha" } }, 
          math: { params: { charSet: "numeric" } }, 
          music: { sub_variant: 'dual_n_back', params: { n_back: 1, isi_ms: 2500, pitch_palette_size: 5, timbre_palette: ['sine', 'square', 'sawtooth'], target_probability: 0.25 } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_distinct' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '2d', itemCount: 3 } }
        } 
      },
      3: { 
        mechanic_config: { sequenceLength: 4, displayTimeMs: 1800, visualDisplayTimeMs: 1200 }, 
        content_config: { 
          neutral: { params: { charSet: "alphanumeric" } }, 
          math: { params: { charSet: "numeric_ops" } }, 
          music: { sub_variant: 'dual_n_back', params: { n_back: 2, isi_ms: 2500, pitch_palette_size: 5, timbre_palette: ['sine', 'square', 'sawtooth'], target_probability: 0.25 } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_similar' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '3d', itemCount: 3 } }
        } 
      },
      4: { 
        mechanic_config: { sequenceLength: 5, displayTimeMs: 1800, visualDisplayTimeMs: 1500 }, 
        content_config: { 
          neutral: { params: { charSet: "alphanumeric" } }, 
          math: { params: { charSet: "numeric_ops" } }, 
          music: { sub_variant: 'dual_n_back', params: { n_back: 2, isi_ms: 2000, pitch_palette_size: 6, timbre_palette: ['sine', 'square', 'sawtooth', 'triangle'], target_probability: 0.25 } },
          verbal: { sub_variant: 'phonological_loop', params: { charSet: 'phonological_similar' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '3d', itemCount: 4 } }
        } 
      },
      5: { 
        mechanic_config: { sequenceLength: 5, displayTimeMs: 1500, visualDisplayTimeMs: 1500 }, 
        content_config: { 
          neutral: { params: { charSet: "alphanumeric" } }, 
          math: { params: { charSet: "numeric_ops" } }, 
          music: { sub_variant: 'dual_n_back', params: { n_back: 2, isi_ms: 2000, pitch_palette_size: 7, timbre_palette: ['sine', 'square', 'sawtooth', 'triangle'], target_probability: 0.25 } },
          verbal: { sub_variant: 'grammatical_recall', params: { error_type: 'tense' } },
          spatial: { sub_variant: 'spatial_span', params: { gridSize: '3d', itemCount: 4, distractors: true } }
        } 
      },
      6: { mechanic_config: { sequenceLength: 6, displayTimeMs: 1500, visualDisplayTimeMs: 1800 }, content_config: { neutral: {}, math: {}, music: { sub_variant: 'dual_n_back', params: { n_back: 3, isi_ms: 2000, pitch_palette_size: 7, timbre_palette: ['sine', 'square', 'sawtooth', 'triangle'], target_probability: 0.25 } }, verbal: { sub_variant: 'sentence_unscramble'}, spatial: {} } },
      7: { mechanic_config: { sequenceLength: 6, displayTimeMs: 1200, visualDisplayTimeMs: 1800 }, content_config: { neutral: {}, math: {}, music: { sub_variant: 'dual_n_back', params: { n_back: 3, isi_ms: 1800, pitch_palette_size: 8, timbre_palette: ['sine', 'square', 'sawtooth', 'triangle'], target_probability: 0.25 } }, verbal: {}, spatial: {} } },
      8: { mechanic_config: { sequenceLength: 7, displayTimeMs: 1200, visualDisplayTimeMs: 2100 }, content_config: { neutral: {}, math: {}, music: { sub_variant: 'dual_n_back', params: { n_back: 3, isi_ms: 1500, pitch_palette_size: 8, timbre_palette: ['sine', 'square', 'sawtooth', 'triangle'], target_probability: 0.25 } }, verbal: {}, spatial: {} } },
      9: { mechanic_config: { sequenceLength: 7, displayTimeMs: 1000, visualDisplayTimeMs: 2100 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { sequenceLength: 8, displayTimeMs: 1000, visualDisplayTimeMs: 2400 }, content_config: { neutral: {}, math: {}, music: {}, verbal: {}, spatial: {} } },
    }
  },
  gs_rapid_code: {
    gameId: "gs_rapid_code",
    sessionLength: 25,
    windowSize: 15,
    targetAccuracyHigh: 0.90,
    targetAccuracyLow: 0.70,
    levelMap: {
      1: { mechanic_config: { responseWindowMs: 6000, distractorCount: 2 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "parity" } }, music: { sub_variant: 'symbol_match', params: { set: ['treble', 'bass', 'quarter', 'half'] }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 4, frequency_min: 7 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'cardinal' }} } },
      2: { mechanic_config: { responseWindowMs: 5500, distractorCount: 2 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "sign" } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'octave'], direction: true }}, verbal: { sub_variant: 'synonym_match', params: { word_length: 4, frequency_min: 7 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'cardinal' }} } },
      3: { mechanic_config: { responseWindowMs: 5000, distractorCount: 3 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "parity" } }, music: { sub_variant: 'symbol_match', params: { set: ['treble', 'bass', 'quarter', 'half', 'eighth', 'sharp'] }}, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'any' }} } },
      4: { mechanic_config: { responseWindowMs: 4500, distractorCount: 3 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "perceptual_judgment", params: { type: "magnitude", threshold: 5 } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'M3', 'm3'], direction: true }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 5, frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'any', mirror: true }} } },
      5: { mechanic_config: { responseWindowMs: 4000, distractorCount: 4 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "perceptual_judgment", params: { type: "sign" } }, music: { sub_variant: 'rhythm_compare', params: { types: ['simple_duple'] }}, verbal: { sub_variant: 'synonym_match', params: { word_length: 5, frequency_min: 6 } }, spatial: { sub_variant: 'target_interception', params: { speed: 1, prediction: false }} } },
      6: { mechanic_config: { responseWindowMs: 3500, distractorCount: 4 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "perceptual_judgment", params: { type: "parity" } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'M3', 'm3', 'M6', 'm6'], direction: false }}, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 5 } }, spatial: { sub_variant: 'target_interception', params: { speed: 1.2, prediction: true }} } },
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
      1: { mechanic_config: { distractorCount: 3, responseWindowMs: 5000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: [90, 180, 270] } }, math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 1 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q'], distractorCount: 1 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'compound', complexity: 1 } }, spatial: { sub_variant: 'voxel_jigsaw', params: { pieceCount: 3, complexity: 1 } } } },
      2: { mechanic_config: { distractorCount: 3, responseWindowMs: 4500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: [90, 180, 270] } }, math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 1 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q'], distractorCount: 2 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'compound', complexity: 2 } }, spatial: { sub_variant: 'voxel_jigsaw', params: { pieceCount: 4, complexity: 1 } } } },
      3: { mechanic_config: { distractorCount: 4, responseWindowMs: 4500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free" } }, math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 2 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q'], distractorCount: 2 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'affixes', complexity: 1 } }, spatial: { sub_variant: 'voxel_jigsaw', params: { pieceCount: 4, complexity: 2 } } } },
      4: { mechanic_config: { distractorCount: 4, responseWindowMs: 4000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free" } }, math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 2 } }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q'], distractorCount: 3 } }, verbal: { sub_variant: 'typographic_search', params: { type: 'affixes', complexity: 2 } }, spatial: { sub_variant: 'proportion_match', params: { distortion: 0.2 } } } },
      5: { mechanic_config: { distractorCount: 4, responseWindowMs: 3500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 3 } }, music: { sub_variant: "spectrogram_match", params: { timbres: ['sine', 'square'], distractorCount: 3 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 5, target_length: 3 } }, spatial: { sub_variant: 'proportion_match', params: { distortion: 0.1 } } } },
      6: { mechanic_config: { distractorCount: 4, responseWindowMs: 3000 }, content_config: { neutral: {}, math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 3 } }, music: {}, verbal: {}, spatial: {} } },
    }
  },
  ga_auditory_lab: {
    gameId: "ga_auditory_lab",
    sessionLength: 12,
    windowSize: 10,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.65,
    levelMap: {
        1: { mechanic_config: {}, content_config: { math: { sub_variant: "magnitude_comparison", params: { digits: 2, speechRate: 1.0, pitchDelta: 100 } } } },
        2: { mechanic_config: {}, content_config: { math: { sub_variant: "magnitude_comparison", params: { digits: 2, speechRate: 1.2, pitchDelta: 90 } } } },
        3: { mechanic_config: {}, content_config: { math: { sub_variant: "magnitude_comparison", params: { digits: 3, speechRate: 1.0, pitchDelta: 80 } } } },
        4: { mechanic_config: {}, content_config: { math: { sub_variant: "magnitude_comparison", params: { digits: 3, speechRate: 1.2, pitchDelta: 70 } } } },
        5: { mechanic_config: {}, content_config: { math: { sub_variant: "magnitude_comparison", params: { digits: 3, speechRate: 1.5, pitchDelta: 60 } } } },
        6: { mechanic_config: {}, content_config: { math: { sub_variant: "magnitude_comparison", params: { digits: 4, speechRate: 1.2, pitchDelta: 50 } } } },
        7: { mechanic_config: {}, content_config: { math: { sub_variant: "magnitude_comparison", params: { digits: 4, speechRate: 1.5, pitchDelta: 40 } } } },
        8: { mechanic_config: {}, content_config: { math: { sub_variant: "magnitude_comparison", params: { digits: 5, speechRate: 1.5, pitchDelta: 30 } } } },
        9: { mechanic_config: {}, content_config: { math: { sub_variant: "magnitude_comparison", params: { digits: 5, speechRate: 1.8, pitchDelta: 20 } } } },
        10: { mechanic_config: {}, content_config: { math: { sub_variant: "magnitude_comparison", params: { digits: 6, speechRate: 1.8, pitchDelta: 15 } } } },
    }
  },
  glr_fluency_storm: {
    gameId: "glr_fluency_storm",
    sessionLength: 1, 
    windowSize: 1,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { timeSec: 45, minTarget: 5 }, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 10 } }, neutral: { params: { category: "broad_concrete" } }, music: { sub_variant: 'category_sprint', params: { category: "instrument_families" } }, verbal: { sub_variant: 'category_sprint', params: { category: 'Animals' } }, spatial: { sub_variant: 'route_retrieval', params: { map_complexity: 1 } } } },
      2: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 4, distractorDuration: 15 } } } },
      3: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 15 } } } },
      4: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 5, distractorDuration: 20 } } } },
      5: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 20 } } } },
      6: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 6, distractorDuration: 25 } } } },
      7: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 7, distractorDuration: 25 } } } },
      8: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 7, distractorDuration: 30 } } } },
      9: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 8, distractorDuration: 30 } } } },
      10: { mechanic_config: {}, content_config: { math: { sub_variant: 'spaced_retrieval', params: { pairs: 8, distractorDuration: 35 } } } },
    }
  },
  gc_verbal_inference: {
    gameId: "gc_verbal_inference",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { timeLimit: 15000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } }, neutral: { sub_variant: "analogy", params: { word_rarity: 1000 } }, music: { sub_variant: 'knowledge', params: { type: 'instrument_family', complexity: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { word_rarity: 'common' } }, spatial: { sub_variant: 'spatial_lexicon', params: { type: 'preposition' } } } },
      2: { mechanic_config: { timeLimit: 15000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } } } },
      3: { mechanic_config: { timeLimit: 15000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 1 } } } },
      4: { mechanic_config: { timeLimit: 15000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } } } },
      5: { mechanic_config: { timeLimit: 15000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } } } },
      6: { mechanic_config: { timeLimit: 15000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 2 } } } },
      7: { mechanic_config: { timeLimit: 15000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } } } },
      8: { mechanic_config: { timeLimit: 15000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } } } },
      9: { mechanic_config: { timeLimit: 15000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } } } },
      10: { mechanic_config: { timeLimit: 15000 }, content_config: { math: { sub_variant: 'knowledge_retrieval', params: { question_level: 3 } } } },
    }
  },
  ef_focus_switch: {
    gameId: "ef_focus_switch",
    sessionLength: 20,
    windowSize: 15,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.68,
    levelMap: {
      1: { mechanic_config: { switchInterval: 8, noGo: false, responseWindowMs: 3000, switchProbability: 0 }, content_config: { neutral: { params: { ruleCount: 2, cueType: "explicit_text" } }, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { params: { ruleCount: 2, rules: ["pitch_direction", "rhythm_evenness"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category'], switch_interval: 10 } }, spatial: { sub_variant: 'perspective_shift', params: { cue: 'explicit' } } } },
      2: { mechanic_config: { switchInterval: 8, noGo: false, responseWindowMs: 2800, switchProbability: 0.1 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } } } },
      3: { mechanic_config: { switchInterval: 8, noGo: false, responseWindowMs: 2800, switchProbability: 0.15 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } } } },
      4: { mechanic_config: { switchInterval: 5, noGo: false, responseWindowMs: 2500, switchProbability: 0.2 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } } } },
      5: { mechanic_config: { switchInterval: 5, noGo: false, responseWindowMs: 2500, switchProbability: 0.25 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } } } },
      6: { mechanic_config: { switchInterval: 4, noGo: false, responseWindowMs: 2200, switchProbability: 0.3 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } } } },
      7: { mechanic_config: { switchInterval: 4, noGo: true, noGoWaitMs: 1500, responseWindowMs: 2200, switchProbability: 0.3 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } } } },
      8: { mechanic_config: { switchInterval: 3, noGo: true, noGoWaitMs: 1500, responseWindowMs: 2000, switchProbability: 0.3 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } } } },
      9: { mechanic_config: { switchInterval: 3, noGo: true, noGoWaitMs: 1400, responseWindowMs: 1800, switchProbability: 0.35 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } } } },
      10: { mechanic_config: { switchInterval: 2, noGo: true, noGoWaitMs: 1300, responseWindowMs: 1800, switchProbability: 0.4 }, content_config: { math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } } } },
    }
  }
};

export const difficultyPolicies = policies as Record<GameId, DifficultyPolicy>;
