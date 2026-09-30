import { describe, expect, it } from "vitest";
import {
  buildCron,
  describeCron,
  dueMinutesFromHours,
  hoursFromDueMinutes,
  parseCron,
  scheduleApiErrorMessage,
  scheduleBody,
  ScheduleFormError,
  type Frequency,
} from "./schedule-form";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const base: Frequency = { mode: "daily", time: "09:30", weekday: "1", monthDay: "1", custom: "" };

describe("schedule cron builder", () => {
  it("builds each friendly mode", () => {
    expect(buildCron(base)).toBe("30 9 * * *");
    expect(buildCron({ ...base, mode: "weekdays" })).toBe("30 9 * * 1-5");
    expect(buildCron({ ...base, mode: "weekly", weekday: "5" })).toBe("30 9 * * 5");
    expect(buildCron({ ...base, mode: "monthly", monthDay: "15" })).toBe("30 9 15 * *");
    expect(buildCron({ ...base, mode: "hourly" })).toBe("0 * * * *");
    expect(buildCron({ ...base, mode: "custom", custom: " */15 8-18 * * * " })).toBe("*/15 8-18 * * *");
  });

  it("rejects incomplete inputs", () => {
    expect(buildCron({ ...base, time: "" })).toBeNull();
    expect(buildCron({ ...base, time: "25:00" })).toBeNull();
    expect(buildCron({ ...base, mode: "weekly", weekday: "7" })).toBeNull();
    expect(buildCron({ ...base, mode: "monthly", monthDay: "0" })).toBeNull();
    expect(buildCron({ ...base, mode: "custom", custom: " " })).toBeNull();
  });

  it("round-trips friendly expressions and falls back to custom", () => {
    for (const mode of ["daily", "weekdays", "weekly", "monthly", "hourly"] as const) {
      const cron = buildCron({ ...base, mode, weekday: "3", monthDay: "10" })!;
      expect(buildCron(parseCron(cron))).toBe(cron);
      expect(parseCron(cron).mode).toBe(mode);
    }
    expect(parseCron("*/15 8-18 * * *")).toMatchObject({ mode: "custom", custom: "*/15 8-18 * * *" });
    expect(parseCron("@daily").mode).toBe("custom");
  });

  it("describes schedules in Portuguese", () => {
    expect(describeCron("0 9 * * 1-5")).toBe("Dias úteis às 09:00");
    expect(describeCron("30 8 * * 1")).toBe("Toda segunda às 08:30");
    expect(describeCron("0 8 * * 6")).toBe("Todo sábado às 08:00");
    expect(describeCron("0 10 5 * *")).toBe("Todo dia 5 às 10:00");
    expect(describeCron("@weekly")).toBe("Todo domingo à 00:00");
    expect(describeCron("*/15 8-18 * * *")).toBe("Cron */15 8-18 * * *");
  });
});

describe("schedule due offset", () => {
  it("converts hours to minutes", () => {
    expect(dueMinutesFromHours("")).toBeNull();
    expect(dueMinutesFromHours("8")).toBe(480);
    expect(dueMinutesFromHours("1,5")).toBe(90);
    expect(dueMinutesFromHours("0")).toBeUndefined();
    expect(dueMinutesFromHours("abc")).toBeUndefined();
    expect(hoursFromDueMinutes(480)).toBe("8");
    expect(hoursFromDueMinutes(90)).toBe("1.5");
    expect(hoursFromDueMinutes(null)).toBe("");
  });
});

describe("schedule body", () => {
  const values = {
    title: " Revisar caixa ",
    frequency: "weekdays",
    time: "09:00",
    timezone: "",
    due_hours: "",
    enabled: "on",
  };

  it("omits due offset on create and clears it on update", () => {
    const created = scheduleBody(form(values), false);
    expect(created).toMatchObject({ cron: "0 9 * * 1-5", timezone: "America/Sao_Paulo", title: "Revisar caixa", enabled: true, skip_if_open: false });
    expect(created).not.toHaveProperty("due_in_minutes");
    expect(scheduleBody(form(values), true)).toMatchObject({ due_in_minutes: 0 });
    expect(scheduleBody(form({ ...values, due_hours: "4" }), false)).toMatchObject({ due_in_minutes: 240 });
  });

  it("sends the company link as company_id", () => {
    expect(scheduleBody(form({ ...values, company_id: "7" }), false)).toMatchObject({ company_id: "7" });
    expect(scheduleBody(form(values), true)).toMatchObject({ company_id: "" });
  });

  it("reports incomplete frequency and invalid due", () => {
    expect(() => scheduleBody(form({ ...values, time: "" }), false)).toThrow(ScheduleFormError);
    expect(() => scheduleBody(form({ ...values, due_hours: "-1" }), false)).toThrow(ScheduleFormError);
  });

  it("maps API errors", () => {
    expect(scheduleApiErrorMessage(400, "invalid argument: invalid cron expression: fires more often than every 5m0s")).toContain("5 minutos");
    expect(scheduleApiErrorMessage(400, "invalid argument: invalid cron expression: unknown timezone")).toContain("Fuso");
    expect(scheduleApiErrorMessage(400, "invalid argument: invalid cron expression: expected exactly 5 fields")).toContain("Expressão cron");
    expect(scheduleApiErrorMessage(404)).toContain("não encontrad");
  });
});
