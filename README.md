# omp-consult

Native consultant and creative director agents for [oh-my-pi](https://github.com/can1357/oh-my-pi). Select each model in `/model`, then launch `consult` or `creative` through the existing **`task` tool**. Execution, background jobs, completion delivery, waiting, cancellation, and follow-up messages use omp's native task lifecycle. No custom executor, completion channel, nested CLI, or relay agent.

## Install

Requires omp 18.14.0 or later in the 18.x series. Uses omp's injected SDK; no runtime dependencies or build step.

```sh
git clone https://github.com/mics8128/omp-consult.git
omp plugin link ./omp-consult
```

Restart omp after installing or upgrading so native task discovery rebuilds its agent list. The plugin ships `agents/consult.md` and `agents/creative.md`; omp discovers agents from linked/installed plugin roots. No copying files into personal agent directories or manually merging YAML is required. Existing project/user agents of the same name take precedence under omp's normal discovery rules.

On the first main-session start, the extension adds missing model assignments: `consult` inherits `@slow`, and `creative` inherits `@vision`. Existing assignments are never overwritten. Open `/model` → **Roles** to select each model and thinking level independently. Entries display as **CONSULT** and **CREATIVE**; internal IDs remain lowercase. Display metadata is applied at runtime without persisting tag changes, and existing tag colors/metadata are preserved.

The plugin does not bundle credentials, fix a provider/model, or replace the main model. Normal task model overrides, provider routing, and fallback policies still apply.

## Usage

Use the ordinary `task` interface and select the specialist with `agent`. With native batch mode enabled:

```json
{
  "context": "We are reviewing the cache design. Requirements and decisions are in DESIGN.md.",
  "tasks": [{
    "agent": "consult",
    "task": "Read DESIGN.md and src/cache.ts. Report correctness risks and recommend an approach.",
    "solutionSpace": "Compare viable cache ownership and cancellation designs; do not modify files."
  }]
}
```

For creative work, select `"agent": "creative"` and provide the assignment and constraints in the same fields. Several independent assignments can share one native task batch. Follow the schema advertised by the host; if `task.batch` is disabled, use its flat `agent`, `task`, and `solutionSpace` form instead. The specialist is an agent selector, not a model override.

- **Consult:** use proactively before settling on a design or architecture, and for advice, reviews, or second opinions.
- **Creative:** use proactively for stories, character concepts, UI/UX concepts, naming, copywriting, or visual direction. Implementation remains with the main agent unless explicitly assigned.

These descriptions appear in the native task agent list. They guide the main agent; the plugin does not implement a classifier or deterministic automatic routing. Include relevant requirements, decisions, and file references in the task/context rather than assuming the specialist has the full parent conversation.

## Standard task behavior

Both specialists are ordinary native task agents; neither declares `blocking: true`.

- When native async execution is available and enabled, `task` returns its standard background-agent receipt. Continue independent work; results arrive through the same native completion channel as other task agents.
- Use the existing `wait` tool when blocked on work you started. Do not poll for progress or launch a duplicate assignment.
- In print mode, `--wait-async` waits for these jobs and processes their results before exiting, just as for other native task agents.
- Progress, generated titles, transcripts, job status, cancellation, and session teardown follow omp's task implementation. When async is disabled or the host has no manager, the normal native synchronous fallback applies.
- The plugin neither registers a second job system nor sends `omp-specialist-result` messages.

Use the exact agent ID returned by task for native communication:

```text
write {"path":"agent://<id>","content":"Also consider the cancellation boundary."}
read  {"path":"agent://<id>"}
read  {"path":"history://<id>"}
```

Completed agents follow the host's native idle/parked lifecycle and can be messaged for follow-up questions. Use native job/agent controls for cancellation. Closing the owning omp process does not create a durable external worker; normal host persistence and restoration rules apply.

## Access and migration from 1.x

**Version 2.0 removes the standalone `consult` and `creative` tools.** Replace direct tool calls with native `task` calls selecting the corresponding agent. Existing `/model` role assignments remain usable. There are no compatibility wrappers or separate completion adapters.

Both agents use normal full task capabilities (`spawns: "*"`), subject to host settings and approvals. Creative's recommendations-only default is role guidance, not a tool sandbox.

**The old per-call `readonly: true` parameter is removed.** Native task does not offer an equivalent switch. A "do not modify files" instruction is not enforced read-only isolation, and merely listing read tools in agent frontmatter does not guarantee that extension/MCP tools are excluded. Do not substitute `tasks[].tools`: that field grants eval-defined custom tools, not a built-in restriction list. If enforced read-only execution is required, use a host-supported restricted mode such as native plan mode and verify its effective capabilities; this plugin no longer supplies a separate restricted executor.

## Implementation

- `agents/consult.md`, `agents/creative.md`: native agent descriptions, role prompts, and `@consult` / `@creative` model selectors.
- `roles.ts`: model role IDs, default aliases, and uppercase display names.
- `index.ts`: model-role initialization and display metadata only. It registers no tools and owns no background promises, controllers, progress UI, or completion messages.

## Verification

Version 2.0.0 was exercised through the actual omp 18.14.0 CLI with `--wait-async` and real configured models:

- The main agent discovered both packaged specialists and launched them together through native `task`, without a model override.
- Task returned `Spawned 2 background agents using consult, creative`; the parent finished its initial turn before either result.
- Both children used `read`, returned their requested acceptance markers, and arrived as native `async-result` messages that resumed the parent. Consult reported package version `2.0.0`; Creative produced a Chinese story opening.

An additional real-model run through the installed SDK package (which reports version 18.13.3, separately from the 18.14.0 CLI binary) verified:

- Normal linked-plugin discovery advertised both agent descriptions; disabling discovery in an isolated harness did not include the package agent roots.
- The two-agent launch returned in 6 ms and registered two native task jobs owned by `Main`.
- Native `wait` returned the first completed result while reporting the other still running; the second result resumed the idle parent through native delivery.
- Consult wrote and read back the exact scratch value, and native `history://` read the saved child transcript.
- A post-completion `write agent://<id>` woke Consult; native `wait` received its follow-up answer.
- The session's native cancellation control moved a third probe job to `cancelled`.

Smoke runs use real configured models and may incur provider charges. Credentials, private configuration, transcripts, and scratch files do not belong in this repository.

## License

MIT.
