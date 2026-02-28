import { Type as t } from "@sinclair/typebox";

import { buildConfigFactoryEnv, envBoolean } from "@drsmile1001/config-factory";
import { type LogLevel, logLevelEnum } from "@drsmile1001/logger";

const getConfigFromEnv = buildConfigFactoryEnv(
  t.Object({
    TEST_LOGGER_LEVEL: t.Optional(t.String()),
    TEST_LOG_WITH_CONTEXT: t.Optional(
      t.Union([t.Literal("inline"), t.Literal("object")])
    ),
    TEST_SKIP_DB_TEST: t.Optional(envBoolean()),
    TEST_SKIP_EVENT_BUS_TEST: t.Optional(envBoolean()),
  })
);

export const getTestConfig = () => {
  const config = getConfigFromEnv();
  return {
    TEST_LOGGER_LEVEL: logLevelEnum.includes(config.TEST_LOGGER_LEVEL as any)
      ? (config.TEST_LOGGER_LEVEL as LogLevel)
      : "info",
    TEST_LOG_WITH_CONTEXT: config.TEST_LOG_WITH_CONTEXT ?? "inline",
    TEST_SKIP_DB_TEST: config.TEST_SKIP_DB_TEST ?? true,
    TEST_SKIP_EVENT_BUS_TEST: config.TEST_SKIP_EVENT_BUS_TEST ?? true,
  };
};
