import { afterEach, describe, expect, it, vi } from "vitest";
import { buildTutorSystemPrompt, getTutorProviderStatus } from "./tutor";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("tutor prompt", () => {
  it("personalizes the active language while preserving the bridge language", () => {
    const prompt = buildTutorSystemPrompt("Català", "William");
    expect(prompt).toContain("William");
    expect(prompt).toContain("portugués brasileño");
    expect(prompt).toContain("català de supervivència");
    expect(prompt).toContain("No pidas datos sensibles");
  });

  it("reports safe provider fallbacks when local adapters are not configured", () => {
    vi.stubEnv("OLLAMA_BASE_URL", "");
    vi.stubEnv("WHISPER_BASE_URL", "");
    vi.stubEnv("TTS_BASE_URL", "");
    const status = getTutorProviderStatus();
    expect(status.text).toBe("managed-fallback");
    expect(status.textToSpeech).toBe("browser-fallback");
  });
});
