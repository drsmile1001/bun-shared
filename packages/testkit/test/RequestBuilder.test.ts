import { describe, expect, test } from "bun:test";

import {
  httpDelete,
  httpGet,
  httpPatch,
  httpPost,
  httpPut,
} from "../src/RequestBuilder";

describe("RequestBuilder", () => {
  test("httpGet builds url query and cookies", () => {
    const req = httpGet("/users")
      .withQuery({ a: "1", b: ["x", "y"] })
      .withCookie("sid", "abc")
      .asRequest();

    const url = new URL(req.url);
    expect(req.method).toBe("GET");
    expect(url.pathname).toBe("/users");
    expect(url.searchParams.get("a")).toBe("1");
    expect(url.searchParams.getAll("b")).toEqual(["x", "y"]);
    expect(req.headers.get("cookie")).toContain("sid=abc");
  });

  test("httpPost JSON default", async () => {
    const req = httpPost("/items", { name: "a" }).asRequest();
    expect(req.method).toBe("POST");
    expect(req.headers.get("content-type")).toBe("application/json");
    expect(await req.text()).toBe(JSON.stringify({ name: "a" }));
  });

  test("httpPost FORM and MULTIPART", async () => {
    const formReq = httpPost("/submit", "FORM", {
      a: "1",
      b: "2",
    }).asRequest();
    expect(formReq.headers.get("content-type")).toBe(
      "application/x-www-form-urlencoded"
    );
    expect(await formReq.text()).toBe("a=1&b=2");

    const fd = new FormData();
    fd.append("x", "1");
    const multipartReq = httpPost("/upload", "MULTIPART", fd).asRequest();
    expect(multipartReq.headers.get("content-type")).toContain(
      "multipart/form-data"
    );
  });

  test("httpPut/httpPatch/httpDelete methods", () => {
    expect(httpPut("/a").asRequest().method).toBe("PUT");
    expect(httpPatch("/a", { x: 1 }).asRequest().method).toBe("PATCH");
    expect(httpDelete("/a").asRequest().method).toBe("DELETE");
  });
});
