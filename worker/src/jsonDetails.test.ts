import { describe, expect, it } from "vitest";
import { mergeDetails, parseDetails } from "./jsonDetails";

describe("details json merge", () => {
  it("merges without dropping unrelated keys", () => {
    expect(JSON.parse(mergeDetails({ nationality: "ES", religion: "none" }, { smoking: "no" }))).toEqual({
      nationality: "ES",
      religion: "none",
      smoking: "no",
    });
  });

  it("does not crash on malformed details", () => {
    expect(parseDetails("{")).toEqual({});
    expect(parseDetails("[]")).toEqual({});
    expect(parseDetails(null)).toEqual({});
    expect(JSON.parse(mergeDetails("{", { smoking: "no" }))).toEqual({ smoking: "no" });
  });
});
