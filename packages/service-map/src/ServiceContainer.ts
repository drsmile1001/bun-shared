import type { Result } from "@drsmile1001/utils/Result";
import type { MaybePromise } from "@drsmile1001/utils/TypeHelper";

import type { ServiceMap } from "./ServiceMap";

export interface ServiceResolver<T extends ServiceMap> {
  resolve<K extends keyof T>(key: K): T[K];
  toMap(): T;
}

export type Factory<
  T extends ServiceMap,
  Deps extends readonly (keyof T)[],
  R,
> = (deps: { [K in Deps[number]]: T[K] }) => MaybePromise<R>;

export interface ServiceContainer<
  TDeps extends ServiceMap,
  TRegs extends ServiceMap = TDeps,
> extends ServiceResolver<TDeps> {
  register<K extends string & keyof TRegs>(
    key: K,
    instance: TRegs[K]
  ): ServiceContainer<TDeps & Record<K, TRegs[K]>, Omit<TRegs, K>>;

  register<
    K extends string & keyof TRegs,
    Deps extends readonly (keyof TDeps)[],
    R extends TRegs[K],
  >(
    key: K,
    deps: Deps,
    factory: Factory<TDeps, Deps, R>
  ): ServiceContainer<TDeps & Record<K, R>, Omit<TRegs, K>>;

  build(): Promise<Result<void, BuildError>>;

  [Symbol.asyncDispose](): Promise<void>;

  dispose(): Promise<void>;
}

export type BuildError =
  | { type: "DEPENDENCY_CHAIN_ERROR"; path: string[] }
  | { type: "UNRESOLVABLE"; key: string; reason?: unknown };
