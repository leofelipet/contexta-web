import { describe, expect, it } from "vitest";
import { messageDisplay } from "./message-display";

describe("messageDisplay", () => {
  it("displays regular message text and a type fallback", () => {
    expect(messageDisplay({ type: "text", text: " Olá " })).toEqual({ isAudio: false, text: "Olá", audioLabel: undefined });
    expect(messageDisplay({ type: "image" }).text).toBe("[image]");
  });

  it("prioritizes and identifies an audio transcript", () => {
    expect(messageDisplay({ type: "audio", text: "fallback", transcription: { status: "completed", text: " Transcrição " } })).toEqual({
      isAudio: true,
      text: "Transcrição",
      audioLabel: "Transcrição do áudio",
    });
  });

  it.each([
    ["pending", "Transcrição pendente"],
    ["processing", "Transcrição em processamento"],
    ["retry", "Nova tentativa de transcrição"],
    ["failed", "Não foi possível transcrever o áudio"],
  ])("translates the %s transcription state", (status, audioLabel) => {
    expect(messageDisplay({ type: "audio", transcription: { status } })).toEqual({ isAudio: true, text: "[Áudio]", audioLabel });
  });

  it("uses the audio fallback without transcription data", () => {
    expect(messageDisplay({ type: "audio" })).toEqual({ isAudio: true, text: "[Áudio]", audioLabel: "Áudio" });
  });
});
