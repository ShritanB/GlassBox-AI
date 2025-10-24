import { z } from "zod";

export const Source = z.object({
  id: z.string(),
  title: z.string(),
  url: z.string().url().optional(),
  published: z.string().optional(),
  quality: z.enum(["high", "med", "low"]).optional(),
});

export const Citation = z.object({
  source_id: z.string(),
  start: z.number().optional(),
  end: z.number().optional(),
});

export const NodeType = z.enum([
  "subquestion",
  "claim",
  "evidence",
  "assumption",
  "computation",
  "answer",
]);

export const EdgeRelation = z.enum([
  "supports",
  "contradicts",
  "depends_on",
  "derived_from",
]);

export const GraphNode = z.object({
  id: z.string(),
  type: NodeType,
  text: z.string(),
  rationale: z.string().default(""),
  confidence: z.number().min(0).max(1).default(0.5),
  citations: z.array(Citation).default([]),
  tags: z.array(z.string()).default([]),
});

export const GraphEdge = z.object({
  from: z.string(),
  to: z.string(),
  relation: EdgeRelation,
  weight: z.number().min(-1).max(1).default(0.5),
});

export const Answer = z.object({
  summary: z.string(),
  confidence: z.number().min(0).max(1),
  key_drivers: z.array(z.string()).default([]),
  weak_links: z.array(z.string()).default([]),
  what_would_change_my_mind: z.array(z.string()).default([]),
});

export const ReasoningGraph = z.object({
  question: z.string(),
  definitions: z.array(z.object({ term: z.string(), meaning: z.string() })).default([]),
  assumptions: z.array(z.object({ id: z.string(), text: z.string() })).default([]),
  nodes: z.array(GraphNode),
  edges: z.array(GraphEdge),
  sources: z.array(Source).default([]),
  answer: Answer,
});

export type TReasoningGraph = z.infer<typeof ReasoningGraph>;
