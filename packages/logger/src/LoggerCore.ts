import {
  type ErrorRecord,
  type LogLevel,
  type LogRecord,
  type LogTransport,
  type Logger,
  type LoggerContext,
  type TemplateLogger,
  priority,
} from "./Logger";

export interface LoggerCoreOptions {
  level?: LogLevel;
  path?: string[];
  context?: LoggerContext;
  allowNamespaces?: string[];
  blockNamespaces?: string[];
  allowLevel?: LogLevel;
  blockLevel?: LogLevel;
}

export class LoggerCore implements Logger {
  readonly level: LogLevel;
  private readonly path: string[];
  private context: LoggerContext;
  private transports: LogTransport[] = [];
  private readonly allowNamespaces: string[];
  private readonly blockNamespaces: string[];
  private readonly allowLevel: LogLevel;
  private readonly blockLevel: LogLevel;
  private readonly levelPriority: number;
  private readonly allowLevelPriority: number;
  private readonly blockLevelPriority: number;
  private readonly hasNamespaceRules: boolean;

  constructor(options: LoggerCoreOptions = {}) {
    this.level = options.level ?? "info";
    this.path = options.path ?? [];
    this.context = options.context ?? {};
    this.allowNamespaces = options.allowNamespaces ?? [];
    this.blockNamespaces = options.blockNamespaces ?? [];
    this.allowLevel = options.allowLevel ?? "info";
    this.blockLevel = options.blockLevel ?? "warn";
    this.levelPriority = priority(this.level);
    this.allowLevelPriority = priority(this.allowLevel);
    this.blockLevelPriority = priority(this.blockLevel);
    this.hasNamespaceRules =
      this.allowNamespaces.length > 0 || this.blockNamespaces.length > 0;
  }

  extend(
    namespace: string,
    context: LoggerContext = {},
    overrideLevel?: LogLevel
  ): Logger {
    const extended = new LoggerCore({
      level: overrideLevel ?? this.level,
      path: [...this.path, namespace],
      context: { ...this.context, ...context },
      allowNamespaces: this.allowNamespaces,
      blockNamespaces: this.blockNamespaces,
      allowLevel: this.allowLevel,
      blockLevel: this.blockLevel,
    });
    for (const transport of this.transports) {
      extended.attachTransport(transport);
    }
    return extended;
  }

  append(context: LoggerContext): Logger {
    this.context = { ...this.context, ...context };
    return this;
  }

  debug(msg: string): void;
  debug(context: LoggerContext, msg: string): void;
  debug(context?: LoggerContext): TemplateLogger;
  debug(arg1?: any, arg2?: any): any {
    return this.write("debug", arg1, arg2);
  }

  info(msg: string): void;
  info(context: LoggerContext, msg: string): void;
  info(context?: LoggerContext): TemplateLogger;
  info(arg1?: any, arg2?: any): any {
    return this.write("info", arg1, arg2);
  }

  warn(msg: string): void;
  warn(context: LoggerContext, msg: string): void;
  warn(context?: LoggerContext): TemplateLogger;
  warn(arg1?: any, arg2?: any): any {
    return this.write("warn", arg1, arg2);
  }

  error(msg: string): void;
  error(context: LoggerContext, msg: string): void;
  error(context?: LoggerContext): TemplateLogger;
  error(arg1?: any, arg2?: any): any {
    let ctx = !arg1 || typeof arg1 === "string" ? {} : arg1;
    if (!ctx?.error) {
      ctx.error = new LoggerCoreStackTracer();
    }
    if (!(ctx.error instanceof Error)) {
      ctx.error = new LoggerCoreStackTracer(ctx.error);
    }
    const msg = typeof arg1 === "string" ? arg1 : arg2;
    return this.write("error", ctx, msg);
  }

  log(...args: any[]): void {
    this.dispatchToTransports(
      "devlog",
      { emoji: "💉" },
      args
        .map((arg) => {
          try {
            return typeof arg === "string" ? arg : JSON.stringify(arg);
          } catch {
            return String(arg);
          }
        })
        .join(" ")
    );
  }

