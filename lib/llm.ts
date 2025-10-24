import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "crypto";
import JSON5 from "json5";
import { ZodError } from "zod";
import { ReasoningGraph, type GraphEdge, type GraphNode, type TReasoningGraph } from "@/schema/reasoning";
import { mockChallengePatch } from "@/lib/mock";

type ReasonParams = {
  question: string;
  detail: number;
  mode: "General" | "Scientific" | "Legal" | "Math";
  assumptions?: string[];
  signal?: AbortSignal;
};

type ChallengeParams = {
  nodeId: string;
  currentGraph: TReasoningGraph;
  signal?: AbortSignal;
};

const anthropicClient = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.LLM_API_KEY;
  if (!apiKey) {
    throw new Error("Anthropic API key is not configured. Set ANTHROPIC_API_KEY or LLM_API_KEY.");
  }
  return new Anthropic({ apiKey });
};

export class InvalidGraphError extends Error {
  raw: string;
  constructor(message: string, raw: string) {
    super(message);
    this.raw = raw;
    this.name = "InvalidGraphError";
  }
}

function stripCodeFences(s: string) {
  return s.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();
}

export function extractJsonCandidate(s: string): string | null {
  const txt = stripCodeFences(s);
  const start = txt.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  for (let i = start; i < txt.length; i++) {
    const ch = txt[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        return txt.slice(start, i + 1);
      }
    }
  }
  return null;
}

type AnyObj = Record<string, any>;

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeGraphShape(rawObj: AnyObj): AnyObj {
  const out: AnyObj = { ...rawObj };

  out.nodes = Array.isArray(out.nodes) ? [...out.nodes] : [];
  out.edges = Array.isArray(out.edges) ? [...out.edges] : [];
  out.sources = Array.isArray(out.sources) ? [...out.sources] : [];

  if (out.sources.length && typeof out.sources[0] === "string") {
    out.sources = out.sources.map((s: string, index: number) => ({
      id: `S${index + 1}`,
      title: String(s),
    }));
  } else {
    out.sources = out.sources.map((s: AnyObj, index: number) => ({
      id: String(s?.id ?? s?.source ?? `S${index + 1}`),
      title: String(s?.title ?? s?.name ?? s?.url ?? `Source ${index + 1}`),
      url: typeof s?.url === "string" ? s.url : undefined,
      published: typeof s?.published === "string" ? s.published : undefined,
      quality: ["high", "med", "low"].includes(s?.quality) ? s.quality : undefined,
    }));
  }

  const normalizeCitations = (list: any[]): AnyObj[] =>
    list
      .map((citation) => {
        if (!citation) return null;
        if (typeof citation === "string") {
          return { source_id: citation };
        }
        if (typeof citation === "object") {
          const sourceId = citation.source_id ?? citation.id ?? citation.source;
          if (!sourceId) return null;
          return {
            source_id: String(sourceId),
            start: typeof citation.start === "number" ? citation.start : undefined,
            end: typeof citation.end === "number" ? citation.end : undefined,
          };
        }
        return null;
      })
      .filter((item): item is AnyObj => Boolean(item));

  out.nodes = out.nodes.map((node: AnyObj, index: number) => {
    const fallbackId = (() => {
      try {
        return randomUUID();
      } catch {
        return `node-${index + 1}-${Math.random().toString(36).slice(2, 8)}`;
      }
    })();

    const rawTags = Array.isArray(node.tags) ? node.tags : [];
    return {
      id: String(node.id ?? fallbackId),
      type: node.type,
      text: String(node.text ?? ""),
      rationale: typeof node.rationale === "string" ? node.rationale : "",
      confidence:
        typeof node.confidence === "number" ? clamp(node.confidence, 0, 1) : 0.5,
      citations: Array.isArray(node.citations) ? normalizeCitations(node.citations) : [],
      tags: rawTags.map((tag) => String(tag)),
    };
  });

  out.edges = out.edges.map((edge: AnyObj) => ({
    from: String(edge.from ?? ""),
    to: String(edge.to ?? ""),
    relation:
      typeof edge.relation === "string"
        ? edge.relation
        : String(edge.relation ?? edge.type ?? ""),
    weight:
      typeof edge.weight === "number"
        ? clamp(edge.weight, -1, 1)
        : 0.5,
  }));

  const answer = out.answer ?? {};
  out.answer = {
    summary: String(answer.summary ?? ""),
    confidence:
      typeof answer.confidence === "number"
        ? clamp(answer.confidence, 0, 1)
        : 0.6,
    key_drivers: Array.isArray(answer.key_drivers)
      ? answer.key_drivers.map((item: unknown) => String(item))
      : [],
    weak_links: Array.isArray(answer.weak_links)
      ? answer.weak_links.map((item: unknown) => String(item))
      : [],
    what_would_change_my_mind: Array.isArray(answer.what_would_change_my_mind)
      ? answer.what_would_change_my_mind.map((item: unknown) => String(item))
      : [],
  };

  out.question = String(out.question ?? "");

  return out;
}

