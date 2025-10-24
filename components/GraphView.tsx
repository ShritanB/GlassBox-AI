"use client";

import { useEffect, useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  ReactFlowProvider,
  useReactFlow,
  type Edge as FlowEdge,
  type Node as FlowNode,
} from "reactflow";
import "reactflow/dist/style.css";
import type { GraphEdge, GraphNode, TReasoningGraph } from "@/schema/reasoning";
import { cn } from "@/lib/utils";

type GraphViewProps = {
  graph: TReasoningGraph;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  collapsedNodeIds: Set<string>;
};

const colorMap: Record<GraphNode["type"], string> = {
  subquestion: "var(--node-subquestion)",
  claim: "var(--node-claim)",
  evidence: "var(--node-evidence)",
  assumption: "var(--node-assumption)",
  computation: "var(--node-computation)",
  answer: "var(--node-answer)",
};

const nodeTextColor = "var(--node-text)";
const nodeBorderSoft = "var(--node-border-soft)";
const nodeBorderStrong = "var(--node-border-strong)";
const nodeShadow = "var(--node-shadow)";
const edgeDefault = "var(--edge-default)";
const edgeContradict = "var(--edge-contradict)";
const edgeLabelColor = "var(--edge-label)";

const layerOrder: Record<GraphNode["type"], number> = {
  answer: 2,
  subquestion: 1,
  claim: 2,
  evidence: 3,
  assumption: 3,
  computation: 3,
};

function buildDescendantSet(edges: GraphEdge[], rootIds: Set<string>) {
  const adjacency = edges.reduce<Record<string, string[]>>((acc, edge) => {
    if (!acc[edge.from]) acc[edge.from] = [];
    acc[edge.from].push(edge.to);
    return acc;
  }, {});

  const hidden = new Set<string>();
  const visit = (nodeId: string) => {
    const children = adjacency[nodeId] ?? [];
    for (const child of children) {
      if (!hidden.has(child)) {
        hidden.add(child);
        visit(child);
      }
    }
  };

  rootIds.forEach((id) => visit(id));
  return hidden;
}

function InnerGraphView({ graph, selectedNodeId, onSelectNode, collapsedNodeIds }: GraphViewProps) {
  const { fitView } = useReactFlow();

  const hiddenNodes = useMemo(
    () => buildDescendantSet(graph.edges, collapsedNodeIds),
    [graph.edges, collapsedNodeIds],
  );

  const nodes = useMemo<FlowNode[]>(() => {
    const layerCounts = new Map<number, number>();
    const sortedNodes = [...graph.nodes].sort((a, b) => {
      const layerA = layerOrder[a.type] ?? 2;
      const layerB = layerOrder[b.type] ?? 2;
      if (layerA !== layerB) return layerA - layerB;
      return a.id.localeCompare(b.id);
    });
    return sortedNodes
      .filter((node) => !hiddenNodes.has(node.id) || collapsedNodeIds.has(node.id))
      .map<FlowNode>((node) => {
        const layer = layerOrder[node.type] ?? 2;
        const count = layerCounts.get(layer) ?? 0;
        layerCounts.set(layer, count + 1);
        const position = { x: layer * 260, y: count * 140 };
        const isCollapsed = collapsedNodeIds.has(node.id);

        return {
          id: node.id,
          position,
          data: { label: node.text },
          selectable: true,
          draggable: false,
          selected: selectedNodeId === node.id,
          style: {
            backgroundColor: colorMap[node.type],
            color: nodeTextColor,
            borderRadius: 12,
            border:
              selectedNodeId === node.id
                ? `3px solid ${nodeBorderStrong}`
                : `2px solid ${nodeBorderSoft}`,
            padding: 12,
            boxShadow: isCollapsed
              ? `0 0 0 2px ${nodeBorderStrong}, inset 0 0 0 2px ${nodeBorderSoft}`
              : `0 10px 20px ${nodeShadow}`,
            cursor: "pointer",
            fontSize: 13,
            minWidth: 180,
            maxWidth: 240,
          },
          className: cn("font-medium leading-snug"),
        };
      });
  }, [graph.nodes, hiddenNodes, collapsedNodeIds, selectedNodeId]);

  const edges = useMemo<FlowEdge[]>(() => {
    return graph.edges
      .filter((edge) => {
        if (hiddenNodes.has(edge.from) && !collapsedNodeIds.has(edge.from)) return false;
        if (hiddenNodes.has(edge.to) && !collapsedNodeIds.has(edge.to)) return false;
        return true;
      })
      .map<FlowEdge>((edge) => {
        const stroke = edge.relation === "contradicts" ? edgeContradict : edgeDefault;
        return {
          id: `${edge.from}-${edge.to}-${edge.relation}`,
          source: edge.from,
          target: edge.to,
          label: edge.relation.replace("_", " "),
          animated: Math.abs(edge.weight) > 0.75,
          labelStyle: { fill: edgeLabelColor, fontSize: 12, fontWeight: 600 },
          style: {
            stroke,
            strokeWidth: Math.max(1.5, Math.abs(edge.weight) * 3),
            strokeDasharray: edge.relation === "contradicts" ? "6 3" : undefined,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: stroke,
          },
        };
      });
  }, [graph.edges, hiddenNodes, collapsedNodeIds]);

  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.2, duration: 500 });
      }, 50);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [nodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      onNodeClick={(_, node) => onSelectNode(node.id)}
      onPaneClick={() => onSelectNode(null)}
      proOptions={{ hideAttribution: true }}
      elementsSelectable
    >
      <Background gap={16} size={1} color="var(--graph-grid)" />
      <Controls position="bottom-right" />
    </ReactFlow>
  );
}

export function GraphView(props: GraphViewProps) {
  return (
    <div className="h-full w-full rounded-xl border border-slate-200 bg-slate-100/80 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <ReactFlowProvider>
        <InnerGraphView {...props} />
      </ReactFlowProvider>
    </div>
  );
}
