import { describe, expect, it } from "vitest";
import { createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit then blocks until the window resets", () => {
    let t = 0;
    const check = createRateLimiter(2, 1000, () => t);
    expect(check("a").ok).toBe(true);
    expect(check("a").ok).toBe(true);
    const blocked = check("a");
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBe(1);
    t = 1001;
    expect(check("a").ok).toBe(true);
  });

  it("tracks keys independently", () => {
    const check = createRateLimiter(1, 1000, () => 0);
    expect(check("a").ok).toBe(true);
    expect(check("b").ok).toBe(true);
    expect(check("a").ok).toBe(false);
  });
});
