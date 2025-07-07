import type { PluginInitializer } from "~shared/PluginManager";
import { ok } from "~shared/utils/Result";

export const initialize: PluginInitializer<{
  Callback: (message: string) => void;
}> = async (_logger, resolver) => {
  const callBack = resolver.resolve("Callback");
  callBack("Sample plugin initialized");
  return ok({
    name: "sample-plugin",
    dispose: async () => {
      callBack("Sample plugin disposed");
    },
  });
};
