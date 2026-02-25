
'use client';

import { gcSpatialConceptData, type ConceptCategory } from "@/data/gc-spatial-content";
import { difficultyPolicies } from "@/data/difficulty-policies";
import type { GameId, TrainingFocus } from "@/types";
import { getLayoutedElements } from './spatial-layout';

const GAME_ID: GameId = 'gc_verbal_inference';
const policy = difficultyPolicies[GAME_ID];

export type GcSpatialPuzzleNode = {
    id: string;
    label: string;
    position: [number, number, number];
    isCorrect: boolean;
};

export type GcSpatialPuzzleEdge = {
    from: string;
    to: string;
};

export type GcSpatialPuzzle = {
    type: 'spatial_concept_map';
    targetDescription: string;
    nodes: GcSpatialPuzzleNode[];
    edges: GcSpatialPuzzleEdge[];
};

export const generateSpatialConceptMapPuzzle = (level: number): GcSpatialPuzzle => {
    const levelDef = policy.levelMap[level] || policy.levelMap[1];
    const params = levelDef.content_config['spatial']?.params;
    if (!params) throw new Error(`No spatial params for Gc level ${level}`);

    const { nodeCount, category, abstraction } = params;

    // 1. Select categories based on abstraction level
    const availableCategories = gcSpatialConceptData.filter(cat => 
        (abstraction === 'concrete' && (cat.name === 'Cutting Tools' || cat.name === 'Fastening Tools')) ||
        (abstraction === 'abstract' && (cat.name === 'Abstract Concepts' || cat.name === 'Emotions'))
    );
    const primaryCategory = availableCategories[Math.floor(Math.random() * availableCategories.length)];
    
    // 2. Select a target item from the category
    const targetItem = primaryCategory.items[Math.floor(Math.random() * primaryCategory.items.length)];
    
    // 3. Select distractors
    let distractors = new Set<any>();
    // Add semantic distractors (related)
    const semanticDistractors = primaryCategory.items.filter(item => item.word !== targetItem.word);
    while(distractors.size < nodeCount / 3 && semanticDistractors.length > 0) {
        distractors.add(semanticDistractors.pop());
    }
    // Add noise distractors (unrelated)
    const noiseCategories = gcSpatialConceptData.filter(cat => cat.name !== primaryCategory.name);
    while(distractors.size < nodeCount - 1) {
        const randomCat = noiseCategories[Math.floor(Math.random() * noiseCategories.length)];
        const randomItem = randomCat.items[Math.floor(Math.random() * randomCat.items.length)];
        if (!distractors.has(randomItem)) {
            distractors.add(randomItem);
        }
    }
    
    // 4. Create graph structure
    const rawNodes = [
        { id: targetItem.word, label: targetItem.word, isCorrect: true },
        ...Array.from(distractors).map((item: any) => ({ id: item.word, label: item.word, isCorrect: false })),
    ].sort(() => Math.random() - 0.5);

    const rawEdges: { from: string; to: string }[] = [];
    const allItems = [targetItem, ...distractors];

    // Deliberately create misleading spatial clusters
    allItems.forEach(item => {
        if(item.relatedTo) {
            item.relatedTo.forEach((relatedWord: string) => {
                const relatedItem = allItems.find(i => i.word === relatedWord);
                if (relatedItem) {
                    rawEdges.push({ from: item.word, to: relatedWord });
                }
            });
        }
    });

    // Add some random edges to increase visual clutter
    for(let i=0; i < nodeCount / 4; i++) {
        const fromNode = rawNodes[Math.floor(Math.random() * rawNodes.length)];
        const toNode = rawNodes[Math.floor(Math.random() * rawNodes.length)];
        if(fromNode.id !== toNode.id) {
             rawEdges.push({ from: fromNode.id, to: toNode.id });
        }
    }
    
    // 5. Get 3D layout
    const layout = getLayoutedElements(rawNodes.map(n => ({ id: n.id, width: 100, height: 40 })), rawEdges);

    const nodes: GcSpatialPuzzleNode[] = rawNodes.map(node => {
        const nodeLayout = layout.nodes.find(n => n.id === node.id);
        const position: [number, number, number] = nodeLayout 
            ? [nodeLayout.x / 40, -nodeLayout.y / 40, (Math.random() - 0.5) * 8] // Scale down and add depth
            : [0,0,0];
        return { ...node, position };
    });

    const edges: GcSpatialPuzzleEdge[] = layout.edges.map(edge => ({ from: edge.v, to: edge.w }));
    
    return {
        type: 'spatial_concept_map',
        targetDescription: targetItem.definition,
        nodes,
        edges,
    };
};
