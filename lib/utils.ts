import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { GraphEdge, GraphNode, TReasoningGraph } from "@/schema/reasoning";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function mergePatch(
  graph: TReasoningGraph,
  patch: { nodes: GraphNode[]; edges: GraphEdge[] },
): TReasoningGraph {
  const nodeMap = new Map(graph.nodes.map((node) => [node.id, node]));
  patch.nodes.forEach((node) => {
    nodeMap.set(node.id, node);
  });

  const existingEdges = new Set(graph.edges.map((edge) => `${edge.from}-${edge.to}-${edge.relation}`));
  const mergedEdges = [...graph.edges];
  patch.edges.forEach((edge) => {
    const key = `${edge.from}-${edge.to}-${edge.relation}`;
    if (!existingEdges.has(key)) {
      mergedEdges.push(edge);
      existingEdges.add(key);
    }
  });

  return {
    ...graph,
    nodes: Array.from(nodeMap.values()),
    edges: mergedEdges,
  };
}

export function confidenceLabel(value: number) {
  const pct = Math.round(value * 100);
  return `${pct}%`;
}
