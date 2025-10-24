"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PromptPanel } from "@/components/PromptPanel";
import { GraphView } from "@/components/GraphView";
import { NodeInspector } from "@/components/NodeInspector";
import { AnswerBar } from "@/components/AnswerBar";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { mergePatch } from "@/lib/utils";
import type { GraphNode, TReasoningGraph } from "@/schema/reasoning";

type DomainMode = "General" | "Scientific" | "Legal" | "Math";

const DEFAULT_MODE: DomainMode = "General";
const DEFAULT_DETAIL = 3;

export default function HomePage() {
  const [question, setQuestion] = useState("");
  const [detail, setDetail] = useState(DEFAULT_DETAIL);
  const [mode, setMode] = useState<DomainMode>(DEFAULT_MODE);
  const [useMock, setUseMock] = useState(true);
  const [assumptions, setAssumptions] = useState<string[]>([]);

  const [graph, setGraph] = useState<TReasoningGraph | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());
  const [isReasoning, setIsReasoning] = useState(false);
  const [isChallenging, setIsChallenging] = useState(false);
  const [invalidRaw, setInvalidRaw] = useState<string | null>(null);

  const selectedNode = useMemo<GraphNode | null>(() => {
    if (!graph || !selectedNodeId) return null;
    return graph.nodes.find((node) => node.id === selectedNodeId) ?? null;
  }, [graph, selectedNodeId]);

  const handleReason = async () => {
    if (question.trim().length === 0) {
      toast.error("Please provide a question.");
      return;
    }
    try {
      setIsReasoning(true);
      setInvalidRaw(null);
      const response = await fetch("/api/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          detail,
          mode,
          useMock,
          assumptions,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (payload?.raw) {
          setInvalidRaw(payload.raw);
          toast.error("Model returned invalid JSON.");
        } else if (payload?.error) {
          toast.error(payload.error);
        } else {
          toast.error("Failed to generate reasoning graph.");
        }
        return;
      }

      const data: TReasoningGraph = await response.json();
      setGraph(data);
      setCollapsedNodeIds(new Set());
      const answerNode = data.nodes.find((node) => node.type === "answer");
      setSelectedNodeId(answerNode?.id ?? data.nodes[0]?.id ?? null);
      toast.success("Reasoning graph ready.");
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error generating reasoning graph.");
    } finally {
      setIsReasoning(false);
    }
  };

  const handleToggleCollapse = (nodeId: string) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleChallenge = async (nodeId: string) => {
    if (!graph) return;
    try {
      setIsChallenging(true);
      const response = await fetch("/api/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nodeId,
          currentGraph: graph,
          useMock,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        if (payload?.error) {
          toast.error(payload.error);
        } else {
          toast.error("Failed to challenge node.");
        }
        return;
      }

      const patch = await response.json();
      setCollapsedNodeIds((prev) => {
        if (!prev.has(nodeId)) return prev;
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
      setGraph((prev) => {
        if (!prev) return prev;
        const next = mergePatch(prev, patch);
        if (Array.isArray(patch.nodes) && patch.nodes.length > 0) {
          setSelectedNodeId(patch.nodes[0].id);
        }
        return next;
      });
      toast.success("Counter-evidence added.");
    } catch (error) {
      console.error(error);
      toast.error("Unexpected error challenging node.");
    } finally {
      setIsChallenging(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-6">
      <div className="grid gap-6 lg:grid-cols-[340px,1fr,320px]">
        <PromptPanel
          question={question}
          onQuestionChange={setQuestion}
          detail={detail}
          onDetailChange={setDetail}
          mode={mode}
          onModeChange={setMode}
          useMock={useMock}
          onUseMockChange={setUseMock}
          assumptions={assumptions}
          onAssumptionsChange={setAssumptions}
          onSubmit={handleReason}
          loading={isReasoning}
        />

        <div className="flex min-h-[60vh] flex-col gap-4">
          {graph ? (
            <AnswerBar answer={graph.answer} />
          ) : (
            <Card className="flex flex-1 items-center justify-center border-dashed bg-white/90 dark:border-slate-800 dark:bg-slate-900/60">
              <CardContent className="text-center text-sm text-muted-foreground dark:text-slate-300">
                Ask a question and click <span className="font-semibold text-foreground">Reason</span> to
                generate a visual chain-of-thought.
              </CardContent>
            </Card>
          )}
          <div className="flex-1">
            {graph ? (
              <GraphView
                graph={graph}
                selectedNodeId={selectedNodeId}
                onSelectNode={setSelectedNodeId}
                collapsedNodeIds={collapsedNodeIds}
              />
            ) : (
              <Card className="flex h-full items-center justify-center border-dashed bg-white/90 dark:border-slate-800 dark:bg-slate-900/60">
                <CardContent className="text-center text-sm text-muted-foreground dark:text-slate-300">
                  The reasoning graph will appear here once generated.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <NodeInspector
          node={selectedNode}
          sources={graph?.sources ?? []}
          collapsed={selectedNode ? collapsedNodeIds.has(selectedNode.id) : false}
          onToggleCollapse={handleToggleCollapse}
          onChallenge={handleChallenge}
          loadingChallenge={isChallenging}
        />
      </div>

      {invalidRaw && (
        <Card className="border-destructive/60 bg-destructive/10 dark:border-rose-400/40 dark:bg-rose-950/40">
          <CardContent className="space-y-3 p-4">
            <div>
              <p className="font-semibold text-destructive">Model returned invalid JSON</p>
              <p className="text-sm text-muted-foreground dark:text-slate-300">
                Inspect the raw response below to debug schema mismatches. The graph was not updated.
              </p>
            </div>
            <Separator />
            <details className="rounded-md border bg-background p-3 dark:border-slate-800 dark:bg-slate-900/70">
              <summary className="cursor-pointer select-none text-sm font-medium">Raw response</summary>
              <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all text-xs text-muted-foreground dark:text-slate-300">
                {invalidRaw}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
