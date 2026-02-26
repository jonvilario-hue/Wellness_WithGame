
'use client';

import dagre from 'dagre';

type DagreNode = { id: string, width: number, height: number };
type DagreEdge = { v: string, w: string, label?: string };
type Layout = { nodes: {id: string, x: number, y: number}[], edges: any[] };

export const getLayoutedElements = (nodes: DagreNode[], edges: DagreEdge[]): Layout => {
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });
    g.setDefaultEdgeLabel(() => ({}));

    nodes.forEach(node => g.setNode(node.id, { label: node.id, width: node.width, height: node.height }));
    edges.forEach(edge => g.setEdge(edge.v, edge.w, { label: edge.label }));

    dagre.layout(g);

    return {
        nodes: g.nodes().map(v => {
            const node = g.node(v);
            if (!node || typeof node.x === 'undefined') {
                console.warn(`Dagre layout failed for node ID: ${v}. Defaulting position.`);
                return { id: v, x: 0, y: 0 };
            }
            return { id: v, x: node.x, y: node.y };
        }),
        edges: g.edges().map(e => {
            const edgeInfo = g.edge(e);
            return { ...edgeInfo, v: e.v, w: e.w };
        })
    };
};
