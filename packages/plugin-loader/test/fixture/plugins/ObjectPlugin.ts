import { ok } from "@drsmile1001/utils/Result";

import { definePlugin } from "../../../src/Plugin";
import type { PluginTestServiceMap } from "../PluginTestServiceMap";

export default definePlugin<PluginTestServiceMap>({
  name: "object-plugin",
  init: (_logger, serviceMap) => {
    const callBack = serviceMap.Callback;
    callBack("Object plugin initialized");
    return ok();
  },
});
