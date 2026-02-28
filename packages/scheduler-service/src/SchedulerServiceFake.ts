import type { MaybePromise } from "@drsmile1001/utils/TypeHelper";

import type { SchedulerService } from "./SchedulerService";

type ScheduledJob = {
  id: string;
  cronExpression: string;
  handler: () => MaybePromise<void>;
};

export class SchedulerServiceFake implements SchedulerService {
  private readonly jobs: Map<string, ScheduledJob> = new Map();

  schedule(
    id: string,
    cronExpression: string,
    handler: () => MaybePromise<void>
  ): void {
    this.jobs.set(id, {
      id,
      cronExpression,
      handler,
    });
  }

  async run(id?: string): Promise<void> {
    if (id) {
      const job = this.jobs.get(id);
      if (!job) throw new Error(`找不到排程任務：${id}`);
      await job.handler();
    } else {
      for (const job of this.jobs.values()) {
        await job.handler();
      }
    }
  }

  listJobs(): ScheduledJob[] {
    return [...this.jobs.values()];
  }
}
