# GlassBox-AI

Visualize, inspect, and challenge model-produced reasoning graphs. This MVP ships a Next.js + React Flow front end, validated API routes, and a mock LLM adapter so you can focus on extending the reasoning engine.

## Tech stack

- Next.js 14 (App Router) with TypeScript and Tailwind CSS
- shadcn/ui + Radix primitives for UI controls
- React Flow for interactive graph rendering
- Zod for schema validation on both client and server

## Getting started

1. **Install dependencies**
   ```bash
   pnpm install
   ```
2. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Set `ANTHROPIC_API_KEY` (or `LLM_API_KEY` as a fallback) plus `LLM_PROVIDER=anthropic` for live reasoning. `LLM_MODEL` is optional (defaults to `claude-3-sonnet-20240229`).

3. **Run the dev server**
   ```bash
   pnpm dev
   ```
   Visit http://localhost:3000 to use the app.

## Usage tips

- **Mock data**: The "Use mock data" toggle (enabled by default) calls the canned graph in `lib/mock.ts`. Turn it off to route through `lib/llm.ts`, which currently returns the same mock but is ready for your LLM integration.
- **Anthropic live mode**: Disable "Use mock data" and set `LLM_PROVIDER=anthropic` plus `ANTHROPIC_API_KEY` to request reasoning graphs from Claude (Sonnet).
- **Challenging nodes**: Select any node and click "Challenge node" to request counter-evidence. In mock mode this returns a stored contradicting subgraph.
- **Collapsing subtrees**: Use "Collapse children" in the inspector to declutter the graph without losing data. Collapsed nodes get a double-ring highlight.

## LLM integration

- Implement real calls in `lib/llm.ts`:
  - `llmReason()` builds the system prompt, calls your provider, and validates with Zod.
  - `llmChallenge()` should request a counter-argument patch for the selected node.
- `buildPrompt()` already encodes the schema requirements. Configure the Anthropic SDK via `ANTHROPIC_API_KEY`, or adjust to other providers if needed.

## Customizing the schema

- Central definitions live in `schema/reasoning.ts`. Update the Zod enums and types to add new node kinds or edge relations.
- When adding node types:
  1. Extend the `NodeType` enum in the schema.
  2. Map the new type to a color in `components/GraphView.tsx`.
  3. Adjust any UI copy that enumerates node categories.
- When adding edge relations:
  1. Extend `EdgeRelation` in the schema.
  2. Update styling/labels in `GraphView` if the new relation needs custom visuals.

## Project structure highlights

- `app/api/reason/route.ts` – Generates a reasoning graph with full input/output validation.
- `app/api/challenge/route.ts` – Returns counter-arguments (patches) for a node.
- `components/PromptPanel.tsx` – Prompt, detail, domain, and mock controls.
- `components/GraphView.tsx` – Layout and render of the reasoning graph via React Flow.
- `components/NodeInspector.tsx` – Node details, citations, and challenge controls.
- `components/AnswerBar.tsx` – Summary strip with confidence and "What would change my mind?" dropdown.
- `lib/mock.ts` – Sample reasoning graph and challenge patch.
- `lib/llm.ts` – Adapter and prompt builder with stubbed model calls.
- `lib/utils.ts` – Helper utilities including graph patch merging.

## Linting & formatting

- Run `pnpm lint` to execute Next.js/ESLint checks.
- Run `pnpm format` (check) or `pnpm format:fix` (write) for Prettier + Tailwind formatting.

## Deployment notes

- Production build: `pnpm build && pnpm start`.
- Ensure your deployment environment provides the necessary env vars and outbound network access for the chosen LLM provider.
