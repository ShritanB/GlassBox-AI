"use client";

import { useMemo } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DomainMode = "General" | "Scientific" | "Legal" | "Math";

type PromptPanelProps = {
  question: string;
  onQuestionChange: (value: string) => void;
  detail: number;
  onDetailChange: (value: number) => void;
  mode: DomainMode;
  onModeChange: (value: DomainMode) => void;
  useMock: boolean;
  onUseMockChange: (value: boolean) => void;
  assumptions: string[];
  onAssumptionsChange: (values: string[]) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export function PromptPanel({
  question,
  onQuestionChange,
  detail,
  onDetailChange,
  mode,
  onModeChange,
  useMock,
  onUseMockChange,
  assumptions,
  onAssumptionsChange,
  onSubmit,
  loading,
}: PromptPanelProps) {
  const assumptionText = useMemo(() => assumptions.join("\n"), [assumptions]);

  const handleAssumptionsChange = (value: string) => {
    const rows = value
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);
    onAssumptionsChange(rows);
  };

  return (
    <Card className="h-full border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/70">
      <CardHeader>
        <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Reason about a question</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="question">Prompt</Label>
          <Textarea
            id="question"
            value={question}
            onChange={(event) => onQuestionChange(event.target.value)}
            placeholder="Ask the model to reason through a complex question..."
            rows={7}
            className="bg-white/80 dark:bg-slate-950/60"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="detail">Detail level</Label>
            <span className="text-sm text-muted-foreground dark:text-slate-300">{detail}</span>
          </div>
          <Slider
            id="detail"
            min={1}
            max={5}
            step={1}
            value={[detail]}
            onValueChange={(value) => onDetailChange(value[0] ?? 3)}
          />
        </div>

        <div className="space-y-2">
          <Label>Domain mode</Label>
          <Select value={mode} onValueChange={(value: DomainMode) => onModeChange(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a domain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="General">General</SelectItem>
              <SelectItem value="Scientific">Scientific</SelectItem>
              <SelectItem value="Legal">Legal</SelectItem>
              <SelectItem value="Math">Math</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="assumptions">Assumptions (optional)</Label>
            <span className="text-xs text-muted-foreground dark:text-slate-400">One per line</span>
          </div>
          <Textarea
            id="assumptions"
            value={assumptionText}
            onChange={(event) => handleAssumptionsChange(event.target.value)}
            rows={4}
            placeholder="e.g., Audience is adults without medical conditions"
            className="bg-white/80 dark:bg-slate-950/60"
          />
        </div>

        <div className="flex items-center justify-between rounded-md border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="space-y-1">
            <Label htmlFor="use-mock">Use mock data</Label>
            <p className="text-xs text-muted-foreground dark:text-slate-400">
              Toggle to use the built-in sample reasoning graph.
            </p>
          </div>
          <Switch
            id="use-mock"
            checked={useMock}
            onCheckedChange={onUseMockChange}
            aria-label="Use mock data"
          />
        </div>

        <Button
          className={cn("w-full")}
          onClick={onSubmit}
          disabled={loading || question.trim().length === 0}
        >
          {loading ? "Generating…" : "Reason"}
        </Button>
      </CardContent>
    </Card>
  );
}
