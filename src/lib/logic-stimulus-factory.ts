
'use client';

import { PRNG } from './rng';
import { snippetTemplates, snippetVariables } from '@/data/logic-content';

type LogicValue = boolean | string;
type LogicOperator = '&&' | '||' | '!';

// --- Gf (Fluid Reasoning) ---

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
    if (difficulty <= 3) {
        return generateTruthTableTrial(difficulty, prng);
    } 
    else if (difficulty <= 6) {
        return generateSequenceTrial(difficulty, prng);
    }
    else {
        return generateTruthTableTrial(1, prng);
    }
};

// --- Gs (Processing Speed) ---

const generateSnippet = (tier: number, prng: PRNG): string => {
    const template = prng.shuffle(snippetTemplates)[0];
    let snippet = template;

    Object.entries(snippetVariables).forEach(([key, values]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        snippet = snippet.replace(regex, () => prng.shuffle(values)[0]);
    });

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

// --- Gv (Visual Processing) ---

export type FlowchartNode = {
  id: string;
  type: 'terminal' | 'decision' | 'process';
  label: string;
};

export type FlowchartEdge = {
  from: string;
  to: string;
  label?: string;
};

export type FlowchartTrial = {
  type: 'flowchart_trace';
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  inputValues: { [varName: string]: any };
  question: string;
  correctAnswer: any;
  options: any[];
};

export const generateGvLogicTrial = (difficulty: number, prng: PRNG): FlowchartTrial => {
    if (difficulty <= 3) return generateIfElseTrial(prng);
    if (difficulty <= 6) return generateLoopTrial(prng);
    return generateNestedTrial(prng);
};

const generateIfElseTrial = (prng: PRNG): FlowchartTrial => {
    const x = prng.nextIntRange(0, 20);
    const threshold = 10;
    const nodes: FlowchartNode[] = [
        { id: 'start', type: 'terminal', label: 'Start' },
        { id: 'decision', type: 'decision', label: `Is X > ${threshold}?` },
        { id: 'p_true', type: 'process', label: 'Output: "big"' },
        { id: 'p_false', type: 'process', label: 'Output: "small"' },
        { id: 'end', type: 'terminal', label: 'End' },
    ];
    const edges: FlowchartEdge[] = [
        { from: 'start', to: 'decision' },
        { from: 'decision', to: 'p_true', label: 'Yes' },
        { from: 'decision', to: 'p_false', label: 'No' },
        { from: 'p_true', to: 'end' },
        { from: 'p_false', to: 'end' },
    ];
    const correctAnswer = x > threshold ? "big" : "small";

    return {
        type: 'flowchart_trace',
        nodes,
        edges,
        inputValues: { X: x },
        question: `What is the output when X = ${x}?`,
        correctAnswer,
        options: prng.shuffle(["big", "small", "error", "nothing"])
    };
};

const generateLoopTrial = (prng: PRNG): FlowchartTrial => {
    const iterations = prng.nextIntRange(2, 4);
    const nodes: FlowchartNode[] = [
        { id: 'start', type: 'terminal', label: 'Start' },
        { id: 'init', type: 'process', label: 'Set count = 0' },
        { id: 'decision', type: 'decision', label: `Is count < ${iterations}?` },
        { id: 'body', type: 'process', label: 'count = count + 1' },
        { id: 'output', type: 'process', label: 'Output: count' },
        { id: 'end', type: 'terminal', label: 'End' },
    ];
    const edges: FlowchartEdge[] = [
        { from: 'start', to: 'init' },
        { from: 'init', to: 'decision' },
        { from: 'decision', to: 'body', label: 'Yes' },
        { from: 'body', to: 'decision' },
        { from: 'decision', to: 'output', label: 'No' },
        { from: 'output', to: 'end' },
    ];

    const correctAnswer = iterations;
    const options = prng.shuffle([iterations, iterations - 1, iterations + 1, 0]);

    return {
        type: 'flowchart_trace',
        nodes,
        edges,
        inputValues: {},
        question: "What is the final output value of 'count'?",
        correctAnswer,
        options,
    };
};

const generateNestedTrial = (prng: PRNG): FlowchartTrial => {
    const x = prng.nextIntRange(0, 20);
    const nodes: FlowchartNode[] = [
        { id: 'start', type: 'terminal', label: 'Start' },
        { id: 'init', type: 'process', label: 'result = "default"' },
        { id: 'd1', type: 'decision', label: 'Is X > 0?' },
        { id: 'd2', type: 'decision', label: 'Is X > 10?' },
        { id: 'p_high', type: 'process', label: 'result = "high"' },
        { id: 'p_med', type: 'process', label: 'result = "medium"' },
        { id: 'p_low', type: 'process', label: 'result = "low"' },
        { id: 'end', type: 'terminal', label: 'End' },
    ];
    const edges: FlowchartEdge[] = [
        { from: 'start', to: 'init' },
        { from: 'init', to: 'd1' },
        { from: 'd1', to: 'd2', label: 'Yes' },
        { from: 'd1', to: 'p_low', label: 'No' },
        { from: 'd2', to: 'p_high', label: 'Yes' },
        { from: 'd2', to: 'p_med', label: 'No' },
        { from: 'p_high', to: 'end' },
        { from: 'p_med', to: 'end' },
        { from: 'p_low', to: 'end' },
    ];
    let correctAnswer: string;
    if (x > 0) {
        if (x > 10) {
            correctAnswer = "high";
        } else {
            correctAnswer = "medium";
        }
    } else {
        correctAnswer = "low";
    }

    return {
        type: 'flowchart_trace',
        nodes,
        edges,
        inputValues: { X: x },
        question: `What is the final value of 'result' when X = ${x}?`,
        correctAnswer,
        options: prng.shuffle(["high", "medium", "low", "default"]),
    };
};
