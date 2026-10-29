# omp-consult

Native consultant and creative director tools for [oh-my-pi](https://github.com/can1357/oh-my-pi). Pick each model in `/model`, then call `consult` or `creative`. No nested CLI, Python wrappers, or relay agents.

## Install

Requires omp 18.12.6 or later in the 18.x series. Uses omp's injected SDK; no runtime dependencies or build step.

```sh
git clone https://github.com/mics8128/omp-consult.git
omp plugin link ./omp-consult
```

Restart omp or reload extensions. On the first main-session start, the plugin adds missing model assignments: `consult` inherits `@slow`, and `creative` inherits `@vision`. Existing assignments are never overwritten. Open `/model` → **Roles** to select each model and thinking level independently. The entries display as **CONSULT** and **CREATIVE**; their internal IDs remain lowercase. Assignments use omp's existing global/project role storage.

Role prompts, proactive invocation descriptions, default role aliases, and uppercase display names ship in `roles.ts` with the plugin. No separate agent files, prompt installation, or manual YAML merge is required on another machine. Display names are applied at runtime without persisting tag changes; existing tag colors and other metadata are preserved.

The plugin does not bundle credentials, fix a provider/model, or replace your current main model. The defaults inherit whatever models you assign to `SLOW` and `VISION`; either specialist can be overridden independently in `/model`.

## Usage

Use **Consult** proactively for design and architecture planning, advice, reviews, or a second opinion. For technical design tasks, the main agent should call Consult **before settling on the approach**, without waiting for an explicit request. Also use it to review code and proposals or get an independent perspective on an existing judgment.

Use **Creative** proactively when work needs creativity: plot and story ideation, character concepts, UI/UX concepts, naming, copywriting, or visual direction. The creative director offers concrete ideas and recommendations without forcing a fixed process or number of options. Implementation remains with the main agent unless explicitly assigned to Creative.

Each tool's description tells the main agent when to call it. This is guidance, not deterministic automatic routing: the plugin does not classify or dispatch tasks.

You can also explicitly ask your main agent to use `consult`, or call it through the usual tool interface:

```json
{"task":"Review the proposed cache design. Read src/cache.ts and report correctness risks."}
```

For creative work, call `creative` with the same parameters:

```json
{"task":"Read the existing onboarding screens and propose an interface concept that makes the first session feel welcoming without slowing users down."}
```

Both tools default to **normal full tool access**, including read, write, edit, execution, and normally enabled extensions/MCP capabilities. They are not advice-only or read/write-only sandboxes. Creative normally gives recommendations because of its role prompt, not an enforced mutation restriction. Design and review tasks do not automatically enable read-only mode; use `readonly: true` only when explicitly requested. Existing omp settings and approval policies still apply.

Explicit read-only mode:

```json
{"task":"Read src/cache.ts and review it without making changes.","readonly":true}
```

Read-only runs use a native restricted-tool session with only `read`, `grep`, `glob`, `web_search`, and `ast_grep`. Execution, mutations, delegation, discovered extensions, and MCP discovery are not granted to that session. This is host-side tool restriction, not a prompt asking the model to behave. Provider-native capabilities remain controlled by the provider and omp.

Each specialist gets the supplied task, project context, and tool access, **not the parent conversation**. Include relevant requirements, decisions, and file/artifact references in `task`.

Natural-language examples:

- “Design this module's interfaces.” → the main agent consults before choosing the approach.
- “Use Consult to implement this change.”
- “Use Consult in read-only mode to review this design.”
- “Ask Consult for three alternative structures; include the constraints above.”
- “Help develop this character's motivation and the next plot turn.” → the main agent calls Creative.
- “Give this interface a distinctive visual direction.” → the main agent calls Creative.

## Visibility and cancellation

The tool displays the resolved model, access mode, current tool/arguments, and streaming output. It forwards native subagent events to omp's event bus. Persistent parent sessions retain a separate child transcript beside the parent's artifacts, and the final result includes its path. Ephemeral (`--no-session`) parents do not retain a transcript.

Task titles follow omp's native subagent flow: the executor generates a short description from the assignment in the background, using omp's configured title model. Progress and final results display that description when available; until then, or if title generation fails, they display `Consult`. Random IDs remain internal identifiers and transcript filenames, not task titles. No caller-supplied name or separate plugin title-generation request is needed.

Cancellation is passed to the native executor. Provider errors and aborted results are returned with their actual outcome; the plugin does not relaunch a failed consultation or invent a replacement model. Normal omp role resolution and configured provider fallback policies still apply.

## Implementation

`index.ts` registers the essential `consult` and `creative` tools from the bundled `roles.ts` definitions, using one shared execution path with the host-injected `pi.pi.runSubprocess` executor. Despite its historical name, this executor is **in-process**. There is no `subprocess`, `child_process`, `Bun.spawn`, or shell launch in the plugin.

The plugin uses supported dynamic role settings rather than patching omp's built-in role list. The public `config/model-settings` handle applies runtime display metadata through omp's extension loader; execution and UI utilities remain host-injected. Each call is a separate native agent; finished agents are disposed while saved transcripts remain available.

## Verification

Live verification on omp 18.12.6/18.13.1:

- Default mode: consultant used `write` to create a scratch file, then `read` to verify exact content; 45 live progress updates were observed.
- Explicit read-only mode: a request to create a file could not access `write`; it read the existing proof file instead. The forbidden file remained absent, with 18 live progress updates.
- The resolved model and configured thinking level appeared in the result.
- Native `/model` → Roles rendered the Consult entry.
- Persistent parent sessions saved a child `.jsonl` transcript and returned its path.
- Version 1.0.3 on omp 18.13.1: native generated titles appeared in live progress and final results in both full-tool and read-only runs (57 and 53 updates). Exact scratch-file write/read, read-only write denial, and saved child transcripts were confirmed again; `omp render --plain` displayed both generated titles in the terminal transcript.

Version 1.1.0 verification on omp 18.13.3:

- Loaded the linked plugin through omp's real extension loader and called `creative` in read-only mode. It resolved the inherited VISION model (`llm-esapp/gemini-3.8-flash-high:high`), read `roles.ts`, and returned a Chinese story premise.
- Observed the native generated task title in live progress and the final result, plus a saved child transcript.
- Opened the actual `/model` → Roles terminal UI: `CONSULT` and `CREATIVE` both appeared uppercase, with the existing consultant model retained and Creative resolving to the VISION model.
- `npm pack --dry-run --json` confirmed that `roles.ts` ships with `index.ts` in the installable package.
- Creative's full-tool run wrote and read back an exact 18-byte scratch value. Its read-only run reported `write` unavailable and read the same value instead; the forbidden file remained absent. A Consult read-only regression run read the exact value successfully. All three runs returned generated native titles, resolved models, saved transcripts, and successful execution results.
- A plain Chinese story-ideation request, without naming either tool, caused the main agent to call `creative` and integrate its returned idea. This verifies the proactive guidance in one live scenario, not deterministic routing for every model or prompt.

Smoke runs use real configured models and may incur provider charges. No credentials, user configuration, or private transcripts belong in this repository.

## License

MIT.
