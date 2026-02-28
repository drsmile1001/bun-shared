import { write } from "bun";

import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

import type { CAC } from "cac";
import kleur from "kleur";

import type { Logger } from "@drsmile1001/logger";

export function registerProjectList(cli: CAC, _logger: Logger): void {
  cli
    .command("list-project", "列出所有檔案")
    .option("--ext <ext>", "指定要列出的副檔名，逗號分隔")
    .option("--exclude <dirs>", "排除的目錄，逗號分隔", {
      default: "node_modules,dist,.git,scripts",
    })
    .option("--flat", "是否扁平輸出")
    .option("--output <path>", "輸出檔案", {
      default: "dist/project-files.txt",
    })
    .action(async (options) => {
      const ext = options.ext?.split(",") ?? [];
      const exclude = options.exclude.split(",");
      await listFiles({
        rootDir: process.cwd(),
        extensions: ext,
        excludeDirs: exclude,
        flat: options.flat ?? false,
        outputPath: options.output,
      });
    });
}

async function listFiles(options: {
  rootDir: string;
  extensions: string[];
  excludeDirs: string[];
  flat?: boolean;
  outputPath?: string;
}) {
  const {
    rootDir,
    extensions,
    excludeDirs,
    flat = false,
    outputPath = "dist/ts-files.txt",
  } = options;

  type TreeNode = {
    name: string;
    children?: TreeNode[];
    fullPath: string;
    isFile: boolean;
  };

  async function walk(dir: string): Promise<TreeNode[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const nodes: TreeNode[] = [];

    for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
      if (excludeDirs.includes(entry.name)) continue;

      const fullPath = join(dir, entry.name);
      const relPath = relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        const children = await walk(fullPath);
        nodes.push({
          name: entry.name,
          children,
          fullPath: relPath,
          isFile: false,
        });
      } else if (
        !extensions.length ||
        extensions.some((ext) => entry.name.endsWith(`.${ext}`))
      ) {
        nodes.push({ name: entry.name, fullPath: relPath, isFile: true });
      }
    }

    return nodes;
  }

  function renderTree(nodes: TreeNode[], prefix = ""): string[] {
    const lines: string[] = [];

    nodes.forEach((node, idx) => {
      const last = idx === nodes.length - 1;
      const branch = last ? "└-" : "|-";
      const icon = node.isFile ? "[F]" : "[D]";
      lines.push(`${prefix}${branch}${icon} ${node.name}`);
      if (node.children) {
        const nextPrefix = prefix + (last ? "  " : "| ");
        lines.push(...renderTree(node.children, nextPrefix));
      }
    });

    return lines;
  }

  function printTree(nodes: TreeNode[], prefix = ""): void {
    nodes.forEach((node, idx) => {
      const last = idx === nodes.length - 1;
      const branch = last ? "└-" : "|-";
      const icon = node.isFile ? "[F]" : "[D]";
      console.log(`${prefix}${branch}${icon} ${kleur.cyan(node.name)}`);
      if (node.children) {
        const nextPrefix = prefix + (last ? "  " : "| ");
        printTree(node.children, nextPrefix);
      }
    });
  }

  function flattenTree(nodes: TreeNode[]): string[] {
    const list: string[] = [];
    for (const node of nodes) {
      if (node.isFile) list.push(node.fullPath);
      if (node.children) list.push(...flattenTree(node.children));
    }
    return list;
  }

  const tree = await walk(rootDir);
  const allFiles = flattenTree(tree);
  console.log(kleur.green("File list:\n"));
  if (flat) {
    for (const file of allFiles) {
      console.log(" -", kleur.cyan(file));
    }
    await write(outputPath, allFiles.join("\n"));
  } else {
    console.log(kleur.green("Tree:"));
    printTree(tree);
    const treeLines = renderTree(tree);
    const fileLines = ["Tree:", ...treeLines];
    await write(outputPath, fileLines.join("\n"));
  }
  console.log(kleur.green(`\nFound ${allFiles.length} files`));
  console.log(kleur.green(`Saved output to ${kleur.cyan(outputPath)}`));
}
