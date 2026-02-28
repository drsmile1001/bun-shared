import type { MaybePromise } from "@drsmile1001/utils/TypeHelper";

export interface SchedulerService {
  schedule(
    id: string,
    cronExpression: string,
    handler: () => MaybePromise<void>
  ): void;
}
