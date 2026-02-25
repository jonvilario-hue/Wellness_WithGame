
'use client';

import { PRNG } from './rng';

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
