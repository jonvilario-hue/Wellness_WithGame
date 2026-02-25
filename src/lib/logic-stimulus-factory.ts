
'use client';

import { PRNG } from './rng';
import { snippetTemplates, snippetVariables } from '@/data/logic-content';

type LogicValue = boolean | string;
type LogicOperator = '&&' | '||' | '!';

const generateDistractors = (correctAnswer: LogicValue, prng: PRNG): { type: 'logic', value: string }[] => {
    const distractors = new Set<string>();
    const baseOptions: LogicValue[] = [true, false, 'error', 'null'];

    if (typeof correctAnswer === 'boolean') {
        distractors.add(String(!correctAnswer));
    }

    while (distractors.size < 3) {
        const decoy = prng.shuffle(baseOptions)[0];
        if (String(decoy) !== String(correctAnswer)) {
            distractors.add(String(decoy));
        }
    }
    return Array.from(distractors).map(d => ({ type: 'logic', value: d }));
};

const generateTruthTableTrial = (difficulty: number, prng: PRNG) => {
    const operator: LogicOperator = difficulty < 2 ? '&&' : '||';
    const rule = (a: boolean, b: boolean) => operator === '&&' ? a && b : a || b;
    const size = 3;
    const grid: any[] = Array(size * size).fill(null);
    
    const inputs = [[true, true], [true, false], [false, true]];
    
    for (let i = 0; i < size; i++) {
        grid[i * size] = { type: 'logic', value: String(inputs[i][0]) };
        grid[i * size + 1] = { type: 'logic', value: String(inputs[i][1]) };
        grid[i * size + 2] = { type: 'logic', value: String(rule(inputs[i][0], inputs[i][1])) };
    }
    
    const missingIndex = 8;
    const answerValue = grid[missingIndex].value;
    grid[missingIndex] = { type: 'logic', value: '?' };
    const answer = { type: 'logic', value: String(answerValue) };
    
    const options = prng.shuffle([answer, ...generateDistractors(answerValue, prng)]);

    return {
        type: 'logic_matrix',
        grid,
        missingIndex,
        answer,
        options,
        size,
        params: { rule: `truth_table_evaluation` },
        title: `Identify the pattern in the first two rows and find the missing output.`
    };
};

const generateSequenceTrial = (difficulty: number, prng: PRNG) => {
    const sequence = ['true', 'false', 'true', 'false'];
    const answerValue = 'true';
    const answer = { type: 'logic', value: answerValue };
    const options = prng.shuffle([answer, ...generateDistractors(answerValue, prng)]);
    
    return {
        type: 'logic_sequence',
        sequence: sequence.map(s => ({ type: 'logic', value: s })),
        answer,
        options,
        title: `What comes next in the alternating sequence?`
    };
};

export const generateGfLogicTrial = (difficulty: number, prng: PRNG) => {
    // Tier 1
    if (difficulty <= 3) {
        return generateTruthTableTrial(difficulty, prng);
    } 
    // Tier 2 (stub)
    else if (difficulty <= 6) {
        return generateSequenceTrial(difficulty, prng);
    }
    // Tier 3 (stub)
    else {
        // Return a simple truth table as a placeholder for higher tiers
        return generateTruthTableTrial(1, prng);
    }
};


// --- Gs (Processing Speed) - Syntax Scan ---

const generateSnippet = (tier: number, prng: PRNG): string => {
    // Select a template
    const template = prng.shuffle(snippetTemplates)[0];
    let snippet = template;

    // Fill slots
    Object.entries(snippetVariables).forEach(([key, values]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        snippet = snippet.replace(regex, () => prng.shuffle(values)[0]);
    });

    // Adjust lines based on tier
    const maxLines = tier < 4 ? 1 : (tier < 7 ? prng.nextIntRange(3, 6) : prng.nextIntRange(4, 8));
    const lines = snippet.split('\n');
    
    return lines.slice(0, maxLines).join('\n');
};

const mutateSnippet = (snippet: string, tier: number, prng: PRNG): string => {
    const lines = snippet.split('\n');
    const lineIndex = prng.nextIntRange(0, lines.length);
    let line = lines[lineIndex];

    const mutations = {
        tier1: [
            { from: 'true', to: 'false' }, { from: '+', to: '-' }, { from: '>', to: '<' },
            { from: 'x', to: 'y' }, { from: '=', to: '==' },
        ],
        tier2: [
            { from: '==', to: '===' }, { from: '!=', to: '!==' }, { from: ';', to: '' },
            { from: '{', to: '(' }, { from: 'let', to: 'const' }, { from: '>', to: '>=' },
        ],
        tier3: [
            { from: '0', to: 'O' }, { from: '1', to: 'l' }, { from: '&&', to: '&' },
            { from: '||', to: '|' }, { from: '=>', to: '>=' }, { from: 'item', to: 'items' },
            { from: 'index', to: 'indexOf' },
        ]
    };
    
    const possibleMutations = (tier < 4 ? mutations.tier1 : (tier < 7 ? mutations.tier2 : mutations.tier3))
        .filter(m => line.includes(m.from));

    if (possibleMutations.length > 0) {
        const mutation = prng.shuffle(possibleMutations)[0];
        line = line.replace(mutation.from, mutation.to);
    } else {
        // Fallback if no mutation is possible, swap two random characters
        if (line.length > 1) {
            const i = prng.nextIntRange(0, line.length);
            let j = prng.nextIntRange(0, line.length);
            while (i === j) { j = prng.nextIntRange(0, line.length); }
            const chars = line.split('');
            [chars[i], chars[j]] = [chars[j], chars[i]];
            line = chars.join('');
        }
    }
    
    lines[lineIndex] = line;
    return lines.join('\n');
};


export const generateGsLogicTrial = (difficulty: number, prng: PRNG) => {
    const isSame = prng.nextFloat() > 0.5;
    const snippetA = generateSnippet(difficulty, prng);
    let snippetB: string;

    if (isSame) {
        snippetB = snippetA;
    } else {
        snippetB = mutateSnippet(snippetA, difficulty, prng);
    }

    return {
        type: 'syntax_scan',
        snippetA,
        snippetB,
        isSame,
    };
};
