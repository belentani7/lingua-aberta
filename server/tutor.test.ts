import { describe, expect, it } from "vitest";
import { buildTutorSystemPrompt, getTutorProviderStatus } from "./tutor";

describe("tutor prompt", () => {
  it("personalizes the active language while preserving the bridge language", () => {
    const prompt = buildTutorSystemPrompt("Català", "William");
    expect(prompt).toContain("William");
    expect(prompt).toContain("portugués brasileño");
    expect(prompt).toContain("català de supervivència");
    expect(prompt).toContain("No pidas datos sensibles");
  });

  it("reports safe provider fallbacks when local adapters are not configured", () => {
    const status = getTutorProviderStatus();
    expect(status.text).toBe("managed-fallback");
    expect(status.textToSpeech).toBe("browser-fallback");
  });
});
