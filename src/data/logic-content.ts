
export const logicTokenPools = {
    tier1: ['if', 'else', 'for', 'while', '{', '}', 'return', 'true'],
    tier2: [
        'if', 'else', 'for', 'while', '{', '}', 'return', 'true',
        'false', 'let', 'const', '==', '!=', '(', ')', 'function'
    ],
    tier3: [
        'if', 'else', 'for', 'while', '{', '}', 'return', 'true',
        'false', 'let', 'const', '==', '!=', '(', ')', 'function',
        '===', '!==', '&&', '&', '||', '|', '=>', '>=', 'class', 'switch'
    ]
};

export const confusablePairs: Record<string, string> = {
    '==': '===',
    '!=': '!==',
    '&&': '&',
    '||': '|',
    '=>': '>='
};

export const audioTokenGateMap: Record<string, { freq: number, type: OscillatorType }> = {
    'AND': { freq: 440, type: 'square' },
    'OR': { freq: 660, type: 'square' },
    'NOT': { freq: 880, type: 'square' },
    'NAND': { freq: 440, type: 'sawtooth' },
    'NOR': { freq: 660, type: 'sawtooth' },
};
