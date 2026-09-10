import { describe, expect, it } from "vitest";
import { MatchResponseValue, MatchStatus } from "@prisma/client";
import { nextMatchStatus } from "./respondToMatch";

describe("nextMatchStatus", () => {
  it("waits for user B after A accepts", () => {
    expect(
      nextMatchStatus("a", "b", [
        { userId: "a", value: MatchResponseValue.ACCEPTED },
        { userId: "b", value: MatchResponseValue.PENDING },
      ])
    ).toBe(MatchStatus.WAITING_FOR_USER_B);
  });

  it("accepts only when both accept", () => {
    expect(
      nextMatchStatus("a", "b", [
        { userId: "a", value: MatchResponseValue.ACCEPTED },
        { userId: "b", value: MatchResponseValue.ACCEPTED },
      ])
    ).toBe(MatchStatus.ACCEPTED);
  });

  it("declines if either party declines", () => {
    expect(
      nextMatchStatus("a", "b", [
        { userId: "a", value: MatchResponseValue.ACCEPTED },
        { userId: "b", value: MatchResponseValue.DECLINED },
      ])
    ).toBe(MatchStatus.DECLINED);
  });
});