  attachTransport(t: LogTransport): void {
    this.transports.push(t);
  }

  listTransports(): LogTransport[] {
    return [...this.transports];
  }

  async flushTransports(): Promise<void> {
    await Promise.all(this.transports.map((t) => t[Symbol.asyncDispose]()));
    this.transports = [];
  }

  private write(level: LogLevel, msg: string): void;
  private write(level: LogLevel, context: LoggerContext, msg: string): void;
  private write(level: LogLevel, context?: LoggerContext): TemplateLogger;
  private write(level: LogLevel, arg1?: any, arg2?: any): any {
    if (!this.shouldDispatch(level)) return () => {};

    if (typeof arg1 === "string") {
      this.dispatchToTransports(level, {}, arg1);
      return;
    }

    if (typeof arg2 === "string") {
      this.dispatchToTransports(level, arg1 ?? {}, arg2);
      return;
    }

    const logger: TemplateLogger = (strings, ...values) => {
      if (!this.shouldDispatch(level)) return;
      this.logTemplate(level, arg1 ?? {}, strings, ...values);
    };

    return logger;
  }

  private logTemplate(
    level: LogLevel,
    context: LoggerContext,
    strings: TemplateStringsArray,
    ...values: any[]
  ): void {
    const message = strings.reduce(
      (acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ""),
      ""
    );
    const ctx: LoggerContext = { ...context };
    values.forEach((v, i) => {
      ctx[`__${i}`] = v;
    });
    this.dispatchToTransports(level, ctx, message);
  }

  private shouldDispatch(level: LogLevel): boolean {
    const levelPriority = priority(level);
    const shouldLogByLevel = levelPriority >= this.levelPriority;
    if (!this.hasNamespaceRules) return shouldLogByLevel;

    const maybeAllow =
      this.allowNamespaces.length > 0 &&
      levelPriority >= this.allowLevelPriority;
    const maybeBlock =
      this.blockNamespaces.length > 0 &&
      levelPriority <= this.blockLevelPriority;
    if (!maybeAllow && !maybeBlock) return shouldLogByLevel;

    const namespace = this.path.join(":");
    if (namespace.length === 0) return shouldLogByLevel;

    if (
      maybeAllow &&
      this.matchesAnyNamespace(namespace, this.allowNamespaces)
    ) {
      return true;
    }
    if (
      maybeBlock &&
      this.matchesAnyNamespace(namespace, this.blockNamespaces)
    ) {
      return false;
    }

    return shouldLogByLevel;
  }

  private matchesAnyNamespace(namespace: string, prefixes: string[]): boolean {
    if (prefixes.length === 0) return false;
    return prefixes.some((prefix) => namespace.startsWith(prefix));
  }

  private dispatchToTransports(
    level: LogLevel,
    ctx: LoggerContext,
    msg: string
  ) {
    const rec: LogRecord = {
      ts: new Date().valueOf(),
      level,
      path: this.path,
      event: ctx.event ?? level,
      emoji: typeof ctx.emoji === "string" ? ctx.emoji : undefined,
      msg,
      ctx: stripReserved({ ...this.context, ...ctx }),
      err: normalizeError(ctx.error),
    };
    for (const t of this.transports) t.write(rec);
  }
}

function stripReserved(ctx: LoggerContext): Record<string, unknown> {
  const { event, emoji, error, ...rest } = ctx;
  return rest;
}

function normalizeError(e: unknown): ErrorRecord | undefined {
  if (!e) return;
  if (e instanceof LoggerCoreStackTracer)
    return {
      name: "NonError",
      message: "non-error thrown",
      value: e,
      stack: e.getNormalizedStack(),
    };
  if (e instanceof Error)
    return { name: e.name, message: e.message, stack: e.stack };
}

class LoggerCoreStackTracer extends Error {
  value: any;
  constructor(value?: any) {
    super();
    this.value = value;
  }

  getNormalizedStack(): string {
    return (this.stack ?? "").split("\n").slice(3).join("\n");
  }
}
