import { describe, expect, it } from "vitest";
import {
  MAX_BYTES,
  asMessage,
  languageForExtension,
  maybeTruncate,
} from "./lang-map";

describe("languageForExtension", () => {
  it("maps known extensions case-insensitively", () => {
    expect(languageForExtension("ts")).toBe("typescript");
    expect(languageForExtension("TS")).toBe("typescript");
    expect(languageForExtension("Tsx")).toBe("typescript");
    expect(languageForExtension("rs")).toBe("rust");
    expect(languageForExtension("md")).toBe("markdown");
  });

  it("falls back to plaintext for unknown / empty inputs", () => {
    expect(languageForExtension("")).toBe("plaintext");
    expect(languageForExtension(undefined)).toBe("plaintext");
    expect(languageForExtension(null)).toBe("plaintext");
    expect(languageForExtension("xyz")).toBe("plaintext");
  });
});

describe("maybeTruncate", () => {
  it("passes short content through unchanged", () => {
    const { final, truncated } = maybeTruncate("hello");
    expect(truncated).toBe(false);
    expect(final).toBe("hello");
  });

  it("truncates content above MAX_BYTES and appends a marker", () => {
    const big = "x".repeat(MAX_BYTES + 100);
    const { final, truncated } = maybeTruncate(big);
    expect(truncated).toBe(true);
    expect(final.startsWith("x".repeat(MAX_BYTES))).toBe(true);
    expect(final).toContain("truncated at");
  });

  it("does not truncate exactly at the boundary", () => {
    const exact = "x".repeat(MAX_BYTES);
    const { truncated } = maybeTruncate(exact);
    expect(truncated).toBe(false);
  });
});

describe("asMessage", () => {
  it("returns the string unchanged", () => {
    expect(asMessage("boom")).toBe("boom");
  });

  it("returns Error.message when given an Error", () => {
    expect(asMessage(new Error("nope"))).toBe("nope");
  });

  it("stringifies anything else", () => {
    expect(asMessage({ x: 1 })).toBe("[object Object]");
    expect(asMessage(42)).toBe("42");
    expect(asMessage(null)).toBe("null");
  });
});
