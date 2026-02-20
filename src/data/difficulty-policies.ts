
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
        mechanic_config: { sequenceLength: 3, displayTimeMs: 2000 }, 
        content_config: { 
          neutral: { params: { chars: "alpha" } }, 
          math: { params: { chars: "numeric" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes", complexity: 1 } },
          verbal: { sub_variant: 'phonological_loop', params: { sequenceType: 'distinct_phonemes' } }
        } 
      },
      2: { 
        mechanic_config: { sequenceLength: 4, displayTimeMs: 2000 }, 
        content_config: { 
          neutral: { params: { chars: "alpha" } }, 
          math: { params: { chars: "numeric" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes", complexity: 1 } },
          verbal: { sub_variant: 'phonological_loop', params: { sequenceType: 'distinct_phonemes' } }
        } 
      },
      3: { 
        mechanic_config: { sequenceLength: 4, displayTimeMs: 1800 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['quarter'], complexity: 2 } },
          verbal: { sub_variant: 'phonological_loop', params: { sequenceType: 'similar_phonemes' } }
        } 
      },
      4: { 
        mechanic_config: { sequenceLength: 5, displayTimeMs: 1800 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes_symbols", complexity: 2 } },
          verbal: { sub_variant: 'phonological_loop', params: { sequenceType: 'similar_phonemes' } }
        } 
      },
      5: { 
        mechanic_config: { sequenceLength: 5, displayTimeMs: 1500 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['quarter', 'eighth'], complexity: 3 } },
          verbal: { sub_variant: 'grammatical_recall', params: { error_type: 'tense' } }
        } 
      },
      6: { 
        mechanic_config: { sequenceLength: 6, displayTimeMs: 1500 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes_symbols", complexity: 3 } },
          verbal: { sub_variant: 'phonological_loop', params: { sequenceType: 'pseudowords' } }
        } 
      },
      7: { 
        mechanic_config: { sequenceLength: 6, displayTimeMs: 1200 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['quarter', 'eighth'], complexity: 4 } },
          verbal: { sub_variant: 'grammatical_recall', params: { error_type: 'agreement' } }
        } 
      },
      8: { 
        mechanic_config: { sequenceLength: 7, displayTimeMs: 1200 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes_symbols", complexity: 4 } },
          verbal: { sub_variant: 'phonological_loop', params: { sequenceType: 'pseudowords_similar' } }
        } 
      },
      9: { 
        mechanic_config: { sequenceLength: 7, displayTimeMs: 1000 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['quarter', 'eighth', 'sixteenth'], complexity: 5 } },
          verbal: { sub_variant: 'grammatical_recall', params: { error_type: 'pluralization' } }
        } 
      },
      10: { 
        mechanic_config: { sequenceLength: 8, displayTimeMs: 1000 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes_symbols", complexity: 5 } },
          verbal: { sub_variant: 'phonological_loop', params: { sequenceType: 'pseudowords_similar' } }
        } 
      },
      11: { 
        mechanic_config: { sequenceLength: 8, displayTimeMs: 900 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['quarter', 'eighth', 'sixteenth'], complexity: 6, syncopation: true } },
          verbal: { sub_variant: 'grammatical_recall', params: { error_type: 'mixed' } }
        } 
      },
      12: { 
        mechanic_config: { sequenceLength: 9, displayTimeMs: 900 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes_symbols", complexity: 6 } },
          verbal: { sub_variant: 'n_back', params: { n: 1, sequenceType: 'phonological' } }
        } 
      },
      13: { 
        mechanic_config: { sequenceLength: 9, displayTimeMs: 800 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['sixteenth', 'triplet'], complexity: 7, syncopation: true } },
          verbal: { sub_variant: 'n_back', params: { n: 1, sequenceType: 'semantic' } }
        } 
      },
      14: { 
        mechanic_config: { sequenceLength: 10, displayTimeMs: 800 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes_symbols", complexity: 7 } },
          verbal: { sub_variant: 'n_back', params: { n: 2, sequenceType: 'phonological' } }
        } 
      },
      15: { 
        mechanic_config: { sequenceLength: 10, displayTimeMs: 700 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['sixteenth', 'triplet'], complexity: 8, syncopation: true } },
          verbal: { sub_variant: 'n_back', params: { n: 2, sequenceType: 'semantic' } }
        } 
      },
      16: { 
        mechanic_config: { sequenceLength: 11, displayTimeMs: 700 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes_symbols", complexity: 8 } },
          verbal: { sub_variant: 'n_back', params: { n: 2, sequenceType: 'phonological', lures: true } }
        } 
      },
      17: { 
        mechanic_config: { sequenceLength: 11, displayTimeMs: 600 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['thirtysecond', 'triplet'], complexity: 9, syncopation: true } },
          verbal: { sub_variant: 'n_back', params: { n: 2, sequenceType: 'semantic', lures: true } }
        } 
      },
      18: { 
        mechanic_config: { sequenceLength: 12, displayTimeMs: 600 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes_symbols", complexity: 9 } },
          verbal: { sub_variant: 'n_back', params: { n: 3, sequenceType: 'phonological' } }
        } 
      },
      19: { 
        mechanic_config: { sequenceLength: 12, displayTimeMs: 500 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'rhythm_span', params: { subdivisions: ['thirtysecond', 'triplet'], complexity: 10, syncopation: true } },
          verbal: { sub_variant: 'n_back', params: { n: 3, sequenceType: 'semantic' } }
        } 
      },
      20: { 
        mechanic_config: { sequenceLength: 12, displayTimeMs: 500 }, 
        content_config: { 
          neutral: { params: { chars: "alphanumeric" } }, 
          math: { params: { chars: "numeric_ops" } }, 
          music: { sub_variant: 'sequence_recall', params: { chars: "notes_symbols", complexity: 10 } },
          verbal: { sub_variant: 'n_back', params: { n: 3, sequenceType: 'semantic', lures: true } }
        } 
      },
    }
  },
  gs_rapid_code: {
    gameId: "gs_rapid_code",
    sessionLength: 40,
    windowSize: 15,
    targetAccuracyHigh: 0.90,
    targetAccuracyLow: 0.70,
    levelMap: {
      1: { mechanic_config: { responseWindowMs: 3000, distractorCount: 3 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 1 } }, music: { sub_variant: 'symbol_match', params: { set: ['treble', 'bass', 'quarter', 'half'] }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 4, frequency_min: 7 } } } },
      2: { mechanic_config: { responseWindowMs: 2500, distractorCount: 3 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal'], decimal_places: 2 } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'octave'], direction: true }}, verbal: { sub_variant: 'synonym_match', params: { word_length: 4, frequency_min: 7 } } } },
      3: { mechanic_config: { responseWindowMs: 2500, distractorCount: 4 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 2 } }, music: { sub_variant: 'symbol_match', params: { set: ['treble', 'bass', 'quarter', 'half', 'eighth', 'sharp'] }}, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 6 } } } },
      4: { mechanic_config: { responseWindowMs: 2000, distractorCount: 4 }, content_config: { neutral: { params: { complexity: "simple" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal', 'fraction'], max_denominator: 8 } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'M3', 'm3'], direction: true }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 5, frequency_min: 6 } } } },
      5: { mechanic_config: { responseWindowMs: 2000, distractorCount: 5 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal', 'fraction'], max_denominator: 12 } }, music: { sub_variant: 'rhythm_compare', params: { types: ['simple_duple'] }}, verbal: { sub_variant: 'synonym_match', params: { word_length: 5, frequency_min: 6 } } } },
      6: { mechanic_config: { responseWindowMs: 1800, distractorCount: 5 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal', 'fraction', 'percent'], max_denominator: 12 } }, music: { sub_variant: 'interval_compare', params: { types: ['P5', 'M3', 'm3', 'M6', 'm6'], direction: false }}, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 5 } } } },
      7: { mechanic_config: { responseWindowMs: 1600, distractorCount: 6 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 3 } }, music: { sub_variant: 'rhythm_compare', params: { types: ['simple_triple', 'dotted'] }}, verbal: { sub_variant: 'grammaticality_judgment', params: { error_type: 'tense' } } } },
      8: { mechanic_config: { responseWindowMs: 1400, distractorCount: 6 }, content_config: { neutral: { params: { complexity: "moderate" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal', 'fraction', 'percent'], max_denominator: 20, allow_negatives: false } }, music: { sub_variant: 'interval_compare', params: { types: ['diatonic'], direction: false }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 6, frequency_min: 5 } } } },
      9: { mechanic_config: { responseWindowMs: 1200, distractorCount: 7 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal', 'fraction', 'percent'], max_denominator: 20, allow_negatives: true } }, music: { sub_variant: 'rhythm_compare', params: { types: ['syncopated'] }}, verbal: { sub_variant: 'synonym_match', params: { word_length: 6, frequency_min: 5, abstract: true } } } },
      10: { mechanic_config: { responseWindowMs: 1200, distractorCount: 7 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 4 } }, music: { sub_variant: 'interval_compare', params: { types: ['chromatic'], direction: false }}, verbal: { sub_variant: 'grammaticality_judgment', params: { error_type: 'agreement' } } } },
      11: { mechanic_config: { responseWindowMs: 1000, distractorCount: 8 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal', 'fraction', 'percent'], max_denominator: 20, allow_negatives: true } }, music: { sub_variant: 'rhythm_compare', params: { types: ['polymeter'] }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 7, frequency_min: 4 } } } },
      12: { mechanic_config: { responseWindowMs: 900, distractorCount: 8 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 5 } }, music: { sub_variant: 'interval_compare', params: { types: ['chromatic'], direction: false }}, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 4 } } } },
      13: { mechanic_config: { responseWindowMs: 800, distractorCount: 9 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal', 'fraction', 'percent'], max_denominator: 100, allow_negatives: true } }, music: { sub_variant: 'rhythm_compare', params: { types: ['complex_polymeter'] }}, verbal: { sub_variant: 'grammaticality_judgment', params: { error_type: 'mixed' } } } },
      14: { mechanic_config: { responseWindowMs: 700, distractorCount: 9 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 5 } }, music: { sub_variant: 'interval_compare', params: { types: ['microtonal'], direction: false }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 8, frequency_min: 3 } } } },
      15: { mechanic_config: { responseWindowMs: 600, distractorCount: 9 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal', 'fraction', 'percent'], max_denominator: 100, allow_negatives: true } }, music: { sub_variant: 'rhythm_compare', params: { types: ['complex_polymeter'] }}, verbal: { sub_variant: 'synonym_match', params: { word_length: 8, frequency_min: 3, abstract: true } } } },
      16: { mechanic_config: { responseWindowMs: 500, distractorCount: 9 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 6 } }, music: { sub_variant: 'interval_compare', params: { types: ['microtonal'], direction: false }}, verbal: { sub_variant: 'grammaticality_judgment', params: { error_type: 'mixed_complex' } } } },
      17: { mechanic_config: { responseWindowMs: 450, distractorCount: 9 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal', 'fraction', 'percent'], max_denominator: 100, allow_negatives: true } }, music: { sub_variant: 'rhythm_compare', params: { types: ['complex_polymeter'] }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 9, frequency_min: 2 } } } },
      18: { mechanic_config: { responseWindowMs: 400, distractorCount: 9 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 6 } }, music: { sub_variant: 'interval_compare', params: { types: ['microtonal'], direction: false }}, verbal: { sub_variant: 'homophone_hunter', params: { frequency_min: 2 } } } },
      19: { mechanic_config: { responseWindowMs: 350, distractorCount: 9 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "magnitude_comparison", params: { formats: ['decimal', 'fraction', 'percent'], max_denominator: 100, allow_negatives: true } }, music: { sub_variant: 'rhythm_compare', params: { types: ['complex_polymeter'] }}, verbal: { sub_variant: 'grammaticality_judgment', params: { error_type: 'mixed_complex' } } } },
      20: { mechanic_config: { responseWindowMs: 300, distractorCount: 9 }, content_config: { neutral: { params: { complexity: "high" } }, math: { sub_variant: "symbol_substitution", params: { complexity: 6 } }, music: { sub_variant: 'interval_compare', params: { types: ['microtonal'], direction: false }}, verbal: { sub_variant: 'lexical_decision', params: { word_length: 10, frequency_min: 1 } } } },
    }
  },
  gf_pattern_matrix: {
    gameId: "gf_pattern_matrix",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { gridSize: "2x2", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape" } }, math: { sub_variant: "deterministic", params: { rule: "arithmetic_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'transposition', complexity: 1 } }, verbal: { sub_variant: 'morphological_analogy', params: { rule_type: 'pluralization' } } } },
      2: { mechanic_config: { gridSize: "2x2", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "color" } }, math: { sub_variant: "deterministic", params: { rule: "geometric_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'transposition', complexity: 2 } }, verbal: { sub_variant: 'morphological_analogy', params: { rule_type: 'tense_change' } } } },
      3: { mechanic_config: { gridSize: "3x3", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape" } }, math: { sub_variant: "deterministic", params: { rule: "arithmetic_sequence" } }, music: { sub_variant: 'rhythmic_pattern', params: { rule: 'augmentation', complexity: 1 } }, verbal: { sub_variant: 'orthographic_analogy', params: { rule_type: 'vowel_shift' } } } },
      4: { mechanic_config: { gridSize: "3x3", distractor_similarity: "low" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "color" } }, math: { sub_variant: "deterministic", params: { rule: "geometric_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'inversion', complexity: 2 } }, verbal: { sub_variant: 'morphological_analogy', params: { rule_type: 'antonym' } } } },
      5: { mechanic_config: { gridSize: "2x2", distractor_similarity: "medium" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color" } }, math: { sub_variant: "probabilistic", params: { samples: 5, populationSize: 30 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'diatonic_progression', complexity: 1 } }, verbal: { sub_variant: 'morphological_analogy', params: { rule_type: 'derivational' } } } },
      6: { mechanic_config: { gridSize: "2x2", distractor_similarity: "medium" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+rotation" } }, math: { sub_variant: "deterministic", params: { rule: "fibonacci_sequence" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'retrograde', complexity: 3 } }, verbal: { sub_variant: 'orthographic_analogy', params: { rule_type: 'consonant_shift' } } } },
      7: { mechanic_config: { gridSize: "3x3", distractor_similarity: "medium" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color" } }, math: { sub_variant: "probabilistic", params: { samples: 7, populationSize: 40, noise: 0.1 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'diatonic_progression', complexity: 2 } }, verbal: { sub_variant: 'phonetic_analogy', params: { rule_type: 'vowel_shift' } } } },
      8: { mechanic_config: { gridSize: "3x3", distractor_similarity: "medium" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+rotation" } }, math: { sub_variant: "deterministic", params: { rule: "fibonacci_sequence" } }, music: { sub_variant: 'rhythmic_pattern', params: { rule: 'diminution', complexity: 2 } }, verbal: { sub_variant: 'morphological_analogy', params: { rule_type: 'derivational_complex' } } } },
      9: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "color+fill" } }, math: { sub_variant: "probabilistic", params: { samples: 9, populationSize: 50, noise: 0.15 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'modal_interchange', complexity: 3 } }, verbal: { sub_variant: 'semantic_analogy', params: { rule_type: 'part_to_whole' } } } },
      10: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color+rotation" } }, math: { sub_variant: "deterministic", params: { rule: "alternating_series" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'transposition+inversion', complexity: 4 } }, verbal: { sub_variant: 'phonetic_analogy', params: { rule_type: 'consonant_cluster_transform' } } } },
      11: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color+fill" } }, math: { sub_variant: "probabilistic", params: { samples: 10, populationSize: 60, noise: 0.2 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'secondary_dominant', complexity: 4 } }, verbal: { sub_variant: 'semantic_analogy', params: { rule_type: 'cause_to_effect' } } } },
      12: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+rotation+fill" } }, math: { sub_variant: "deterministic", params: { rule: "two_rule_arithmetic" } }, music: { sub_variant: 'rhythmic_pattern', params: { rule: 'polymeter', complexity: 3 } }, verbal: { sub_variant: 'phonetic_analogy', params: { rule_type: 'syllable_rearrangement' } } } },
      13: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color+rotation" } }, math: { sub_variant: "probabilistic", params: { samples: 12, populationSize: 70, noise: 0.25 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'tritone_substitution', complexity: 5 } }, verbal: { sub_variant: 'semantic_analogy', params: { rule_type: 'user_to_tool' } } } },
      14: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color+fill" } }, math: { sub_variant: "deterministic", params: { rule: "coordinate_translation" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'atonal_row', complexity: 5 } }, verbal: { sub_variant: 'phonetic_analogy', params: { rule_type: 'abstract_sound_symbolism' } } } },
      15: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+rotation+fill" } }, math: { sub_variant: "probabilistic", params: { samples: 15, populationSize: 80, noise: 0.3 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'non_functional', complexity: 6 } }, verbal: { sub_variant: 'semantic_analogy', params: { rule_type: 'abstract_transformation' } } } },
      16: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color+rotation+fill" } }, math: { sub_variant: "deterministic", params: { rule: "coordinate_rotation" } }, music: { sub_variant: 'rhythmic_pattern', params: { rule: 'metric_modulation', complexity: 4 } }, verbal: { sub_variant: 'phonetic_analogy', params: { rule_type: 'abstract_sound_symbolism' } } } },
      17: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color+rotation+fill" } }, math: { sub_variant: "probabilistic", params: { samples: 20, populationSize: 100, noise: 0.35 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'non_functional', complexity: 7 } }, verbal: { sub_variant: 'semantic_analogy', params: { rule_type: 'abstract_transformation' } } } },
      18: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color+rotation+fill" } }, math: { sub_variant: "deterministic", params: { rule: "algebraic_identity" } }, music: { sub_variant: 'melodic_pattern', params: { rule: 'atonal_row', complexity: 6 } }, verbal: { sub_variant: 'phonetic_analogy', params: { rule_type: 'abstract_sound_symbolism' } } } },
      19: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color+rotation+fill" } }, math: { sub_variant: "probabilistic", params: { samples: 25, populationSize: 120, noise: 0.4 } }, music: { sub_variant: 'harmony_logic', params: { rule: 'non_functional', complexity: 8 } }, verbal: { sub_variant: 'semantic_analogy', params: { rule_type: 'abstract_transformation' } } } },
      20: { mechanic_config: { gridSize: "3x3", distractor_similarity: "high" }, content_config: { neutral: { sub_variant: 'default', params: { rule: "shape+color+rotation+fill" } }, math: { sub_variant: "deterministic", params: { rule: "three_rule_mixed" } }, music: { sub_variant: 'rhythmic_pattern', params: { rule: 'metric_modulation', complexity: 5 } }, verbal: { sub_variant: 'phonetic_analogy', params: { rule_type: 'abstract_sound_symbolism' } } } },
    }
  },
  gv_visual_lab: {
    gameId: "gv_visual_lab",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.65,
    levelMap: {
      1: { mechanic_config: { distractorCount: 3, responseWindowMs: 5000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: [90, 180, 270] } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 2, equationTerms: 2, maxWeight: 3} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q'], distractorCount: 1 } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'compound', complexity: 1 } } } },
      2: { mechanic_config: { distractorCount: 3, responseWindowMs: 4500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: [90, 180, 270] } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 2, equationTerms: 3, maxWeight: 3} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q'], distractorCount: 2 } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'compound', complexity: 2 } } } },
      3: { mechanic_config: { distractorCount: 4, responseWindowMs: 4500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free" } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 3, equationTerms: 3, maxWeight: 3} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q'], distractorCount: 2 } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'affixes', complexity: 1 } } } },
      4: { mechanic_config: { distractorCount: 4, responseWindowMs: 4000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free" } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 3, equationTerms: 3, maxWeight: 4} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q'], distractorCount: 3 } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'affixes', complexity: 2 } } } },
      5: { mechanic_config: { distractorCount: 4, responseWindowMs: 3500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 3, equationTerms: 4, maxWeight: 4} }, music: { sub_variant: "spectrogram_match", params: { timbres: ['sine', 'square'], distractorCount: 3 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 5, target_length: 3 } } } },
      6: { mechanic_config: { distractorCount: 4, responseWindowMs: 3000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 4, equationTerms: 4, maxWeight: 4} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q', 'q_up_q_down'], distractorCount: 3 } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'affixes', complexity: 3 } } } },
      7: { mechanic_config: { distractorCount: 5, responseWindowMs: 3000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "scaling_puzzle", params: { dimensions: 2, scale_factor_max: 3 } }, music: { sub_variant: "spectrogram_match", params: { timbres: ['sine', 'square', 'sawtooth'], distractorCount: 3 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 6, target_length: 4 } } } },
      8: { mechanic_config: { distractorCount: 5, responseWindowMs: 2500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 4, equationTerms: 5, maxWeight: 5} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q', 'q_up_q_down', 'dotted_q_e'], distractorCount: 3 } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'complex_affixes', complexity: 1 } } } },
      9: { mechanic_config: { distractorCount: 5, responseWindowMs: 2500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "scaling_puzzle", params: { dimensions: 3, scale_factor_max: 3 } }, music: { sub_variant: "spectrogram_match", params: { timbres: ['sine', 'square', 'sawtooth', 'triangle'], distractorCount: 4 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 7, target_length: 5 } } } },
      10: { mechanic_config: { distractorCount: 6, responseWindowMs: 2000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 5, equationTerms: 5, maxWeight: 6} }, music: { sub_variant: "contour_match", params: { measures: ['q_q_h', 'h_q_q', 'e_e_q_q', 'q_up_q_down', 'dotted_q_e'], distractorCount: 4 } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'jumbled_letters', word_length: 6 } } } },
      11: { mechanic_config: { distractorCount: 6, responseWindowMs: 2000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "scaling_puzzle", params: { dimensions: 3, scale_factor_max: 4 } }, music: { sub_variant: "spectrogram_match", params: { timbres: ['piano', 'guitar'], distractorCount: 4 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 8, target_length: 6 } } } },
      12: { mechanic_config: { distractorCount: 6, responseWindowMs: 1800 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 5, equationTerms: 6, maxWeight: 7} }, music: { sub_variant: "contour_match", params: { measures: ['all'], distractorCount: 4 } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'jumbled_letters', word_length: 7 } } } },
      13: { mechanic_config: { distractorCount: 6, responseWindowMs: 1800 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "scaling_puzzle", params: { dimensions: 3, scale_factor_max: 5, non_integer_scales: true } }, music: { sub_variant: "spectrogram_match", params: { timbres: ['piano', 'guitar', 'violin'], distractorCount: 4 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 9, target_length: 7 } } } },
      14: { mechanic_config: { distractorCount: 7, responseWindowMs: 1500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 5, equationTerms: 7, maxWeight: 8} }, music: { sub_variant: "contour_match", params: { measures: ['all'], distractorCount: 4, rhythmic_variation: true } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'jumbled_letters', word_length: 8 } } } },
      15: { mechanic_config: { distractorCount: 7, responseWindowMs: 1500 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "scaling_puzzle", params: { dimensions: 3, scale_factor_max: 5, non_integer_scales: true } }, music: { sub_variant: "spectrogram_match", params: { timbres: ['piano', 'guitar', 'violin', 'trumpet'], distractorCount: 4 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 10, target_length: 8 } } } },
      16: { mechanic_config: { distractorCount: 7, responseWindowMs: 1200 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 5, equationTerms: 8, maxWeight: 9} }, music: { sub_variant: "contour_match", params: { measures: ['all'], distractorCount: 4, rhythmic_variation: true } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'jumbled_letters', word_length: 9 } } } },
      17: { mechanic_config: { distractorCount: 7, responseWindowMs: 1200 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "scaling_puzzle", params: { dimensions: 3, scale_factor_max: 6, non_integer_scales: true } }, music: { sub_variant: "spectrogram_match", params: { timbres: ['all_acoustic'], distractorCount: 4 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 11, target_length: 9 } } } },
      18: { mechanic_config: { distractorCount: 8, responseWindowMs: 1000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 5, equationTerms: 9, maxWeight: 10} }, music: { sub_variant: "contour_match", params: { measures: ['all'], distractorCount: 4, rhythmic_variation: true, atonal: true } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'jumbled_letters', word_length: 10 } } } },
      19: { mechanic_config: { distractorCount: 8, responseWindowMs: 1000 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "scaling_puzzle", params: { dimensions: 3, scale_factor_max: 6, non_integer_scales: true } }, music: { sub_variant: "spectrogram_match", params: { timbres: ['all_synths'], distractorCount: 4 } }, verbal: { sub_variant: 'visual_scan', params: { grid_size: 12, target_length: 10 } } } },
      20: { mechanic_config: { distractorCount: 8, responseWindowMs: 800 }, content_config: { neutral: { sub_variant: "mental_rotation", params: { angles: "free", reflection: true } }, math: { sub_variant: "balance_puzzle", params: { shapeCount: 5, equationTerms: 10, maxWeight: 10} }, music: { sub_variant: "contour_match", params: { measures: ['all'], distractorCount: 4, rhythmic_variation: true, atonal: true } }, verbal: { sub_variant: 'orthographic_construction', params: { type: 'jumbled_letters', word_length: 12 } } } },
    }
  },
  ga_auditory_lab: {
    gameId: "ga_auditory_lab",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.65,
    levelMap: {
        1: { mechanic_config: { noiseLevel: 0, responseWindowMs: 3000 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 120 } }, math: { sub_variant: "auditory_calculation", params: { operands: 2, operations: ['+'] } }, music: { sub_variant: 'pitch_discrimination', params: { freqDelta: 50 } }, verbal: { sub_variant: 'phoneme_discrimination', params: { noise_level: 0, pairs: ['p', 'b'] } } } },
        2: { mechanic_config: { noiseLevel: 0, responseWindowMs: 3000 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 100 } }, math: { sub_variant: "auditory_calculation", params: { operands: 2, operations: ['+', '-'] } }, music: { sub_variant: 'rhythm_matching', params: { complexity: 1 } }, verbal: { sub_variant: 'phoneme_discrimination', params: { noise_level: 0, pairs: ['p', 'b', 't', 'd'] } } } },
        3: { mechanic_config: { noiseLevel: 0.1, responseWindowMs: 2800 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 80 } }, math: { sub_variant: "auditory_calculation", params: { operands: 3, operations: ['+', '-'] } }, music: { sub_variant: 'pitch_discrimination', params: { freqDelta: 40 } }, verbal: { sub_variant: 'minimal_pair_identification', params: { noise_level: 0.1 } } } },
        4: { mechanic_config: { noiseLevel: 0.1, responseWindowMs: 2800 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 60 } }, math: { sub_variant: "auditory_calculation", params: { operands: 3, operations: ['+', '-'] } }, music: { sub_variant: 'timbre_identification', params: { set: ['piano', 'guitar'] } }, verbal: { sub_variant: 'phoneme_discrimination', params: { noise_level: 0.2, pairs: ['s', 'z', 'f', 'v'] } } } },
        5: { mechanic_config: { noiseLevel: 0.1, responseWindowMs: 2500 }, content_config: { neutral: { sub_variant: "frequency_discrimination", params: { freqDelta: 40 } }, math: { sub_variant: "auditory_calculation", params: { operands: 3, operations: ['+', '-', '*'] } }, music: { sub_variant: 'rhythm_matching', params: { complexity: 2 } }, verbal: { sub_variant: 'prosody_identification', params: { noise_level: 0, emotions: ['happy', 'sad'] } } } },
        6: { mechanic_config: { noiseLevel: 0.2, responseWindowMs: 2500 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 40 } }, math: { sub_variant: "auditory_calculation", params: { operands: 4, operations: ['+', '-', '*'] } }, music: { sub_variant: 'pitch_discrimination', params: { freqDelta: 30 } }, verbal: { sub_variant: 'minimal_pair_identification', params: { noise_level: 0.3 } } } },
        7: { mechanic_config: { noiseLevel: 0.2, responseWindowMs: 2200 }, content_config: { neutral: { sub_variant: "frequency_discrimination", params: { freqDelta: 30 } }, math: { sub_variant: "auditory_calculation", params: { operands: 4, operations: ['+', '-', '*'] } }, music: { sub_variant: 'timbre_identification', params: { set: ['piano', 'guitar', 'violin'] } }, verbal: { sub_variant: 'phoneme_discrimination', params: { noise_level: 0.4, pairs: ['m', 'n'] } } } },
        8: { mechanic_config: { noiseLevel: 0.3, responseWindowMs: 2200 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 20 } }, math: { sub_variant: "auditory_calculation", params: { operands: 4, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'rhythm_matching', params: { complexity: 3, syncopation: true } }, verbal: { sub_variant: 'prosody_identification', params: { noise_level: 0.2, emotions: ['happy', 'sad', 'angry'] } } } },
        9: { mechanic_config: { noiseLevel: 0.3, responseWindowMs: 2000 }, content_config: { neutral: { sub_variant: "temporal_order", params: { ioiDelta: 80 } }, math: { sub_variant: "auditory_calculation", params: { operands: 5, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'pitch_discrimination', params: { freqDelta: 20 } }, verbal: { sub_variant: 'multi_stream_segregation', params: { num_streams: 2, snr: 5 } } } },
        10: { mechanic_config: { noiseLevel: 0.3, responseWindowMs: 2000 }, content_config: { neutral: { sub_variant: "frequency_discrimination", params: { freqDelta: 20 } }, math: { sub_variant: "auditory_calculation", params: { operands: 5, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'timbre_identification', params: { set: ['piano', 'guitar', 'violin', 'trumpet'] } }, verbal: { sub_variant: 'prosody_identification', params: { noise_level: 0.4, emotions: ['happy', 'sad', 'angry', 'surprised'] } } } },
        11: { mechanic_config: { noiseLevel: 0.4, responseWindowMs: 1800 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 15 } }, math: { sub_variant: "auditory_calculation", params: { operands: 5, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'rhythm_matching', params: { complexity: 4, syncopation: true } }, verbal: { sub_variant: 'multi_stream_segregation', params: { num_streams: 2, snr: 0 } } } },
        12: { mechanic_config: { noiseLevel: 0.4, responseWindowMs: 1800 }, content_config: { neutral: { sub_variant: "speech_in_noise", params: { snr: 5 } }, math: { sub_variant: "auditory_calculation", params: { operands: 6, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'pitch_discrimination', params: { freqDelta: 15 } }, verbal: { sub_variant: 'prosody_identification', params: { noise_level: 0.6, emotions: ['interrogative', 'declarative'] } } } },
        13: { mechanic_config: { noiseLevel: 0.4, responseWindowMs: 1600 }, content_config: { neutral: { sub_variant: "temporal_order", params: { ioiDelta: 40 } }, math: { sub_variant: "auditory_calculation", params: { operands: 6, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'stream_segregation', params: { voices: 2, complexity: 1 } }, verbal: { sub_variant: 'multi_stream_segregation', params: { num_streams: 3, snr: 5 } } } },
        14: { mechanic_config: { noiseLevel: 0.5, responseWindowMs: 1600 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 8 } }, math: { sub_variant: "auditory_calculation", params: { operands: 6, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'rhythm_matching', params: { complexity: 5, syncopation: true } }, verbal: { sub_variant: 'prosody_identification', params: { noise_level: 0.8, emotions: ['interrogative', 'declarative'] } } } },
        15: { mechanic_config: { noiseLevel: 0.5, responseWindowMs: 1500 }, content_config: { neutral: { sub_variant: "speech_in_noise", params: { snr: 0 } }, math: { sub_variant: "auditory_calculation", params: { operands: 7, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'pitch_discrimination', params: { freqDelta: 10 } }, verbal: { sub_variant: 'multi_stream_segregation', params: { num_streams: 3, snr: 0 } } } },
        16: { mechanic_config: { noiseLevel: 0.6, responseWindowMs: 1500 }, content_config: { neutral: { sub_variant: "gap_detection", params: { gapMs: 5 } }, math: { sub_variant: "auditory_calculation", params: { operands: 7, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'stream_segregation', params: { voices: 2, complexity: 2 } }, verbal: { sub_variant: 'prosody_identification', params: { noise_level: 1.0, emotions: ['interrogative', 'declarative', 'imperative'] } } } },
        17: { mechanic_config: { noiseLevel: 0.6, responseWindowMs: 1200 }, content_config: { neutral: { sub_variant: "frequency_discrimination", params: { freqDelta: 5 } }, math: { sub_variant: "auditory_calculation", params: { operands: 7, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'rhythm_matching', params: { complexity: 6, syncopation: true, polymeter: true } }, verbal: { sub_variant: 'multi_stream_segregation', params: { num_streams: 4, snr: 5 } } } },
        18: { mechanic_config: { noiseLevel: 0.7, responseWindowMs: 1200 }, content_config: { neutral: { sub_variant: "multi_stream", params: { snr: -5 } }, math: { sub_variant: "auditory_calculation", params: { operands: 8, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'pitch_discrimination', params: { freqDelta: 5, microtonal: true } }, verbal: { sub_variant: 'prosody_identification', params: { noise_level: 1.2, emotions: ['sarcastic', 'sincere'] } } } },
        19: { mechanic_config: { noiseLevel: 0.7, responseWindowMs: 1000 }, content_config: { neutral: { sub_variant: "temporal_order", params: { ioiDelta: 20 } }, math: { sub_variant: "auditory_calculation", params: { operands: 8, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'stream_segregation', params: { voices: 3, complexity: 1 } }, verbal: { sub_variant: 'multi_stream_segregation', params: { num_streams: 4, snr: 0 } } } },
        20: { mechanic_config: { noiseLevel: 0.8, responseWindowMs: 1000 }, content_config: { neutral: { sub_variant: "multi_stream", params: { snr: -10 } }, math: { sub_variant: "auditory_calculation", params: { operands: 8, operations: ['+', '-', '*', '/'] } }, music: { sub_variant: 'rhythm_matching', params: { complexity: 7, syncopation: true, polymeter: true } }, verbal: { sub_variant: 'prosody_identification', params: { noise_level: 1.5, emotions: ['sarcastic', 'sincere'] } } } },
    }
  },
  glr_fluency_storm: {
    gameId: "glr_fluency_storm",
    sessionLength: 1, 
    windowSize: 1,
    targetAccuracyHigh: 0.85,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { timeSec: 45, minTarget: 5 }, content_config: { neutral: { params: { category: "broad_concrete" } }, math: { params: { category: "broad_concrete" } }, music: { sub_variant: 'category_sprint', params: { category: "instrument_families" } }, verbal: { sub_variant: 'category_sprint', params: { category: 'Animals' } } } },
      2: { mechanic_config: { timeSec: 40, minTarget: 6 }, content_config: { neutral: { params: { category: "broad_concrete" } }, math: { params: { category: "broad_concrete" } }, music: { sub_variant: 'category_sprint', params: { category: "music_genres" } }, verbal: { sub_variant: 'category_sprint', params: { category: 'Foods' } } } },
      3: { mechanic_config: { timeSec: 40, minTarget: 5 }, content_config: { neutral: { params: { category: "narrow_concrete" } }, math: { params: { category: "narrow_concrete" } }, music: { sub_variant: 'motif_association', params: { complexity: 1 } }, verbal: { sub_variant: 'associative_chain', params: { rule: 'rhyme' } } } },
      4: { mechanic_config: { timeSec: 35, minTarget: 5 }, content_config: { neutral: { params: { category: "narrow_concrete" } }, math: { params: { category: "narrow_concrete" } }, music: { sub_variant: 'category_sprint', params: { category: "famous_composers" } }, verbal: { sub_variant: 'phonetic_fluency', params: { constraint: "Starts with 'tr-'" } } } },
      5: { mechanic_config: { timeSec: 35, minTarget: 4 }, content_config: { neutral: { params: { category: "functional" } }, math: { params: { category: "functional" } }, music: { sub_variant: 'motif_association', params: { complexity: 2 } }, verbal: { sub_variant: 'category_sprint', params: { category: 'Tools' } } } },
      6: { mechanic_config: { timeSec: 30, minTarget: 4 }, content_config: { neutral: { params: { category: "abstract" } }, math: { params: { category: "abstract" } }, music: { sub_variant: 'progression_recall', params: { complexity: 1 } }, verbal: { sub_variant: 'associative_chain', params: { rule: 'antonym' } } } },
      7: { mechanic_config: { timeSec: 30, minTarget: 6 }, content_config: { neutral: { params: { category: "functional" } }, math: { params: { category: "functional" } }, music: { sub_variant: 'category_sprint', params: { category: "italian_terms" } }, verbal: { sub_variant: 'phonetic_fluency', params: { constraint: "Ends with '-tion'" } } } },
      8: { mechanic_config: { timeSec: 30, minTarget: 5 }, content_config: { neutral: { params: { category: "abstract" } }, math: { params: { category: "abstract" } }, music: { sub_variant: 'motif_association', params: { complexity: 3 } }, verbal: { sub_variant: 'category_sprint', params: { category: 'Emotions' } } } },
      9: { mechanic_config: { timeSec: 25, minTarget: 3 }, content_config: { neutral: { params: { category: "compound" } }, math: { params: { category: "compound" } }, music: { sub_variant: 'progression_recall', params: { complexity: 2 } }, verbal: { sub_variant: 'dual_constraint_fluency', params: { constraint: "Adjectives that start with 'p'" } } } },
      10: { mechanic_config: { timeSec: 25, minTarget: 4 }, content_config: { neutral: { params: { category: "compound" } }, math: { params: { category: "compound" } }, music: { sub_variant: 'motif_association', params: { complexity: 4 } }, verbal: { sub_variant: 'associative_chain', params: { rule: 'semantic_link' } } } },
      11: { mechanic_config: { timeSec: 20, minTarget: 3 }, content_config: { neutral: { params: { category: "remote" } }, math: { params: { category: "remote" } }, music: { sub_variant: 'progression_recall', params: { complexity: 3 } }, verbal: { sub_variant: 'phonetic_fluency', params: { constraint: "Contains the sound 'sh'" } } } },
      12: { mechanic_config: { timeSec: 20, minTarget: 4 }, content_config: { neutral: { params: { category: "compound_abstract" } }, math: { params: { category: "compound_abstract" } }, music: { sub_variant: 'motif_association', params: { complexity: 5, transposition: true } }, verbal: { sub_variant: 'dual_constraint_fluency', params: { constraint: "Nouns that are also verbs" } } } },
      13: { mechanic_config: { timeSec: 20, minTarget: 2 }, content_config: { neutral: { params: { category: "remote" } }, math: { params: { category: "remote" } }, music: { sub_variant: 'progression_recall', params: { complexity: 4, transposition: true } }, verbal: { sub_variant: 'associative_chain', params: { rule: 'random' } } } },
      14: { mechanic_config: { timeSec: 20, minTarget: 3 }, content_config: { neutral: { params: { category: "compound_constrained" } }, math: { params: { category: "compound_constrained" } }, music: { sub_variant: 'motif_association', params: { complexity: 6, transposition: true } }, verbal: { sub_variant: 'phonetic_fluency', params: { constraint: "3-syllable words" } } } },
      15: { mechanic_config: { timeSec: 20, minTarget: 3 }, content_config: { neutral: { params: { category: "divergent" } }, math: { params: { category: "divergent" } }, music: { sub_variant: 'progression_recall', params: { complexity: 5, transposition: true } }, verbal: { sub_variant: 'dual_constraint_fluency', params: { constraint: "Things that are both 'hot' and 'bright'" } } } },
      16: { mechanic_config: { timeSec: 20, minTarget: 3 }, content_config: { neutral: { params: { category: "divergent" } }, math: { params: { category: "divergent" } }, music: { sub_variant: 'motif_association', params: { complexity: 7, transposition: true, timbral_variation: true } }, verbal: { sub_variant: 'associative_chain', params: { rule: 'random' } } } },
      17: { mechanic_config: { timeSec: 15, minTarget: 2 }, content_config: { neutral: { params: { category: "remote" } }, math: { params: { category: "remote" } }, music: { sub_variant: 'progression_recall', params: { complexity: 6, transposition: true, timbral_variation: true } }, verbal: { sub_variant: 'dual_constraint_fluency', params: { constraint: "Verbs ending in '-ate'" } } } },
      18: { mechanic_config: { timeSec: 15, minTarget: 4 }, content_config: { neutral: { params: { category: "compound_constrained" } }, math: { params: { category: "compound_constrained" } }, music: { sub_variant: 'motif_association', params: { complexity: 8, transposition: true, timbral_variation: true } }, verbal: { sub_variant: 'phonetic_fluency', params: { constraint: "Words with no 'e' or 'a'" } } } },
      19: { mechanic_config: { timeSec: 15, minTarget: 4 }, content_config: { neutral: { params: { category: "divergent" } }, math: { params: { category: "divergent" } }, music: { sub_variant: 'progression_recall', params: { complexity: 7, transposition: true, timbral_variation: true } }, verbal: { sub_variant: 'dual_constraint_fluency', params: { constraint: "Abstract concepts that can be 'measured'" } } } },
      20: { mechanic_config: { timeSec: 15, minTarget: 2 }, content_config: { neutral: { params: { category: "remote" } }, math: { params: { category: "remote" } }, music: { sub_variant: 'motif_association', params: { complexity: 9, transposition: true, timbral_variation: true } }, verbal: { sub_variant: 'associative_chain', params: { rule: 'random' } } } },
    }
  },
  gc_verbal_inference: {
    gameId: "gc_verbal_inference",
    sessionLength: 15,
    windowSize: 10,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.60,
    levelMap: {
      1: { mechanic_config: { distractor_count: 3 }, content_config: { neutral: { sub_variant: "analogy", params: { word_rarity: 1000 } }, math: { sub_variant: "word_problem", params: { complexity: 1 } }, music: { sub_variant: 'knowledge', params: { type: 'instrument_family', complexity: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { type: 'noun_verb_agreement' } } } },
      2: { mechanic_config: { distractor_count: 3 }, content_config: { neutral: { sub_variant: "definition", params: { word_rarity: 2000 } }, math: { sub_variant: "word_problem", params: { complexity: 1 } }, music: { sub_variant: 'knowledge', params: { type: 'term_definition', complexity: 1 } }, verbal: { sub_variant: 'definition_match', params: { frequency_min: 7 } } } },
      3: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: { sub_variant: "antonym", params: { word_rarity: 2000 } }, math: { sub_variant: "word_problem", params: { complexity: 2 } }, music: { sub_variant: 'knowledge', params: { type: 'genre_characteristic', complexity: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { type: 'tense_consistency' } } } },
      4: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: { sub_variant: "odd_one_out", params: { word_rarity: 5000 } }, math: { sub_variant: "word_problem", params: { complexity: 2 } }, music: { sub_variant: 'knowledge', params: { type: 'chord_quality_id', complexity: 1 } }, verbal: { sub_variant: 'synonym_selection', params: { frequency_min: 6, nuance: 'low' } } } },
      5: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: { sub_variant: "analogy", params: { word_rarity: 5000 } }, math: { sub_variant: "word_problem", params: { complexity: 3, content: ["unit_conversion"] } }, music: { sub_variant: 'knowledge', params: { type: 'interval_id', complexity: 1 } }, verbal: { sub_variant: 'idiom_completion', params: { type: 'common' } } } },
      6: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: { sub_variant: "definition", params: { word_rarity: 10000 } }, math: { sub_variant: "word_problem", params: { complexity: 3, content: ["percent_change"] } }, music: { sub_variant: 'knowledge', params: { type: 'term_definition', complexity: 2 } }, verbal: { sub_variant: 'cloze_deletion', params: { type: 'preposition_usage' } } } },
      7: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: { sub_variant: "antonym", params: { word_rarity: 10000 } }, math: { sub_variant: "word_problem", params: { complexity: 4, content: ["ratio"] } }, music: { sub_variant: 'knowledge', params: { type: 'instrument_family', complexity: 2 } }, verbal: { sub_variant: 'synonym_selection', params: { frequency_min: 5, nuance: 'medium' } } } },
      8: { mechanic_config: { distractor_count: 4 }, content_config: { neutral: { sub_variant: "odd_one_out", params: { word_rarity: 15000 } }, math: { sub_variant: "probabilistic_reasoning", params: { complexity: 1 } }, music: { sub_variant: 'knowledge', params: { type: 'chord_quality_id', complexity: 2 } }, verbal: { sub_variant: 'ambiguity_resolution', params: { type: 'pronoun_antecedent' } } } },
      9: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "analogy", params: { word_rarity: 15000 } }, math: { sub_variant: "probabilistic_reasoning", params: { complexity: 2 } }, music: { sub_variant: 'knowledge', params: { type: 'interval_id', complexity: 2 } }, verbal: { sub_variant: 'idiom_completion', params: { type: 'uncommon' } } } },
      10: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "definition", params: { word_rarity: 20000 } }, math: { sub_variant: "word_problem", params: { complexity: 5 } }, music: { sub_variant: 'knowledge', params: { type: 'genre_characteristic', complexity: 2 } }, verbal: { sub_variant: 'synonym_selection', params: { frequency_min: 4, nuance: 'high' } } } },
      11: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "antonym", params: { word_rarity: 20000 } }, math: { sub_variant: "probabilistic_reasoning", params: { complexity: 3 } }, music: { sub_variant: 'knowledge', params: { type: 'cadence_id', complexity: 1 } }, verbal: { sub_variant: 'cloze_deletion', params: { type: 'logical_connective' } } } },
      12: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "odd_one_out", params: { word_rarity: 25000 } }, math: { sub_variant: "word_problem", params: { complexity: 6 } }, music: { sub_variant: 'knowledge', params: { type: 'chord_function', complexity: 1 } }, verbal: { sub_variant: 'ambiguity_resolution', params: { type: 'lexical_ambiguity' } } } },
      13: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "analogy", params: { word_rarity: 25000 } }, math: { sub_variant: "probabilistic_reasoning", params: { complexity: 4 } }, music: { sub_variant: 'knowledge', params: { type: 'term_definition', complexity: 3 } }, verbal: { sub_variant: 'idiom_completion', params: { type: 'obscure' } } } },
      14: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "definition", params: { word_rarity: 30000 } }, math: { sub_variant: "word_problem", params: { complexity: 7 } }, music: { sub_variant: 'knowledge', params: { type: 'cadence_id', complexity: 2 } }, verbal: { sub_variant: 'synonym_selection', params: { frequency_min: 3, nuance: 'very_high' } } } },
      15: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "antonym", params: { word_rarity: 30000 } }, math: { sub_variant: "probabilistic_reasoning", params: { complexity: 5 } }, music: { sub_variant: 'knowledge', params: { type: 'chord_function', complexity: 2 } }, verbal: { sub_variant: 'ambiguity_resolution', params: { type: 'structural_ambiguity' } } } },
      16: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "multi_step_inference", params: { word_rarity: 40000 } }, math: { sub_variant: "word_problem", params: { complexity: 8 } }, music: { sub_variant: 'knowledge', params: { type: 'style_analysis', complexity: 1 } }, verbal: { sub_variant: 'multi_step_inference', params: { complexity: 1 } } } },
      17: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "multi_step_inference", params: { word_rarity: 40000 } }, math: { sub_variant: "probabilistic_reasoning", params: { complexity: 6 } }, music: { sub_variant: 'knowledge', params: { type: 'cadence_id', complexity: 3 } }, verbal: { sub_variant: 'multi_step_inference', params: { complexity: 2 } } } },
      18: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "multi_step_inference", params: { word_rarity: 50000 } }, math: { sub_variant: "word_problem", params: { complexity: 9 } }, music: { sub_variant: 'knowledge', params: { type: 'chord_function', complexity: 3 } }, verbal: { sub_variant: 'multi_step_inference', params: { complexity: 3 } } } },
      19: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "multi_step_inference", params: { word_rarity: 50000 } }, math: { sub_variant: "probabilistic_reasoning", params: { complexity: 7 } }, music: { sub_variant: 'knowledge', params: { type: 'style_analysis', complexity: 2 } }, verbal: { sub_variant: 'multi_step_inference', params: { complexity: 4 } } } },
      20: { mechanic_config: { distractor_count: 5 }, content_config: { neutral: { sub_variant: "multi_step_inference", params: { word_rarity: 60000 } }, math: { sub_variant: "word_problem", params: { complexity: 10 } }, music: { sub_variant: 'knowledge', params: { type: 'style_analysis', complexity: 3 } }, verbal: { sub_variant: 'multi_step_inference', params: { complexity: 5 } } } },
    }
  },
  ef_focus_switch: {
    gameId: "ef_focus_switch",
    sessionLength: 20,
    windowSize: 15,
    targetAccuracyHigh: 0.88,
    targetAccuracyLow: 0.68,
    levelMap: {
      1: { mechanic_config: { switchInterval: 10, noGo: false, responseWindowMs: 3000 }, content_config: { neutral: { params: { ruleCount: 2, cueType: "explicit_text" } }, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { params: { ruleCount: 2, rules: ["pitch_direction", "rhythm_evenness"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category'], switch_interval: 10 } } } },
      2: { mechanic_config: { switchInterval: 8, noGo: false, responseWindowMs: 2800 }, content_config: { neutral: { params: { ruleCount: 2, cueType: "explicit_text" } }, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { params: { ruleCount: 2, rules: ["pitch_direction", "rhythm_evenness"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category'], switch_interval: 8 } } } },
      3: { mechanic_config: { switchInterval: 8, noGo: false, responseWindowMs: 2800 }, content_config: { neutral: { params: { ruleCount: 2, cueType: "explicit_color" } }, math: { params: { ruleCount: 2, rules: ["parity", "magnitude"] } }, music: { params: { ruleCount: 2, rules: ["pitch_direction", "rhythm_evenness"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category'], switch_interval: 8 } } } },
      4: { mechanic_config: { switchInterval: 6, noGo: false, responseWindowMs: 2500 }, content_config: { neutral: { params: { ruleCount: 2, cueType: "explicit_color" } }, math: { params: { ruleCount: 2, rules: ["parity", "digit_sum"] } }, music: { params: { ruleCount: 2, rules: ["pitch_direction", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'first_letter'], switch_interval: 6 } } } },
      5: { mechanic_config: { switchInterval: 6, noGo: false, responseWindowMs: 2500 }, content_config: { neutral: { params: { ruleCount: 3, cueType: "explicit_color" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 3, rules: ["pitch_direction", "rhythm_evenness", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'first_letter'], switch_interval: 6, category_overlap: true } } } },
      6: { mechanic_config: { switchInterval: 5, noGo: false, responseWindowMs: 2200 }, content_config: { neutral: { params: { ruleCount: 3, cueType: "explicit_color" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 3, rules: ["pitch_direction", "rhythm_evenness", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'first_letter'], switch_interval: 5, category_overlap: true } } } },
      7: { mechanic_config: { switchInterval: 5, noGo: true, noGoWaitMs: 1500, responseWindowMs: 2200 }, content_config: { neutral: { params: { ruleCount: 3, cueType: "explicit_color" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 3, rules: ["pitch_direction", "rhythm_evenness", "harmony_quality"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category'], switch_interval: 5, no_go: true } } } },
      8: { mechanic_config: { switchInterval: 4, noGo: true, noGoWaitMs: 1500, responseWindowMs: 2000 }, content_config: { neutral: { params: { ruleCount: 3, cueType: "implicit_shape" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 3, rules: ["pitch_direction", "rhythm_evenness", "harmony_quality"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'first_letter'], switch_interval: 4, no_go: true } } } },
      9: { mechanic_config: { switchInterval: 4, noGo: true, noGoWaitMs: 1400, responseWindowMs: 1800 }, content_config: { neutral: { params: { ruleCount: 3, cueType: "implicit_shape" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 3, rules: ["interval_size", "rhythm_evenness", "harmony_quality"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count'], switch_interval: 4, no_go: true } } } },
      10: { mechanic_config: { switchInterval: 4, noGo: true, noGoWaitMs: 1300, responseWindowMs: 1800 }, content_config: { neutral: { params: { ruleCount: 3, cueType: "implicit_shape" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 3, rules: ["interval_size", "rhythm_evenness", "harmony_quality"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count'], switch_interval: 4, no_go: true, category_overlap: true } } } },
      11: { mechanic_config: { switchInterval: 3, noGo: true, noGoWaitMs: 1200, responseWindowMs: 1600 }, content_config: { neutral: { params: { ruleCount: 3, cueType: "implicit_shape" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 4, rules: ["interval_size", "rhythm_evenness", "harmony_quality", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count'], switch_interval: 3, no_go: true, category_overlap: true } } } },
      12: { mechanic_config: { switchInterval: 3, noGo: true, noGoWaitMs: 1100, responseWindowMs: 1500 }, content_config: { neutral: { params: { ruleCount: 3, cueType: "implicit_shape" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 4, rules: ["interval_size", "rhythm_evenness", "harmony_quality", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count'], switch_interval: 3, no_go: true, category_overlap: true } } } },
      13: { mechanic_config: { switchInterval: 3, noGo: true, noGoWaitMs: 1000, responseWindowMs: 1400 }, content_config: { neutral: { params: { ruleCount: 4, cueType: "implicit_shape" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 4, rules: ["interval_size", "rhythm_evenness", "harmony_quality", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count', 'first_letter'], switch_interval: 3, no_go: true, category_overlap: true } } } },
      14: { mechanic_config: { switchInterval: 2, noGo: true, noGoWaitMs: 1000, responseWindowMs: 1200 }, content_config: { neutral: { params: { ruleCount: 4, cueType: "implicit_shape" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 4, rules: ["interval_size", "rhythm_evenness", "harmony_quality", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count', 'first_letter'], switch_interval: 2, no_go: true, category_overlap: true } } } },
      15: { mechanic_config: { switchInterval: 2, noGo: true, noGoWaitMs: 900, responseWindowMs: 1100 }, content_config: { neutral: { params: { ruleCount: 4, cueType: "implicit_shape" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 4, rules: ["interval_size", "rhythm_evenness", "harmony_quality", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count', 'first_letter'], switch_interval: 2, no_go: true, category_overlap: true } } } },
      16: { mechanic_config: { switchInterval: 2, noGo: true, noGoWaitMs: 800, responseWindowMs: 1000 }, content_config: { neutral: { params: { ruleCount: 4, cueType: "implicit_shape" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 4, rules: ["interval_size", "rhythm_evenness", "harmony_quality", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count', 'first_letter'], switch_interval: 2, no_go: true, category_overlap: true } } } },
      17: { mechanic_config: { switchInterval: 2, noGo: true, noGoWaitMs: 700, responseWindowMs: 900 }, content_config: { neutral: { params: { ruleCount: 4, cueType: "random" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 4, rules: ["interval_size", "rhythm_evenness", "harmony_quality", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count', 'first_letter'], switch_interval: 2, no_go: true, category_overlap: true } } } },
      18: { mechanic_config: { switchInterval: 1.5, noGo: true, noGoWaitMs: 600, responseWindowMs: 800 }, content_config: { neutral: { params: { ruleCount: 4, cueType: "random" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 4, rules: ["interval_size", "rhythm_evenness", "harmony_quality", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count', 'first_letter'], switch_interval: 1.5, no_go: true, category_overlap: true } } } },
      19: { mechanic_config: { switchInterval: 1, noGo: true, noGoWaitMs: 500, responseWindowMs: 700 }, content_config: { neutral: { params: { ruleCount: 4, cueType: "random" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 4, rules: ["interval_size", "rhythm_evenness", "harmony_quality", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count', 'first_letter'], switch_interval: 1, no_go: true, category_overlap: true } } } },
      20: { mechanic_config: { switchInterval: 1, noGo: true, noGoWaitMs: 500, responseWindowMs: 600 }, content_config: { neutral: { params: { ruleCount: 4, cueType: "random" } }, math: { params: { ruleCount: 3, rules: ["parity", "magnitude", "digit_sum"] } }, music: { params: { ruleCount: 4, rules: ["interval_size", "rhythm_evenness", "harmony_quality", "timbre_family"] } }, verbal: { sub_variant: 'semantic_phonetic_shift', params: { rules: ['rhyme', 'category', 'syllable_count', 'first_letter'], switch_interval: 1, no_go: true, category_overlap: true } } } },
    }
  }
};

export const difficultyPolicies = policies;
