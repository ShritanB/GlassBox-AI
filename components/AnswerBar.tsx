"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { confidenceLabel } from "@/lib/utils";
import type { Answer } from "@/schema/reasoning";

type AnswerBarProps = {
  answer: Answer;
};

export function AnswerBar({ answer }: AnswerBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Card className="flex flex-col gap-3 border border-primary/20 bg-primary/5 p-4 dark:border-blue-400/40 dark:bg-blue-950/30">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h2 className="text-base font-semibold">Answer</h2>
        <Badge variant="outline">Confidence {confidenceLabel(answer.confidence)}</Badge>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground dark:text-slate-200">{answer.summary}</p>
      <div className="flex flex-wrap gap-2 text-sm">
        {answer.key_drivers.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">Key drivers</span>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground dark:text-slate-300">
              {answer.key_drivers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {answer.weak_links.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-foreground">Weak links</span>
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground dark:text-slate-300">
              {answer.weak_links.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div>
        <Button
          variant="ghost"
          className="px-0 text-sm font-medium text-primary"
          onClick={() => setOpen((prev) => !prev)}
        >
          What would change my mind?
          {open ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
        </Button>
        {open && (
          <ul className="mt-2 space-y-2 rounded-md border bg-background p-3 text-sm text-muted-foreground dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200">
            {answer.what_would_change_my_mind.length === 0 ? (
              <li>No items provided.</li>
            ) : (
              answer.what_would_change_my_mind.map((item) => <li key={item}>{item}</li>)
            )}
          </ul>
        )}
      </div>
    </Card>
  );
}
