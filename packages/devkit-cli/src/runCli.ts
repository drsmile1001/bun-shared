import { cac } from "cac";

import { createDefaultLoggerFromEnv } from "@drsmile1001/logger";

import { registerProjectList } from "./ProjectList";
import { registerPublish } from "./Publish";

export async function runCli(argv = process.argv): Promise<void> {
  const logger = createDefaultLoggerFromEnv();
  const cli = cac();

  registerProjectList(cli, logger);
  registerPublish(cli, logger);

  cli.help();
  cli.parse(argv, { run: false });

  if (!cli.matchedCommand) {
    cli.outputHelp();
    return;
  }

  try {
    await cli.runMatchedCommand();
  } catch (error) {
    logger.error({ error }, "執行命令時發生錯誤");
    process.exit(1);
  }
}
