import { describe, expect, test } from "bun:test";

import { SchedulerServiceFake } from "../src/SchedulerServiceFake";

describe("SchedulerServiceFake", () => {
  test("runs all scheduled handlers", async () => {
    const scheduler = new SchedulerServiceFake();
    const output: string[] = [];

    scheduler.schedule("job-a", "* * * * *", async () => {
      output.push("a");
    });
    scheduler.schedule("job-b", "* * * * *", async () => {
      output.push("b");
    });

    await scheduler.run();

    expect(output).toEqual(["a", "b"]);
    expect(scheduler.listJobs().map((job) => job.id)).toEqual([
      "job-a",
      "job-b",
    ]);
  });

  test("runs a specific handler by id", async () => {
    const scheduler = new SchedulerServiceFake();
    const output: string[] = [];

    scheduler.schedule("job-a", "* * * * *", async () => {
      output.push("a");
    });
    scheduler.schedule("job-b", "* * * * *", async () => {
      output.push("b");
    });

    await scheduler.run("job-b");

    expect(output).toEqual(["b"]);
  });
});
