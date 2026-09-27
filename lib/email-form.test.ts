import { describe, expect, it } from "vitest";
import { createEmailAccountBody, emailApiErrorMessage, updateEmailAccountBody } from "./email-form";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const base = {
  name: " Trabalho ",
  address: "eu@empresa.com",
  imap_host: "mail.empresa.com",
  imap_port: "993",
  imap_use_tls: "on",
  smtp_host: "mail.empresa.com",
  smtp_port: "465",
  enabled: "on",
};

describe("email account form", () => {
  it("builds a create body with username fallback and verbatim password", () => {
    const body = createEmailAccountBody(form({ ...base, password: " s3nha ", save_sent_copy: "auto" }));
    expect(body).toMatchObject({
      name: "Trabalho",
      username: "eu@empresa.com",
      password: " s3nha ",
      imap_port: 993,
      imap_use_tls: true,
      smtp_use_tls: false,
      enabled: true,
    });
    expect(body).not.toHaveProperty("save_sent_copy");
  });

  it("sends explicit save_sent_copy choices", () => {
    expect(createEmailAccountBody(form({ ...base, save_sent_copy: "no" })).save_sent_copy).toBe(false);
    expect(createEmailAccountBody(form({ ...base, save_sent_copy: "yes" })).save_sent_copy).toBe(true);
  });

  it("omits a blank password on update", () => {
    expect(updateEmailAccountBody(form({ ...base, password: "  " }))).not.toHaveProperty("password");
    expect(updateEmailAccountBody(form({ ...base, password: "nova" })).password).toBe("nova");
    expect(updateEmailAccountBody(form(base)).save_sent_copy).toBe(false);
  });

  it("explains a missing credentials key", () => {
    expect(emailApiErrorMessage(503, "EMAIL_CREDENTIALS_KEY is required")).toContain("EMAIL_CREDENTIALS_KEY");
    expect(emailApiErrorMessage(400)).toContain("já cadastrado");
  });
});
