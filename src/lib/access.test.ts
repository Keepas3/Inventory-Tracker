import { describe, expect, it } from "vitest";
import { canWrite, getAccessPolicy } from "./access";

const secret = "s".repeat(32);

describe("getAccessPolicy", () => {
  it("demo mode wins regardless of auth config", () => {
    expect(getAccessPolicy({ APP_MODE: "demo", NODE_ENV: "production" })).toEqual({ kind: "demo" });
  });
  it("requires login when password and a long-enough secret are set", () => {
    expect(getAccessPolicy({ AUTH_PASSWORD: "pw", SESSION_SECRET: secret, NODE_ENV: "production" })).toEqual({ kind: "login" });
    expect(getAccessPolicy({ APP_MODE: "private", AUTH_PASSWORD: "pw", SESSION_SECRET: secret })).toEqual({ kind: "login" });
  });
  it("fails closed in production when misconfigured", () => {
    expect(getAccessPolicy({ NODE_ENV: "production" }).kind).toBe("locked");
    expect(getAccessPolicy({ AUTH_PASSWORD: "pw", SESSION_SECRET: "short", NODE_ENV: "production" }).kind).toBe("locked");
    expect(getAccessPolicy({ AUTH_PASSWORD: "pw", NODE_ENV: "production" }).kind).toBe("locked");
  });
  it("rejects a typo'd mode rather than silently choosing one", () => {
    expect(getAccessPolicy({ APP_MODE: "Demo", NODE_ENV: "production" }).kind).toBe("locked");
  });
  it("is open only in unconfigured development", () => {
    expect(getAccessPolicy({ NODE_ENV: "development" })).toEqual({ kind: "open" });
    expect(getAccessPolicy({})).toEqual({ kind: "open" });
  });
});

describe("canWrite", () => {
  it("only allows writes when open, or logged in", () => {
    expect(canWrite({ kind: "open" }, false)).toBe(true);
    expect(canWrite({ kind: "login" }, true)).toBe(true);
    expect(canWrite({ kind: "login" }, false)).toBe(false);
    expect(canWrite({ kind: "demo" }, true)).toBe(false);
    expect(canWrite({ kind: "locked", reason: "" }, true)).toBe(false);
  });
});
