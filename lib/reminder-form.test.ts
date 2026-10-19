import { describe, expect, it } from "vitest";
import { priorityFromForm, priorityLabel } from "./pushover-options";
import { defaultSendAt, deliveryErrorLabel, reminderApiErrorMessage, reminderBody, ReminderFormError } from "./reminder-form";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("reminder form", () => {
  it("builds the API body with a local send_at", () => {
    expect(reminderBody(form({ message: " Ir ao banheiro ", send_at: "2026-10-19T13:00", priority: "1", sound: "siren" }))).toEqual({
      message: "Ir ao banheiro", title: "", priority: 1, sound: "siren", send_at: "2026-10-19T13:00", timezone: "America/Sao_Paulo",
    });
  });

  it("requires message and send_at", () => {
    expect(() => reminderBody(form({ send_at: "2026-10-19T13:00" }))).toThrow(ReminderFormError);
    expect(() => reminderBody(form({ message: "x" }))).toThrow(ReminderFormError);
    expect(() => reminderBody(form({ message: "x", send_at: "19/10 13h" }))).toThrow(ReminderFormError);
  });

  it("maps API errors", () => {
    expect(reminderApiErrorMessage(400, "invalid argument: invalid notification: send_at is in the past")).toContain("já passou");
    expect(reminderApiErrorMessage(409)).toContain("pendentes");
    expect(reminderApiErrorMessage(500)).toContain("Tente novamente");
    expect(deliveryErrorLabel("pushover is not configured")).toBe("Pushover não configurado.");
    expect(deliveryErrorLabel("pushover: user identifier is invalid")).toBe("pushover: user identifier is invalid");
  });

  it("defaults send_at to the next 5 minutes in the timezone", () => {
    expect(defaultSendAt(new Date("2026-10-19T15:52:10Z"))).toBe("2026-10-19T12:55");
    expect(defaultSendAt(new Date("2026-10-19T15:59:30Z"), "UTC")).toBe("2026-10-19T16:05");
  });
});

describe("pushover priorities", () => {
  it("parses and labels priorities", () => {
    expect(priorityFromForm("2")).toBe(2);
    expect(priorityFromForm("-3")).toBe(0);
    expect(priorityFromForm(null)).toBe(0);
    expect(priorityLabel(2)).toContain("Emergência");
  });
});
