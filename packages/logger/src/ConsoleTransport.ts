import kleur from "kleur";

import {
  type LogLevel,
  type LogRecord,
  type LogTransport,
  priority,
} from "./Logger";

type ColorPurpose = LogLevel | "stack";

export interface ConsoleTransportOptions {
  levelFloor?: LogLevel;
  emojiMap?: Record<string, string>;
  withEmoji?: boolean;
  withColor?: boolean;
  withContext?: "inline" | "object" | false;
}

export class ConsoleTransport implements LogTransport {
  private readonly levelFloor: LogLevel;
  private readonly emojiMap: Record<string, string>;
  private readonly withEmoji: boolean;
  private readonly withColor: boolean;
  private readonly withContext: "inline" | "object" | false;

  static readonly tags: Record<LogLevel, string> = {
    debug: "[DEBUG]",
    info: "[INFO] ",
    warn: "[WARN] ",
    error: "[ERROR]",
    devlog: "==DEV==",
  };

  static readonly consoleMethods: Record<LogLevel, (...data: any[]) => void> = {
    debug: (...data: any[]) => console.debug(...data),
    info: (...data: any[]) => console.info(...data),
    warn: (...data: any[]) => console.warn(...data),
    error: (...data: any[]) => console.error(...data),
    devlog: (...data: any[]) => console.log(...data),
  };

  static readonly colors: Record<ColorPurpose, (s: string) => string> = {
    debug: kleur.gray,
    info: kleur.cyan,
    warn: kleur.yellow,
    error: kleur.red,
    devlog: kleur.bgRed().yellow,
    stack: kleur.dim,
  };

  constructor(options: ConsoleTransportOptions = {}) {
    this.levelFloor = options.levelFloor ?? "info";
    this.emojiMap = options.emojiMap ?? {};
    this.withEmoji = options.withEmoji ?? true;
    this.withColor = options.withColor ?? true;
    this.withContext = options.withContext ?? "inline";
  }

  write(rec: LogRecord): void {
    if (priority(rec.level) < priority(this.levelFloor)) return;

    const prefix = this.buildPrefix(rec);
    const line = `${prefix} ${rec.msg}`;
    const consoleMethod = ConsoleTransport.consoleMethods[rec.level];

    if (!this.withContext) {
      consoleMethod(line);
    } else if (this.withContext === "inline") {
      const text =
        rec.ctx && Object.keys(rec.ctx).length
          ? `${line} ${JSON.stringify(rec.ctx)}`
          : line;
      consoleMethod(text);
    } else {
      consoleMethod(line, rec.ctx ?? {});
    }

    if (rec.err) {
      if (rec.err.value !== undefined) {
        console.error(
          this.renderColor("stack", `Error: ${JSON.stringify(rec.err.value)}`)
        );
      }
      if (rec.err.stack) {
        console.error(this.renderColor("stack", rec.err.stack));
      } else {
        console.error(
          this.renderColor("stack", `${rec.err.name}: ${rec.err.message}`)
        );
      }
    }
  }

  async [Symbol.asyncDispose](): Promise<void> {}

  private buildPrefix(rec: LogRecord): string {
    const tag = this.renderColor(rec.level, ConsoleTransport.tags[rec.level]);
    const emoji = this.getEmoji(rec.level, rec.event, rec.emoji);
    const pathText = rec.path.join(":");
    const eventText = rec.event ?? rec.level;
    return `${tag} ${emoji} ${pathText}:${eventText}:`;
  }

  private getEmoji(level: LogLevel, event?: string, emoji?: string): string {
    if (!this.withEmoji) return "";
    if (emoji) return emoji;
    if (event && this.emojiMap[event]) return this.emojiMap[event]!;
    if (this.emojiMap[level]) return this.emojiMap[level]!;
    return "";
  }

  private renderColor(purpose: ColorPurpose, text: string): string {
    return this.withColor ? ConsoleTransport.colors[purpose](text) : text;
  }
}
