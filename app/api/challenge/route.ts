import { NextResponse } from "next/server";
import { z } from "zod";
import { GraphEdge, GraphNode, ReasoningGraph } from "@/schema/reasoning";
import { mockChallengePatch } from "@/lib/mock";
import { llmChallenge } from "@/lib/llm";

const ChallengeBody = z.object({
  nodeId: z.string().min(1, "nodeId is required."),
  currentGraph: ReasoningGraph,
  useMock: z.boolean().optional().default(false),
});

const ChallengePatch = z.object({
  nodes: z.array(GraphNode),
  edges: z.array(GraphEdge),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = ChallengeBody.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Request validation failed.",
          issues: parsed.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    const { useMock, ...params } = parsed.data;
    const response = useMock ? mockChallengePatch : await llmChallenge(params);
    const validation = ChallengePatch.safeParse(response);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Challenge patch failed validation.",
          issues: validation.error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(validation.data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
    }
    console.error("Challenge endpoint error", error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
