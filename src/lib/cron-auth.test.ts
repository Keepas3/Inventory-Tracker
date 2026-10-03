import { describe, expect, it } from "vitest";
import { isAuthorizedCron } from "./cron-auth";

const req = (auth?: string) => new Request("http://x/api/cron", { headers: auth ? { authorization: auth } : {} });

describe("isAuthorizedCron", () => {
  it("accepts only the exact bearer secret", () => {
    expect(isAuthorizedCron(req("Bearer s3cret"), "s3cret")).toBe(true);
    expect(isAuthorizedCron(req("Bearer s3cret2"), "s3cret")).toBe(false); // longer than the secret
    expect(isAuthorizedCron(req("Bearer s3cre"), "s3cret")).toBe(false); // shorter than the secret
    expect(isAuthorizedCron(req("Bearer wrong!"), "s3cret")).toBe(false);
    expect(isAuthorizedCron(req("s3cret"), "s3cret")).toBe(false);
    expect(isAuthorizedCron(req(), "s3cret")).toBe(false);
  });
  it("fails closed when no secret is configured", () => {
    expect(isAuthorizedCron(req("Bearer "), "")).toBe(false);
    expect(isAuthorizedCron(req("Bearer undefined"), undefined)).toBe(false);
  });
});
