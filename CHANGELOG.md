# Changelog

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
