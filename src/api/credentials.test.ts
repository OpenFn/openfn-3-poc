import { describe, expect, it } from "vitest";
import { bodyToSend, schemaFields } from "./credentials";

describe("bodyToSend", () => {
  it.each([
    ["dhis2", '{"hostUrl":"https://x.org","password":""}', { hostUrl: "https://x.org" }],
    ["dhis2", '{"hostUrl":"","password":""}', undefined],
    ["raw", '{"token":""}', { token: "" }],
    ["raw", "{}", undefined],
  ])("sends only what %s's form filled in, or nothing to keep what's saved: %s", (schema, text, sent) => {
    expect(bodyToSend(schema, text)).toEqual(sent);
  });
});

describe("schemaFields", () => {
  it("reads each property as Lightning's form draws it", () => {
    const fields = schemaFields({
      properties: {
        hostUrl: { title: "Host URL", type: "string", format: "uri", examples: ["https://play.dhis2.org"] },
        password: { title: "Password", type: "string", writeOnly: true },
        port: { type: "integer" },
        ssl: { type: "boolean" },
        tls: { type: "object" },
        odd: { type: "date" },
      },
      required: ["hostUrl"],
    });
    expect(fields.map((f) => [f.key, f.label, f.kind, f.required, f.placeholder, f.unrecognizedType])).toEqual([
      ["hostUrl", "Host URL", "url", true, "https://play.dhis2.org", null],
      ["password", "Password", "password", false, null, null],
      ["port", "port", "integer", false, null, null],
      ["ssl", "ssl", "boolean", false, null, null],
      ["tls", "tls", "object", false, null, null],
      ["odd", "odd", "text", false, null, "date"],
    ]);
  });
});
