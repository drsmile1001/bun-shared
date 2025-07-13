import { Type as t } from "@sinclair/typebox";

import type { Logger } from "~shared/Logger";
import type { ServiceMap, ServiceResolver } from "~shared/ServiceContainer";
import { type Result } from "~shared/utils/Result";
import type { MaybePromise } from "~shared/utils/TypeHelper";

export type Plugin<TServiceMap extends ServiceMap = {}> = {
  name: string;
  init: (
    logger: Logger,
    resolver: ServiceResolver<TServiceMap>
  ) => MaybePromise<Result<void, "SKIP" | "ERROR">>;
  dispose?: () => MaybePromise<void>;
};

export function definePlugin<TServiceMap extends ServiceMap = {}>(
  plugin: Plugin<TServiceMap>
): Plugin<TServiceMap> {
  return plugin;
}

export const pluginSchema = t.Object({
  name: t.String(),
  init: t.Function([t.Optional(t.Any()), t.Optional(t.Any())], t.Any()),
  dispose: t.Optional(t.Function([], t.Any())),
});
