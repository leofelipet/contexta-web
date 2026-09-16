import type { Message } from "./types";

const transcriptionStatus: Record<string, string> = {
  pending: "Transcrição pendente",
  processing: "Transcrição em processamento",
  retry: "Nova tentativa de transcrição",
  failed: "Não foi possível transcrever o áudio",
};

export function messageDisplay(message: Pick<Message, "text" | "transcription" | "type">) {
  const isAudio = message.type?.toLowerCase() === "audio";
  const transcript = message.transcription?.text?.trim();
  const text = transcript || message.text?.trim();

  return {
    isAudio,
    text: text || (isAudio ? "[Áudio]" : `[${message.type || "mensagem"}]`),
    audioLabel: isAudio
      ? transcript
        ? "Transcrição do áudio"
        : transcriptionStatus[message.transcription?.status.toLowerCase() || ""] || "Áudio"
      : undefined,
  };
}
