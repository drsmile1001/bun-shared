import { dispose } from "~shared/utils/Disposeable";

type ServiceMap = Record<string, unknown>;

export class ServiceMapBuilder<TRegistered extends ServiceMap = {}> {
  private readonly registedMap: Record<string, unknown> = {};
  private readonly registeredKeys: string[] = [];

  private constructor() {}

  static create(): ServiceMapBuilder {
    return new ServiceMapBuilder();
  }

  register<TService, TName extends string>(
    key: Exclude<TName, keyof TRegistered>,
    value: (deps: TRegistered) => TService
  ): ServiceMapBuilder<TRegistered & { [K in TName]: TService }>;
  register<TService, TName extends string>(
    key: Exclude<TName, keyof TRegistered>,
    value: TService
  ): ServiceMapBuilder<TRegistered & { [K in TName]: TService }>;
  register(key: string, value: unknown) {
    this.registeredKeys.push(key);
    if (typeof value === "function") {
      try {
        this.registedMap[key] = value(this.registedMap as TRegistered);
      } catch (err) {
        throw new Error(`Error executing factory for "${key}": ${String(err)}`);
      }
    } else {
      this.registedMap[key] = value;
    }
    return this as any;
  }

  async build(): Promise<
    {
      [K in keyof TRegistered]: TRegistered[K] extends Promise<infer R>
        ? R
        : TRegistered[K];
    } & {
      [Symbol.asyncDispose](): Promise<void>;
      dispose(): Promise<void>;
    }
  > {
    const finalMap: Record<string, unknown> = {};

    for (const [key, service] of Object.entries(this.registedMap)) {
      finalMap[key] = await service;
    }

    const reverseOrder = [...this.registeredKeys].reverse();
    async function cleanup() {
      for (const key of reverseOrder) {
        const instance = finalMap[key];
        await dispose(instance as any);
      }
    }

    return {
      ...finalMap,
      [Symbol.asyncDispose]: cleanup,
      dispose: cleanup,
    } as any;
  }
}