function parseCandidateToGraph(candidate: string): TReasoningGraph {
  let parsed: any;
  try {
    parsed = JSON.parse(candidate);
  } catch (error) {
    try {
      parsed = JSON5.parse(candidate);
    } catch (json5Error) {
      const message = error instanceof Error ? error.message : "Unknown JSON parse error.";
      const message5 = json5Error instanceof Error ? json5Error.message : "Unknown JSON5 parse error.";
      throw new Error(`JSON parse error: ${message}; JSON5 parse error: ${message5}`);
    }
  }

  const normalized = normalizeGraphShape(parsed);
  try {
    return ReasoningGraph.parse(normalized);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues.map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`).join("; ");
      throw new Error(`Schema validation failed: ${issues}`);
    }
    throw error;
  }
}

function getTextFromResponse(response: Awaited<ReturnType<Anthropic["messages"]["create"]>>) {
  return response.content
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("")
    .trim();
}

async function repairJsonWithClaude(
  client: Anthropic,
  raw: string,
  schemaHint: string,
): Promise<TReasoningGraph> {
  const resp = await client.messages.create({
    model: process.env.LLM_MODEL || "claude-3-sonnet-20240229",
    max_tokens: 1500,
    temperature: 0,
    system:
      "You repair malformed JSON to EXACTLY match the target schema. Output VALID JSON ONLY. No markdown, no commentary.",
    messages: [
      {
        role: "user",
        content: `The following text should be a JSON object that matches the schema summary.
Fix it so that it is valid JSON and matches the schema keys and types. Output ONLY the JSON.

---SCHEMA SUMMARY (${schemaHint})---
Required keys: question, nodes, edges, sources, answer.
nodes[].type ∈ {subquestion, claim, evidence, assumption, computation, answer}
edges[].relation ∈ {supports, contradicts, depends_on, derived_from}
answer has { summary: string, confidence: number in [0,1] }
--------------------

TEXT TO FIX:
${raw}`,
      },
    ],
  });

  const fixed = getTextFromResponse(resp);
  const candidate = extractJsonCandidate(fixed);
  if (!candidate) {
    throw new Error("No JSON candidate found.");
  }
  return parseCandidateToGraph(candidate);
}

export async function llmReason({ question, detail, mode, assumptions = [] }: ReasonParams): Promise<TReasoningGraph> {
  const provider = (process.env.LLM_PROVIDER ?? "").toLowerCase();
  if (provider && provider !== "anthropic") {
    throw new Error('LLM_PROVIDER must be set to "anthropic" or left empty to use Anthropic.');
  }

  const SYSTEM_PROMPT = `
You are a reasoning engine that outputs ONE JSON object matching this schema summary exactly.

Required top-level keys:
- question: string
- nodes: array of { id: string, type: "subquestion"|"claim"|"evidence"|"assumption"|"computation"|"answer", text: string, rationale?: string, confidence?: number [0..1], citations?: {source_id:string,start?:number,end?:number}[], tags?: string[] }
- edges: array of { from: string, to: string, relation: "supports"|"contradicts"|"depends_on"|"derived_from", weight?: number [-1..1] }
- sources: array of { id: string, title: string, url?: string, published?: string, quality?: "high"|"med"|"low" }
  IMPORTANT: Do NOT output sources as plain strings. Each source must be an OBJECT with "id" and "title" at minimum.
- answer: { summary: string, confidence: number [0..1], key_drivers?: string[], weak_links?: string[], what_would_change_my_mind?: string[] }

Constraints:
- Total nodes ≤ 20.
- Every factual claim that uses external info must include at least one citation referencing sources[].id.
- Output VALID JSON ONLY. No markdown, no commentary, no code fences.

Minimal example (structure only, not content):
{
  "question": "Q?",
  "nodes": [
    {"id": "n1", "type": "answer", "text": "Example answer", "confidence": 0.7, "citations": [], "tags": []}
  ],
  "edges": [],
  "sources": [
    {"id": "s1", "title": "Example Source", "url": "https://example.com"}
  ],
  "answer": {
    "summary": "Example",
    "confidence": 0.7,
    "key_drivers": [],
    "weak_links": [],
    "what_would_change_my_mind": []
  }
}
`;

  const USER_PROMPT = `
Question: ${question}
Assumptions: ${assumptions.length ? assumptions.join("\n") : "None"}
Detail level: ${detail}
Mode: ${mode}
Return the JSON now.
`;

  const client = anthropicClient();
  const response = await client.messages.create({
    model: process.env.LLM_MODEL || "claude-3-sonnet-20240229",
    max_tokens: 2000,
    temperature: 0.2,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: USER_PROMPT }],
  });

  const raw = getTextFromResponse(response);

  try {
    const candidate = extractJsonCandidate(raw);
    if (!candidate) {
      throw new Error("No JSON candidate found.");
    }
    return parseCandidateToGraph(candidate);
  } catch (primaryError) {
    try {
      return await repairJsonWithClaude(client, raw, "ReasoningGraph");
    } catch (repairError) {
      const secondaryResponse = await client.messages.create({
        model: process.env.LLM_MODEL || "claude-3-sonnet-20240229",
        max_tokens: 2000,
        temperature: 0.1,
        system: `${SYSTEM_PROMPT}\nReturn VALID JSON ONLY. If unsure, return minimal valid object per schema.`,
        messages: [{ role: "user", content: USER_PROMPT }],
      });

      const raw2 = getTextFromResponse(secondaryResponse);
      try {
        const candidate2 = extractJsonCandidate(raw2);
        if (!candidate2) {
          throw new Error("No JSON candidate found.");
        }
        return parseCandidateToGraph(candidate2);
      } catch (secondaryError) {
        const message = [
          "Model returned invalid JSON after repair attempts.",
          `Initial parse error: ${primaryError instanceof Error ? primaryError.message : String(primaryError)}`,
          `Repair parse error: ${repairError instanceof Error ? repairError.message : String(repairError)}`,
          `Final parse error: ${secondaryError instanceof Error ? secondaryError.message : String(secondaryError)}`,
        ].join("\n");
        throw new InvalidGraphError(message, `First response:\n${raw}\n\nSecond response:\n${raw2}`);
      }
    }
  }
}

export async function llmChallenge(
  _params: ChallengeParams,
): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  // FUTURE: Post challenge context to LLM and parse patch response.
  return mockChallengePatch;
}
