
'use client';

import dagre from 'dagre';
import type { GcSpatialPuzzleNode, GcSpatialPuzzleEdge } from './gc-spatial-stimulus-factory';

type DagreNode = { id: string, width: number, height: number };
type DagreEdge = { v: string, w: string };
type Layout = { nodes: {id: string, x: number, y: number}[], edges: DagreEdge[] };

export const getLayoutedElements = (nodes: DagreNode[], edges: DagreEdge[]): Layout => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach(node => g.setNode(node.id, { label: node.id, width: node.width, height: node.height }));
    edges.forEach(edge => g.setEdge(edge.v, edge.w));

    dagre.layout(g);

    return {
        nodes: g.nodes().map(v => {
            const node = g.node(v);
            return { id: v, x: node.x, y: node.y };
        }),
        edges: g.edges()
    };
};
