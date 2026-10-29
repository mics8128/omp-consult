# Changelog

## 2.0.0 — 2026-10-30

- **Breaking:** replace standalone `consult` and `creative` tools with plugin-shipped native task agents. Select `agent: "consult"` or `agent: "creative"` through the ordinary `task` interface.
- Publish `agents/consult.md` and `agents/creative.md` with proactive-use descriptions, specialist prompts, and `@consult` / `@creative` model selectors. Keep existing model-role defaults and display metadata.
- Delegate execution, scoped background-job ownership, completion delivery, `wait`, cancellation, progress, transcripts, and follow-up wake turns entirely to native task behavior.
- Remove the custom executor, pending-job map, cancellation controllers, status updates, and `omp-specialist-result` delivery channel; no compatibility wrappers remain.
- **Breaking:** remove the per-call `readonly: true` sandbox. Agents have ordinary task capabilities; prompts or frontmatter tool lists are not advertised as equivalent enforced isolation.
- Verify the actual omp 18.14.0 CLI with `--wait-async`: both agents launched through task, the parent returned before completion, and both results arrived via native `async-result` messages. A real-model SDK smoke also confirmed native `wait`, parent-scoped jobs, exact scratch write/read, saved history, post-completion follow-up, and cancellation.

## 1.2.0 — 2026-10-30

- Return immediate launch receipts from `consult` and `creative`; deliver actual completion, cancellation, and failure separately to the owning session.
- Notify the main agent at its next step boundary, or resume it when idle, without updating a finished tool call or interrupting an in-flight tool batch.
- Return native agent IDs and retain completed agents for existing `write agent://<id>` peer messaging and `history://<id>` transcript access, including follow-up wake turns.
- Update tool and role prompts with background execution and native communication guidance; preserve model roles, access restrictions, generated titles, progress status, and transcripts.
- Cancel pending runs and suppress stale delivery on session transitions/shutdown. Report delivery errors without retrying or substituting models.
- Require omp 18.14.0+, the verified host for this delivery/lifecycle contract. Document session-lifetime and native async-job tracking limitations.

## 1.1.0 — 2026-10-30

- Add an essential `creative` tool for proactive story, interface, naming, copy, and visual ideation, sharing Consult's native execution, progress, cancellation, transcripts, and explicit read-only mode.
- Bundle both role prompts, invocation guidance, display names, and default aliases in `roles.ts` for portable plugin installation.
- Show `CONSULT` and `CREATIVE` in `/model`; initialize missing assignments to `@slow` and `@vision` respectively without overwriting existing model choices.
- Apply display metadata at runtime without requiring a manual configuration merge or persisting model-tag changes.

## 1.0.3 — 2026-10-27

- Use omp's native background subagent title generation instead of a fixed `Consult` description.
- Display generated task titles in live progress and final results, with `Consult` as the fallback; retain unique internal IDs and transcript filenames.

## 1.0.2 — 2026-10-27

- Shorten the tool description while preserving proactive design consultation, context requirements, native execution, and explicit read-only semantics.

## 1.0.1 — 2026-10-27

- Direct the main agent to consult proactively for design and architecture planning before choosing an approach, without waiting for an explicit request.
- Clarify advice, review, and second-opinion usage; distinguish guidance from automatic routing and retain full tools unless read-only mode is explicitly requested.

## 1.0.0 — 2026-10-27

- Add an essential native `consult` tool backed by the configurable `consult` model role in `/model`.
- Provide normal full tools by default; restrict explicit `readonly: true` consultations to host-side reading/search tools.
- Surface resolved model, live tool activity, streaming output, and native subagent events; retain child transcripts for persistent sessions.
- Forward cancellation and preserve execution failure details without launching a nested CLI or relay agent.
- Initialize an unassigned role to `@slow` without overwriting existing model choices.
