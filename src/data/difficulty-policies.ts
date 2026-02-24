
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
      1: { mechanic_config: { responseWindowMs: 5000, distractorCount: 2 }, content_config: { math: { params: { type: "parity" } }, neutral: { params: { complexity: "simple" } }, music: { sub_variant: 'symbol_match', params: { set: ['treble', 'bass', 'quarter', 'half'] }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 4, frequency_min: 7 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'cardinal' }} } },
      2: { mechanic_config: { responseWindowMs: 4500, distractorCount: 2 }, content_config: { math: { params: { type: "sign" } }, neutral: { params: { complexity: "simple" } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'octave'], direction: true }}, verbal: { sub_variant: 'synonym_match', params: { word_length: 4, frequency_min: 7 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'cardinal' }} } },
      3: { mechanic_config: { responseWindowMs: 4000, distractorCount: 3 }, content_config: { math: { params: { type: "parity" } }, neutral: { params: { complexity: "simple" } }, music: { sub_variant: 'symbol_match', params: { set: ['treble', 'bass', 'quarter', 'half', 'eighth', 'sharp'] }}, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'any' }} } },
      4: { mechanic_config: { responseWindowMs: 3500, distractorCount: 3 }, content_config: { math: { params: { type: "magnitude", threshold: 5 } }, neutral: { params: { complexity: "simple" } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'M3', 'm3'], direction: true }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 5, frequency_min: 6 } }, spatial: { sub_variant: 'rapid_rotation', params: { shape: 'simple', rotation: 'any', mirror: true }} } },
      5: { mechanic_config: { responseWindowMs: 3000, distractorCount: 4 }, content_config: { math: { params: { type: "sign" } }, neutral: { params: { complexity: "moderate" } }, music: { sub_variant: 'rhythm_compare', params: { types: ['simple_duple'] }}, verbal: { sub_variant: 'synonym_match', params: { word_length: 5, frequency_min: 6 } }, spatial: { sub_variant: 'target_interception', params: { speed: 1, prediction: false }} } },
      6: { mechanic_config: { responseWindowMs: 2800, distractorCount: 4 }, content_config: { math: { params: { type: "parity" } }, neutral: { params: { complexity: "moderate" } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'M3', 'm3', 'M6', 'm6'], direction: false }}, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 5 } }, spatial: { sub_variant: 'target_interception', params: { speed: 1.2, prediction: true }} } },
      7: { mechanic_config: { responseWindowMs: 2500, distractorCount: 5 }, content_config: { math: { params: { type: "magnitude", threshold: 5 } }, neutral: { params: { complexity: "moderate" } }, music: {}, verbal: {}, spatial: {} } },
      8: { mechanic_config: { responseWindowMs: 2200, distractorCount: 5 }, content_config: { math: { params: { type: "sign" } }, neutral: { params: { complexity: "complex" } }, music: {}, verbal: {}, spatial: {} } },
      9: { mechanic_config: { responseWindowMs: 2000, distractorCount: 6 }, content_config: { math: { params: { type: "parity" } }, neutral: { params: { complexity: "complex" } }, music: {}, verbal: {}, spatial: {} } },
      10: { mechanic_config: { responseWindowMs: 1800, distractorCount: 6 }, content_config: { math: { params: { type: "magnitude", threshold: 5 } }, neutral: { params: { complexity: "complex" } }, music: {}, verbal: {}, spatial: {} } },
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
      1: { mechanic_config: {}, content_config: { math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 1 } } } },
      2: { mechanic_config: {}, content_config: { math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 1 } } } },
      3: { mechanic_config: {}, content_config: { math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 1 } } } },
      4: { mechanic_config: {}, content_config: { math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 2 } } } },
      5: { mechanic_config: {}, content_config: { math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 2 } } } },
      6: { mechanic_config: {}, content_config: { math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 2 } } } },
      7: { mechanic_config: {}, content_config: { math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 3 } } } },
      8: { mechanic_config: {}, content_config: { math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 3 } } } },
      9: { mechanic_config: {}, content_config: { math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 3 } } } },
      10: { mechanic_config: {}, content_config: { math: { sub_variant: "spatial_assembly", params: { puzzle_tier: 3 } } } },
    }
  },
  ga_auditory_lab: {
    gameId: "ga_auditory_lab",
    sessionLength: 12,
    windowSize: 10,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.65,
    levelMap: {
      1: { mechanic_config: {}, content_config: { math: { params: { digits: 3, speechRate: 1.0, pitchDelta: 800 } } } },
      2: { mechanic_config: {}, content_config: { math: { params: { digits: 3, speechRate: 1.0, pitchDelta: 600 } } } },
      3: { mechanic_config: {}, content_config: { math: { params: { digits: 3, speechRate: 1.0, pitchDelta: 400 } } } },
      4: { mechanic_config: {}, content_config: { math: { params: { digits: 3, speechRate: 1.2, pitchDelta: 300 } } } },
      5: { mechanic_config: {}, content_config: { math: { params: { digits: 3, speechRate: 1.2, pitchDelta: 200 } } } },
      6: { mechanic_config: {}, content_config: { math: { params: { digits: 3, speechRate: 1.4, pitchDelta: 150 } } } },
      7: { mechanic_config: {}, content_config: { math: { params: { digits: 3, speechRate: 1.4, pitchDelta: 100 } } } },
      8: { mechanic_config: {}, content_config: { math: { params: { digits: 3, speechRate: 1.6, pitchDelta: 75 } } } },
      9: { mechanic_config: {}, content_config: { math: { params: { digits: 3, speechRate: 1.6, pitchDelta: 60 } } } },
      10: { mechanic_config: {}, content_config: { math: { params: { digits: 3, speechRate: 1.8, pitchDelta: 50 } } } },
    }
  },
  glr_fluency_storm: {
    gameId: "glr_fluency_storm",
    sessionLength: 1, 
    windowSize: 1,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: {}, content_config: { math: { params: { pairs: 4, distractorDuration: 10 } } } },
      2: { mechanic_config: {}, content_config: { math: { params: { pairs: 4, distractorDuration: 15 } } } },
      3: { mechanic_config: {}, content_config: { math: { params: { pairs: 5, distractorDuration: 15 } } } },
      4: { mechanic_config: {}, content_config: { math: { params: { pairs: 5, distractorDuration: 20 } } } },
      5: { mechanic_config: {}, content_config: { math: { params: { pairs: 6, distractorDuration: 20 } } } },
      6: { mechanic_config: {}, content_config: { math: { params: { pairs: 6, distractorDuration: 25 } } } },
      7: { mechanic_config: {}, content_config: { math: { params: { pairs: 7, distractorDuration: 25 } } } },
      8: { mechanic_config: {}, content_config: { math: { params: { pairs: 7, distractorDuration: 30 } } } },
      9: { mechanic_config: {}, content_config: { math: { params: { pairs: 8, distractorDuration: 30 } } } },
      10: { mechanic_config: {}, content_config: { math: { params: { pairs: 8, distractorDuration: 35 } } } },
    }
  },
  gc_verbal_inference: {
    gameId: "gc_verbal_inference",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { params: { question_level: 1 } }, neutral: { sub_variant: "analogy", params: { word_rarity: 1000 } }, music: { sub_variant: 'knowledge', params: { type: 'instrument_family', complexity: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { word_rarity: 'common' } }, spatial: { sub_variant: 'spatial_lexicon', params: { type: 'preposition' } } } },
      2: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { params: { question_level: 1 } } } },
      3: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { params: { question_level: 1 } } } },
      4: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { params: { question_level: 2 } } } },
      5: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { params: { question_level: 2 } } } },
      6: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { params: { question_level: 2 } } } },
      7: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { params: { question_level: 2 } } } },
      8: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { params: { question_level: 3 } } } },
      9: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { params: { question_level: 3 } } } },
      10: { mechanic_config: { timeLimit: 20000 }, content_config: { math: { params: { question_level: 3 } } } },
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

export const difficultyPolicies = policies;
