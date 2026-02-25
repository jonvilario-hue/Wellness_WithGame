
export const logicPairsTier1 = [
    { stimulus: '&&', meaning: 'AND — both must be true', hint: 'Think of "and" — ALL conditions' },
    { stimulus: '||', meaning: 'OR — at least one must be true', hint: 'Think of "or" — ANY condition' },
    { stimulus: '!', meaning: 'NOT — flips true to false', hint: 'Exclamation = opposite!' },
    { stimulus: '==', meaning: 'Equals (loose check)', hint: 'Double equals = compare' },
    { stimulus: 'true', meaning: 'Boolean value: yes/on', hint: 'The "yes" value' },
    { stimulus: 'false', meaning: 'Boolean value: no/off', hint: 'The "no" value' },
    { stimulus: 'if', meaning: 'Check a condition', hint: 'If this, then that' },
    { stimulus: 'else', meaning: 'Otherwise (when if is false)', hint: 'The other path' }
];

export const logicPairsTier2 = [
    { stimulus: '===', meaning: 'Strict equals (type must match too)', hint: 'Triple = stricter check' },
    { stimulus: '!=', meaning: 'Not equal (loose)', hint: 'Exclamation + equals = not the same' },
    { stimulus: '!==', meaning: 'Strict not equal', hint: 'Strict version of not-equal' },
    { stimulus: '??', meaning: 'Nullish coalescing — use fallback if null/undefined', hint: 'Question marks = "what if missing?"' },
    { stimulus: '?.', meaning: 'Optional chaining — safe property access', hint: 'Question dot = "does this exist?"' },
    { stimulus: '=>', meaning: 'Arrow function — defines a function', hint: 'Arrow points to what function does' },
    { stimulus: '...', meaning: 'Spread/rest — expand or collect items', hint: 'Three dots = "all of these"' },
    { stimulus: 'return', meaning: 'Send a value back from a function', hint: 'The function\'s answer' }
];

export const logicPairsTier3 = [
    { stimulus: '^', meaning: 'Bitwise XOR (NOT exponent)', hint: 'Caret in JS = bitwise, not power' },
    { stimulus: '~', meaning: 'Bitwise NOT — flips all bits', hint: 'Tilde = bit flipper' },
    { stimulus: '>>', meaning: 'Right shift — move bits right', hint: 'Arrows point which way bits move' },
    { stimulus: '<<', meaning: 'Left shift — move bits left', hint: 'Arrows point which way bits move' },
    { stimulus: '**', meaning: 'Exponent (power of)', hint: 'Double star = power' },
    { stimulus: '%', meaning: 'Modulo — remainder after division', hint: 'Percent = what\'s left over' },
    { stimulus: 'typeof', meaning: 'Check the type of a value', hint: 'Asks "what kind of thing are you?"' },
    { stimulus: 'void', meaning: 'Evaluates expression, returns undefined', hint: 'Void = emptiness' }
];
