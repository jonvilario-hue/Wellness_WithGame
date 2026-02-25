

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

// New content for Syntax Scan / Gate Speed
export const snippetTemplates = [
    `let {VAR} = {VALUE};\nif ({VAR} {COMP} {THRESHOLD}) {\n  return {RESULT};\n}`,
    `for (let {VAR} = 0; {VAR} < {LIMIT}; {VAR}++) {\n  {VAR2} = {VAR2} {OP} {VAR};\n}`,
    `function {FUNC}({PARAM}) {\n  if ({PARAM} {COMP} {VALUE}) {\n    return true;\n  }\n  return false;\n}`,
    `while ({VAR} {COMP} {LIMIT}) {\n  {VAR} = {VAR} {OP} 1;\n}`
];

export const snippetVariables = {
    VAR: ['x', 'y', 'a', 'b', 'count', 'num', 'val', 'result', 'i', 'j'],
    VAR2: ['total', 'sum', 'accumulator'],
    VALUE: ['0', '1', 'true', 'false', 'null'],
    COMP: ['>', '<', '==', '!=', '>='],
    THRESHOLD: ['0', '5', '10'],
    RESULT: ['true', 'false'],
    LIMIT: ['5', '10', '20'],
    OP: ['+', '-', '*'],
    FUNC: ['isValid', 'checkValue', 'processData'],
    PARAM: ['input', 'value', 'data'],
};
