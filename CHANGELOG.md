# Changelog

## 1.0.0 — 2026-10-27

- Add an essential native `consult` tool backed by the configurable `consult` model role in `/model`.
- Provide normal full tools by default; restrict explicit `readonly: true` consultations to host-side reading/search tools.
- Surface resolved model, live tool activity, streaming output, and native subagent events; retain child transcripts for persistent sessions.
- Forward cancellation and preserve execution failure details without launching a nested CLI or relay agent.
- Initialize an unassigned role to `@slow` without overwriting existing model choices.
