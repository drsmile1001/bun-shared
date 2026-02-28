import type { Logger } from "@drsmile1001/logger";
import { ok } from "@drsmile1001/utils/Result";

import { type Plugin, definePlugin } from "../../../src/Plugin";
import type { PluginTestServiceMap } from "../PluginTestServiceMap";

class ClassPlugin implements Plugin<PluginTestServiceMap> {
  name = "class-plugin";
  callback?: (message: string) => void;
  init(logger: Logger, serviceMap: PluginTestServiceMap) {
    this.callback = serviceMap.Callback;
    this.callback("Class plugin initialized");
    return ok();
  }
  dispose() {
    if (this.callback) {
      this.callback("Class plugin disposed");
    }
  }
}

export default definePlugin<{
  Callback: (message: string) => void;
}>(new ClassPlugin());
