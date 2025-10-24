export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { z } from "zod";
import { ReasoningGraph } from "@/schema/reasoning";
import { mockReasoningGraph } from "@/lib/mock";
import { InvalidGraphError, llmReason } from "@/lib/llm";

const ReasonBody = z.object({
  question: z.string().min(3, "Question must be at least 3 characters."),
  detail: z.number().int().min(1).max(5),
  mode: z.enum(["General", "Scientific", "Legal", "Math"]),
  useMock: z.boolean().optional().default(false),
  assumptions: z.array(z.string().min(1).max(400)).optional(),
});

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = ReasonBody.safeParse(json);

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

    if (useMock) {
      return NextResponse.json(mockReasoningGraph satisfies z.infer<typeof ReasoningGraph>);
    }

    try {
      const graph = await llmReason(params);
      return NextResponse.json(graph);
    } catch (error) {
      const payload: Record<string, unknown> = {
        error: "MODEL_INVALID_JSON",
        message: error instanceof Error ? error.message : String(error),
      };
      if (error instanceof InvalidGraphError) {
        payload.raw = error.raw;
      }
      return NextResponse.json(payload, { status: 400 });
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON payload.",
        },
        { status: 400 },
      );
    }
    console.error("Reason endpoint error", error);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
