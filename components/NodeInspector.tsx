"use client";

import { useMemo } from "react";
import { ExternalLink, Minimize2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import type { GraphNode, Source } from "@/schema/reasoning";
import { confidenceLabel } from "@/lib/utils";

type NodeInspectorProps = {
  node: GraphNode | null;
  sources: Source[];
  collapsed: boolean;
  onToggleCollapse: (nodeId: string) => void;
  onChallenge: (nodeId: string) => void;
  loadingChallenge?: boolean;
};

export function NodeInspector({
  node,
  sources,
  collapsed,
  onToggleCollapse,
  onChallenge,
  loadingChallenge,
}: NodeInspectorProps) {
  const sourceMap = useMemo(() => new Map(sources.map((source) => [source.id, source])), [sources]);

  if (!node) {
    return (
      <Card className="h-full border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/70">
        <CardHeader>
          <CardTitle>Node inspector</CardTitle>
        </CardHeader>
        <CardContent className="flex h-full flex-col items-center justify-center text-center text-sm text-muted-foreground dark:text-slate-300">
          Select a node to inspect its rationale, confidence, and citations.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/70">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center justify-between gap-2">
          <span className="capitalize text-foreground dark:text-slate-100">{node.type}</span>
          <span className="rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground dark:bg-slate-800/80">
            {confidenceLabel(node.confidence)}
          </span>
        </CardTitle>
        <p className="text-sm font-medium leading-snug text-foreground dark:text-slate-100">{node.text}</p>
      </CardHeader>
      <CardContent className="flex h-full flex-col gap-4 overflow-y-auto pb-6 pr-2">
        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-slate-400">
            Rationale
          </span>
          <p className="text-sm leading-relaxed text-muted-foreground dark:text-slate-300">
            {node.rationale || "No rationale provided."}
          </p>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-slate-400">
            Confidence
          </span>
          <Progress value={node.confidence * 100} />
        </div>

        <Separator />

        <div className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground dark:text-slate-400">
            Citations
          </span>
          {node.citations.length === 0 ? (
            <p className="text-sm text-muted-foreground dark:text-slate-300">No citations linked.</p>
          ) : (
            <ul className="space-y-2">
              {node.citations.map((citation, index) => {
                const source = sourceMap.get(citation.source_id);
                if (!source) {
                  return (
                    <li key={`${citation.source_id}-${index}`} className="text-sm text-muted-foreground dark:text-slate-300">
                      Unknown source ({citation.source_id})
                    </li>
                  );
                }
                return (
                  <li key={`${citation.source_id}-${index}`}>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground dark:text-slate-100">{source.title}</span>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground dark:text-slate-400">
                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            Visit source
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span>No link provided</span>
                        )}
                        {typeof citation.start === "number" && typeof citation.end === "number" && (
                          <span>
                            Section {citation.start}–{citation.end}
                          </span>
                        )}
                        {source.published && <span className="text-muted-foreground dark:text-slate-400">Published {source.published}</span>}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <Button
            variant="secondary"
            onClick={() => onToggleCollapse(node.id)}
            className="flex items-center gap-2"
          >
            <Minimize2 className="h-4 w-4" />
            {collapsed ? "Expand children" : "Collapse children"}
          </Button>
          <Button
            variant="outline"
            onClick={() => onChallenge(node.id)}
            disabled={loadingChallenge}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {loadingChallenge ? "Challenging…" : "Challenge node"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
