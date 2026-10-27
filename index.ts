import { randomUUID } from "node:crypto";
import type { ExtensionAPI, AgentProgress } from "@oh-my-pi/pi-coding-agent";

const READ_TOOLS = ["read", "grep", "glob", "web_search", "ast_grep"];

/** Native, visible consultation. All SDK runtime access comes from the host realm. */
export default function consultExtension(pi: ExtensionAPI) {
  const { runSubprocess, Settings, Text } = pi.pi;
  const Type = pi.typebox.Type;

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.agent.kind !== "main") return;
    const settings = Settings.instance;
    if (!settings.getModelRole("consult")) {
      settings.setModelRole("consult", "@slow");
      await settings.flush();
    }
  });

  pi.registerTool({
    name: "consult",
    label: "Consult",
    loadMode: "essential",
    description: "Call proactively before settling on a design or architecture, and for advice, reviews, or second opinions. Uses the Consult model configured in /model, with live progress and a saved transcript. Provide all relevant context; the consultant does not inherit this conversation. Full tools by default; set readonly=true only when explicitly requested. Use this native tool, not CLI wrappers or relay agents.",
    parameters: Type.Object({
      task: Type.String({ description: "Question or assignment, including requirements and relevant context." }),
      readonly: Type.Optional(Type.Boolean({ description: "Explicitly restrict to reading/search tools. Default false: normal full tool access." })),
    }),
    async execute(toolCallId, { task, readonly = false }, signal, onUpdate, ctx) {
      const settings = Settings.instance;
      if (!settings.getModelRole("consult")) {
        throw new Error("Configure the Consult role in /model first. No substitute model was invoked.");
      }
      const id = `Consult-${randomUUID().slice(0, 8)}`;
      const artifactsDir = ctx.sessionManager.getArtifactsDir() ?? undefined;
      let progress: AgentProgress | undefined;
      const update = () => {
        const lines = [
          `${id} · ${readonly ? "read-only" : "full tools"} · ${progress?.resolvedModel ?? settings.getModelRole("consult")}`,
          progress?.currentTool ? `${progress.currentTool} ${progress.currentToolArgs ?? ""}` : progress?.status ?? "starting",
          ...(progress?.recentOutput.slice().reverse() ?? []),
        ];
        onUpdate?.({ content: [{ type: "text", text: lines.join("\n") }], details: { id, readonly, progress } });
      };
      update();
      const result = await runSubprocess({
        cwd: ctx.cwd,
        id,
        index: 0,
        parentToolCallId: toolCallId,
        parentAgentId: ctx.agent.id,
        taskDepth: ctx.agent.depth,
        agent: {
          name: "consult",
          description: "Consultant selected in /model",
          source: "user",
          systemPrompt: "You are the consultant requested by the user. Address the supplied assignment directly using the available tools. Do not delegate this same consultation to another consultant. Preserve the user's scope and report observed evidence and limitations honestly.",
          model: ["@consult"],
          ...(readonly ? { tools: READ_TOOLS } : { spawns: "*" as const }),
        },
        task,
        description: "Consult",
        modelRole: "consult",
        settings,
        modelRegistry: ctx.modelRegistry,
        authStorage: ctx.modelRegistry.authStorage,
        credentialSourceSessionId: ctx.sessionManager.getSessionId(),
        localProtocolOptions: ctx.localProtocolOptions,
        parentArtifactManager: ctx.sessionManager.getArtifactManager(),
        parentServiceTier: pi.getServiceTiers(),
        artifactsDir,
        sessionFile: ctx.sessionManager.getSessionFile(),
        eventBus: pi.events,
        structured: false,
        restrictToolNames: readonly,
        enableMCP: !readonly,
        signal,
        keepAlive: false,
        onProgress(next) { progress = next; update(); },
      });
      const transcript = artifactsDir ? `${artifactsDir}/${id}.jsonl` : undefined;
      const text = [
        `${id} · ${result.resolvedModel ?? settings.getModelRole("consult")} · ${readonly ? "read-only" : "full tools"}`,
        result.output,
        result.error || result.stderr,
        transcript ? `Transcript: ${transcript}` : "",
      ].filter(Boolean).join("\n\n");
      return { content: [{ type: "text", text }], details: { id, readonly, transcript, result }, isError: result.exitCode !== 0 || result.aborted === true };
    },
    renderCall(args, _options, theme) {
      return new Text(theme.fg("toolTitle", `Consult · ${args.readonly ? "read-only" : "full tools"}`) + "\n" + args.task, 0, 0);
    },
    renderResult(result, _options, _theme) {
      return new Text(result.content.filter(part => part.type === "text").map(part => part.text).join("\n"), 0, 0);
    },
  });
}
