import type { Logger } from "~shared/Logger";
import { type Result, err, ok } from "~shared/utils/Result";
import type { MaybePromise } from "~shared/utils/TypeHelper";

import type {
  BuildError,
  Factory,
  ServiceContainer,
  ServiceMap,
} from "./ServiceContainer";

type DisposableEntry = {
  [Symbol.asyncDispose](): MaybePromise<void>;
  key: string;
};

export class ServiceContainerDefault<TService extends ServiceMap>
  implements ServiceContainer<TService>
{
  private logger: Logger;
  static create<TService extends ServiceMap>(
    baseLogger: Logger
  ): ServiceContainer<TService> {
    return new ServiceContainerDefault<TService>(baseLogger);
  }
  constructor(baseLogger: Logger) {
    this.logger = baseLogger.extend("ServiceContainer");
  }

  private services = new Map<keyof TService, unknown>();
  private factories = new Map<
    keyof TService,
    {
      deps: readonly (keyof TService)[];
      factory: Factory<TService, readonly (keyof TService)[], unknown>;
    }
  >();
  private readonly disposables: DisposableEntry[] = [];
  private built = false;

  private setService<K extends keyof TService>(
    key: K,
    value: TService[K]
  ): void {
    if (this.built) {
      this.logger.error()`❌ 嘗試在建構後設定服務 '${String(key)}'`;
      throw new Error("❌ Cannot set service after build");
    }
    if (this.services.has(key)) {
      this.logger.error()`❌ 嘗試重複註冊服務 '${String(key)}'`;
      throw new Error(`❌ Service '${String(key)}' already registered`);
    }
    this.services.set(key, value);
    let disposeMethod: (() => MaybePromise<void>) | undefined = undefined;
    if (hasSymbolAsyncDispose(value)) {
      disposeMethod = value[Symbol.asyncDispose];
    } else if (hasSymbolDispose(value)) {
      disposeMethod = value[Symbol.dispose];
    } else if (hasDisposeMethod(value)) {
      disposeMethod = value.dispose;
    }
    if (disposeMethod) {
      this.logger.info()`註冊的服務 '${String(key)}' 支援釋放資源`;
      this.disposables.push({
        [Symbol.asyncDispose]: () => disposeMethod.call(value),
        key: String(key),
      });
    }
  }

  // === 註冊實例 ===
  register<K extends keyof TService>(
    key: K,
    instance: TService[K]
  ): ServiceContainer<TService & Record<K, TService[K]>, Omit<TService, K>>;

  // === 註冊 factory ===
  register<
    K extends keyof TService,
    Deps extends readonly (keyof TService)[],
    R extends TService[K],
  >(
    key: K,
    deps: Deps,
    factory: Factory<TService, Deps, R>
  ): ServiceContainer<TService & Record<K, R>, Omit<TService, K>>;

  register<
    K extends keyof TService,
    Deps extends readonly (keyof TService)[],
    R extends TService[K],
  >(
    key: K,
    depsOrInstance: Deps | TService[K],
    factory?: Factory<TService, Deps, R>
  ): ServiceContainer<TService & Record<K, R>, Omit<TService, K>> {
    if (this.built) {
      this.logger.error()`❌ 嘗試在建構後設定服務 '${String(key)}'`;
      throw new Error("❌ Cannot register after build");
    }

    if (factory) {
      if (this.factories.has(key)) {
        this.logger.error()`❌ 嘗試重複註冊工廠 '${String(key)}'`;
        throw new Error(`❌ Factory for '${String(key)}' already registered`);
      }
      const deps = depsOrInstance as Deps;
      this.factories.set(key, {
        deps,
        factory,
      });
      this.logger.info()`註冊工廠 '${String(key)}'，依賴: ${deps.map(String).join(", ")}`;
    } else {
      this.setService(key, depsOrInstance as TService[K]);
      this.logger.info()`註冊實例 '${String(key)}'`;
    }
    return this as any;
  }

  // === 解析已完成建構的服務 ===
  resolve<K extends keyof TService>(key: K): TService[K] {
    if (!this.built) {
      this.logger.error()`❌ 嘗試在未建構的容器中解析服務 '${String(key)}'`;
      throw new Error(`❌ Container has not been built`);
    }
    if (!this.services.has(key)) {
      this.logger.error()`❌ 服務 '${String(key)}' 未註冊`;
      throw new Error(`❌ Service '${String(key)}' not found`);
    }
    return this.services.get(key) as TService[K];
  }

  // === 建構所有服務，處理依賴與 async ===
  async build(): Promise<Result<void, BuildError>> {
    const stack: (keyof TService)[] = [];

    const resolveRecursive = async (key: keyof TService): Promise<unknown> => {
      if (this.services.has(key)) {
        return this.services.get(key)!;
      }

      if (stack.includes(key)) {
        const cycleStart = stack.indexOf(key);
        this.logger.error()`❌ 依賴循環檢測到: ${stack.slice(cycleStart).map(String).join(" -> ")}`;
        return {
          type: "DEPENDENCY_CHAIN_ERROR",
          path: stack.slice(cycleStart).map(String),
        } satisfies BuildError;
      }

      const factoryEntry = this.factories.get(key);
      if (!factoryEntry) {
        this.logger.error()`❌ 無法解析服務 '${String(key)}'，未找到實例或工廠`;
        return {
          type: "UNRESOLVABLE",
          key: String(key),
        } satisfies BuildError;
      }

      const { deps, factory } = factoryEntry;
      stack.push(key);

      const resolvedDeps: Partial<TService> = {};
      for (const dep of deps) {
        const maybe = await resolveRecursive(dep);
        if (isBuildError(maybe)) return maybe;
        resolvedDeps[dep] = maybe as TService[typeof dep];
      }

      let result: unknown;
      try {
        this.logger.info()`正在解析服務 '${String(key)}'，依賴: ${deps.map(String).join(", ")}`;
        result = await factory(resolvedDeps as any);
        this.logger.info()`服務 '${String(key)}' 解析完成`;
      } catch (error) {
        this.logger.error({
          error,
        })`❌ 解析服務 '${String(key)}' 時發生錯誤: ${error instanceof Error ? error.message : String(error)}`;
        return {
          type: "UNRESOLVABLE",
          key: String(key),
          reason: error instanceof Error ? error.message : String(error),
        } satisfies BuildError;
      }
      this.setService(key, result as TService[typeof key]);
      stack.pop();
      return result;
    };

    for (const key of this.factories.keys()) {
      if (!this.services.has(key)) {
        const maybe = await resolveRecursive(key);
        if (isBuildError(maybe)) return err(maybe);
      }
    }

    this.built = true;
    return ok();
  }

  async [Symbol.asyncDispose](): Promise<void> {
    if (this.built) {
      const reverseDisposables = [...this.disposables].reverse();
      for (const entry of reverseDisposables) {
        try {
          await entry[Symbol.asyncDispose]();
        } catch (error) {
          console.error(`Error disposing service '${entry.key}':`, error);
        }
      }
      this.disposables.length = 0; // 清空 disposables
    }
    this.services.clear();
    this.factories.clear();
  }

  async dispose(): Promise<void> {
    await this[Symbol.asyncDispose]();
  }
}

function isBuildError(value: unknown): value is BuildError {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value["type"] === "DEPENDENCY_CHAIN_ERROR" ||
      value["type"] === "UNRESOLVABLE")
  );
}

function hasSymbolAsyncDispose(
  value: unknown
): value is { [Symbol.asyncDispose]: () => MaybePromise<void> } {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncDispose in value &&
    typeof value[Symbol.asyncDispose] === "function"
  );
}

function hasSymbolDispose(
  value: unknown
): value is { [Symbol.dispose]: () => MaybePromise<void> } {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.dispose in value &&
    typeof value[Symbol.dispose] === "function"
  );
}

function hasDisposeMethod(
  value: unknown
): value is { dispose: () => MaybePromise<void> } {
  return (
    typeof value === "object" &&
    value !== null &&
    "dispose" in value &&
    typeof value["dispose"] === "function"
  );
}
