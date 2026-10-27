# omp-consult

A native consultant tool for [oh-my-pi](https://github.com/can1357/oh-my-pi). Pick the consultant model in `/model`, then call one stable `consult` tool. No nested CLI, Python wrappers, or relay agents.

## Install

Requires omp 18.12.6 or later in the 18.x series. Uses omp's injected SDK; no runtime dependencies or build step.

```sh
git clone https://github.com/mics8128/omp-consult.git
omp plugin link ./omp-consult
```

Restart omp or reload extensions. On the first main-session start, the plugin adds a `consult` model role if it is missing, initially pointing to `@slow`. Existing assignments are never overwritten. Open `/model`, select **Roles**, then configure `consult` with your preferred model and thinking level. The model assignment uses omp's existing global/project role storage.

For a capitalized display name, optionally merge this into your omp configuration:

```yaml
modelTags:
  consult:
    name: Consult
    color: accent
```

The plugin does not bundle credentials, choose a provider for you, or replace your current main model.

## Usage

Use Consult proactively for design and architecture planning, advice, reviews, or a second opinion. For design tasks, the main agent should call Consult **before settling on the approach**, without waiting for an explicit request. Also use it to review code and proposals or get an independent perspective on an existing judgment.

This is guidance to the main agent, not deterministic automatic routing: the plugin does not detect or dispatch design tasks.

You can also explicitly ask your main agent to use `consult`, or call it through the usual tool interface:

```json
{"task":"Review the proposed cache design. Read src/cache.ts and report correctness risks."}
```

Default: **normal full tool access**, including read, write, edit, execution, and normally enabled extensions/MCP capabilities. It is not an advice-only or read/write-only sandbox. Design and review tasks do not automatically enable read-only mode; use `readonly: true` only when explicitly requested. Existing omp settings and approval policies still apply.

Explicit read-only mode:

```json
{"task":"Read src/cache.ts and review it without making changes.","readonly":true}
```

Read-only runs use a native restricted-tool session with only `read`, `grep`, `glob`, `web_search`, and `ast_grep`. Execution, mutations, delegation, discovered extensions, and MCP discovery are not granted to that session. This is host-side tool restriction, not a prompt asking the model to behave. Provider-native capabilities remain controlled by the provider and omp.

The consultant gets the supplied task, project context, and tool access, **not the parent conversation**. Include relevant requirements, decisions, and file/artifact references in `task`.

Natural-language examples:

- “Design this module's interfaces.” → the main agent consults before choosing the approach.
- “Use Consult to implement this change.”
- “Use Consult in read-only mode to review this design.”
- “Ask Consult for three alternative structures; include the constraints above.”

## Visibility and cancellation

The tool displays the resolved model, access mode, current tool/arguments, and streaming output. It forwards native subagent events to omp's event bus. Persistent parent sessions retain a separate child transcript beside the parent's artifacts, and the final result includes its path. Ephemeral (`--no-session`) parents do not retain a transcript.

Cancellation is passed to the native executor. Provider errors and aborted results are returned with their actual outcome; the plugin does not relaunch a failed consultation or invent a replacement model. Normal omp role resolution and configured provider fallback policies still apply.

## Implementation

`index.ts` registers the essential `consult` tool and uses the host-injected `pi.pi.runSubprocess` executor. Despite its historical name, this executor is **in-process**. There is no `subprocess`, `child_process`, `Bun.spawn`, or shell launch in the plugin.

The plugin uses the supported dynamic role settings rather than patching omp's built-in role list. Each consultation is a separate native agent; finished agents are disposed while saved transcripts remain available.

## Verification

Live verification on omp 18.12.6/18.13.1:

- Default mode: consultant used `write` to create a scratch file, then `read` to verify exact content; 45 live progress updates were observed.
- Explicit read-only mode: a request to create a file could not access `write`; it read the existing proof file instead. The forbidden file remained absent, with 18 live progress updates.
- The resolved model and configured thinking level appeared in the result.
- Native `/model` → Roles rendered the Consult entry.
- Persistent parent sessions saved a child `.jsonl` transcript and returned its path.

Smoke runs use real configured models and may incur provider charges. No credentials, user configuration, or private transcripts belong in this repository.

## License

MIT.
