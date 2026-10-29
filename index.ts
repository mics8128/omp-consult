import { randomUUID } from "node:crypto";
import type { ExtensionAPI, AgentProgress } from "@oh-my-pi/pi-coding-agent";
import { cfgModelTags } from "@oh-my-pi/pi-coding-agent/config/model-settings";
import { ROLES } from "./roles";

const READ_TOOLS = ["read", "grep", "glob", "web_search", "ast_grep"];

/** Native, visible specialists. Execution and UI use the host-injected SDK. */
export default function consultExtension(pi: ExtensionAPI) {
  const { runSubprocess, Settings, Text } = pi.pi;
  const Type = pi.typebox.Type;

  pi.on("session_start", async (_event, ctx) => {
    if (ctx.agent.kind !== "main") return;
    const settings = Settings.instance;
    const tags = { ...cfgModelTags.get(settings) };
    for (const role of ROLES) {
      if (!settings.getModelRole(role.name)) {
        settings.setModelRole(role.name, role.defaultModel);
      }
      tags[role.name] = { ...tags[role.name], name: role.displayName };
    }
    cfgModelTags.override(settings, tags);
    await settings.flush();
  });

  for (const role of ROLES) pi.registerTool({
    name: role.name,
    label: role.label,
    loadMode: "essential",
    description: role.description,
    parameters: Type.Object({
      task: Type.String({ description: "Question or assignment, including requirements and relevant context." }),
      readonly: Type.Optional(Type.Boolean({ description: "Explicitly restrict to reading/search tools. Default false: normal full tool access." })),
    }),
    async execute(toolCallId, { task, readonly = false }, signal, onUpdate, ctx) {
      const settings = Settings.instance;
      if (!settings.getModelRole(role.name)) {
        throw new Error(`Configure the ${role.displayName} role in /model first. No substitute model was invoked.`);
      }
      const id = `${role.label}-${randomUUID().slice(0, 8)}`;
      const artifactsDir = ctx.sessionManager.getArtifactsDir() ?? undefined;
      let progress: AgentProgress | undefined;
      const update = () => {
        const lines = [
          `${progress?.description ?? role.label} · ${readonly ? "read-only" : "full tools"} · ${progress?.resolvedModel ?? settings.getModelRole(role.name)}`,
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
          name: role.name,
          description: `${role.label} selected in /model`,
          source: "user",
          systemPrompt: role.systemPrompt,
          model: [`@${role.name}`],
          ...(readonly ? { tools: READ_TOOLS } : { spawns: "*" as const }),
        },
        task,
        assignment: task,
        modelRole: role.name,
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
        `${result.description ?? progress?.description ?? role.label} · ${result.resolvedModel ?? settings.getModelRole(role.name)} · ${readonly ? "read-only" : "full tools"}`,
        result.output,
        result.error || result.stderr,
        transcript ? `Transcript: ${transcript}` : "",
      ].filter(Boolean).join("\n\n");
      return { content: [{ type: "text", text }], details: { id, readonly, transcript, result }, isError: result.exitCode !== 0 || result.aborted === true };
    },
    renderCall(args, _options, theme) {
      return new Text(theme.fg("toolTitle", `${role.label} · ${args.readonly ? "read-only" : "full tools"}`) + "\n" + args.task, 0, 0);
    },
    renderResult(result, _options, _theme) {
      return new Text(result.content.filter(part => part.type === "text").map(part => part.text).join("\n"), 0, 0);
    },
  });
}
