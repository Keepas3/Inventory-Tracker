import { describe, expect, it } from "vitest";
import { createSessionToken, passwordMatches, safeNext, verifySessionToken } from "./session";

const secret = "a".repeat(32);

describe("session tokens", () => {
  it("accepts a fresh token and rejects it after expiry", () => {
    const t = createSessionToken(secret, 1000, 500);
    expect(verifySessionToken(secret, t, 1200)).toBe(true);
    expect(verifySessionToken(secret, t, 1500)).toBe(false);
  });
  it("rejects tampering, wrong secret, and malformed tokens", () => {
    const t = createSessionToken(secret, 1000, 500);
    const [, mac] = t.split(".");
    expect(verifySessionToken(secret, `99999999999.${mac}`, 1200)).toBe(false); // extended expiry, same mac
    expect(verifySessionToken("b".repeat(32), t, 1200)).toBe(false);
    for (const bad of [undefined, "", "abc", "1.2.3", "x.y", `${t}.extra`]) expect(verifySessionToken(secret, bad, 1200)).toBe(false);
  });
});

describe("passwordMatches", () => {
  it("compares correctly regardless of length", () => {
    expect(passwordMatches("hunter2", "hunter2")).toBe(true);
    expect(passwordMatches("hunter2", "hunter3")).toBe(false);
    expect(passwordMatches("", "hunter2")).toBe(false);
    expect(passwordMatches("a-much-longer-guess-than-the-password", "pw")).toBe(false);
  });
});

describe("safeNext", () => {
  it("keeps same-site paths and blocks open redirects", () => {
    expect(safeNext("/insights?x=1")).toBe("/insights?x=1");
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "evil", "", null, undefined]) expect(safeNext(bad)).toBe("/");
  });
});
