import { describe, expect, it } from "vitest";
import { normalizeFooterPreset, resolveAgenticUiSettings } from "../ui-settings.js";

function resolver(files: Record<string, string>, env: NodeJS.ProcessEnv = {}) {
  return resolveAgenticUiSettings({
    cwd: "/repo",
    homeDir: "/home/tester",
    env,
    exists: (path) => Object.prototype.hasOwnProperty.call(files, path),
    readFile: (path) => files[path],
  });
}

describe("normalizeFooterPreset", () => {
  it("accepts the three supported presets case-insensitively", () => {
    expect(normalizeFooterPreset("default")).toBe("default");
    expect(normalizeFooterPreset("COMPACT")).toBe("compact");
    expect(normalizeFooterPreset(" Minimal ")).toBe("minimal");
  });

  it("rejects invalid preset names", () => {
    expect(normalizeFooterPreset("full")).toBeNull();
    expect(normalizeFooterPreset(123)).toBeNull();
    expect(normalizeFooterPreset(undefined)).toBeNull();
  });
});

describe("resolveAgenticUiSettings", () => {
  it("falls back to default when no settings exist", () => {
    expect(resolver({}).footerPreset).toBe("default");
  });

  it("uses PI_AGENTIC_FOOTER_PRESET when valid", () => {
    expect(resolver({}, { PI_AGENTIC_FOOTER_PRESET: "compact" }).footerPreset).toBe("compact");
  });

  it("ignores invalid env preset and falls back to config/default", () => {
    const files = {
      "/home/tester/.pi/agent/settings.json": JSON.stringify({ agenticHarness: { footerPreset: "minimal" } }),
    };

    expect(resolver(files, { PI_AGENTIC_FOOTER_PRESET: "giant" }).footerPreset).toBe("minimal");
  });

  it("reads global agenticHarness footerPreset", () => {
    const files = {
      "/home/tester/.pi/agent/settings.json": JSON.stringify({ agenticHarness: { footerPreset: "compact" } }),
    };

    expect(resolver(files).footerPreset).toBe("compact");
  });

  it("lets project settings override global settings", () => {
    const files = {
      "/home/tester/.pi/agent/settings.json": JSON.stringify({ agenticHarness: { footerPreset: "compact" } }),
      "/repo/.pi/settings.json": JSON.stringify({ agenticHarness: { footerPreset: "minimal" } }),
    };

    expect(resolver(files).footerPreset).toBe("minimal");
  });

  it("supports powerlineUi preset alias and ignores malformed JSON", () => {
    const files = {
      "/home/tester/.pi/agent/settings.json": "{not json",
      "/repo/.pi/settings.json": JSON.stringify({ powerlineUi: { preset: "compact" } }),
    };

    expect(resolver(files).footerPreset).toBe("compact");
  });
});
