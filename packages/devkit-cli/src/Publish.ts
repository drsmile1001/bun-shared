import { $, file, write } from "bun";

import type { CAC } from "cac";

import type { Logger } from "@drsmile1001/logger";

export function registerPublish(cli: CAC, baseLogger: Logger): void {
  cli
    .command("publish", "發佈專案")
    .option("--level <patch|minor|major>", "發佈等級", {
      default: "patch",
    })
    .action(async (options) => {
      const logger = baseLogger.extend("publish");
      if (!["patch", "minor", "major"].includes(options.level)) {
        logger.error("無效的發佈等級，請使用 patch、minor 或 major");
        process.exit(1);
      }
      const packageFile = file("package.json");
      const pkg: { version: string } = await packageFile.json();
      const oldVersion: string = pkg.version;

      const newVersion = bumpVersion(oldVersion, options.level);
      pkg.version = newVersion;

      await write("package.json", JSON.stringify(pkg, null, 2));
      logger.info()`version: ${oldVersion} -> ${newVersion}`;

      await $`git add package.json`;
      await $`git commit -m "release ${newVersion}"`;
      await $`git tag ${newVersion}`;
      await $`git push`;
      await $`git push --tags`;

      logger.info({
        emoji: "🚀",
      })`發佈完成 版本: ${newVersion}`;
    });
}
const versionRegex = /^(\d+)\.(\d+)\.(\d+)$/;
function bumpVersion(
  version: string,
  level: "patch" | "minor" | "major"
): string {
  const match = version.match(versionRegex);
  if (!match) throw new Error(`無法解析版本字串: ${version}`);
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const patch = Number(match[3]);

  switch (level) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}
