import { describe, expect, test } from "bun:test";

import { EventBusFake } from "../src/EventBusFake";

type TestEventMap = {
  "demo.created": { id: string };
};

describe("EventBusFake", () => {
  test("emit + subscribe should dispatch payload", async () => {
    const bus = new EventBusFake<TestEventMap>();
    const received: Array<{ id: string }> = [];

    await bus.subscribe("demo.created", async (payload) => {
      received.push(payload);
    });

    await bus.emit("demo.created", { id: "1" });

    expect(received).toEqual([{ id: "1" }]);
    expect(bus.getEmitted("demo.created")).toEqual([{ id: "1" }]);
  });
});
