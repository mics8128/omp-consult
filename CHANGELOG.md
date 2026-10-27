# Changelog

## 1.0.1 — 2026-10-27

- Direct the main agent to consult proactively for design and architecture planning before choosing an approach, without waiting for an explicit request.
- Clarify advice, review, and second-opinion usage; distinguish guidance from automatic routing and retain full tools unless read-only mode is explicitly requested.

## 1.0.0 — 2026-10-27

- Add an essential native `consult` tool backed by the configurable `consult` model role in `/model`.
- Provide normal full tools by default; restrict explicit `readonly: true` consultations to host-side reading/search tools.
- Surface resolved model, live tool activity, streaming output, and native subagent events; retain child transcripts for persistent sessions.
- Forward cancellation and preserve execution failure details without launching a nested CLI or relay agent.
- Initialize an unassigned role to `@slow` without overwriting existing model choices.
