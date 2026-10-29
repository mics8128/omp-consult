import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";
import { cfgModelTags } from "@oh-my-pi/pi-coding-agent/config/model-settings";
import { ROLES } from "./roles";

/** Configure model roles; native task agents own execution and lifecycle. */
export default function consultExtension(pi: ExtensionAPI) {
  const { Settings } = pi.pi;

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
}
