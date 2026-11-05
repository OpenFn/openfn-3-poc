/** Credential schemas on the pretend server (api/credentials.md, Credential schemas). */
import { credentialTypes, fieldsForSchema } from "@/mock-data/credentials";
import type { SchemaField } from "@/types/credentials";
import { json, problem, type Handler } from "./answers";

/** `dhis2` → `@openfn/language-dhis2`: a schema is named for its adaptor's package. */
export const fullName = (schema: string) => (schema === "raw" || schema === "oauth" || schema.startsWith("@") ? schema : `@openfn/language-${schema}`);

/** A JSON Schema for one of the fixture's adaptor schemas, as `Lightning.Adaptors.schema/2` would hold it. */
const jsonSchema = (fields: SchemaField[]) => ({
  type: "object",
  properties: Object.fromEntries(
    fields.map((f) => [
      f.key,
      {
        title: f.label,
        type: f.unrecognizedType ?? (f.kind === "text" || f.kind === "password" || f.kind === "url" ? "string" : f.kind),
        ...(f.kind === "password" && { writeOnly: true }),
        ...(f.kind === "url" && { format: "uri" }),
        ...(f.placeholder && { examples: [f.placeholder] }),
      },
    ])
  ),
  required: fields.filter((f) => f.required).map((f) => f.key),
});

export const credentialSchemaRoutes: Record<string, Handler> = {
  // Adaptor schemas and raw; Lightning has no display title yet, so the title is the short name.
  "GET /api/credential_schemas": () =>
    json(200, { data: [...credentialTypes.map((t) => ({ name: fullName(t.key), title: t.name })), { name: "raw", title: "Raw JSON" }] }),
  "GET /api/credential_schemas/:name": ({ name }) => {
    const short = name!.replace(/^@openfn\/language-/, "");
    if (name === "raw") return json(200, { data: { name: "raw", title: "Raw JSON", schema: {} } });
    if (!credentialTypes.some((t) => t.key === short)) return problem({ status: 404, code: "not_found", detail: "Not found." });
    return json(200, { data: { name: fullName(short), title: short, schema: jsonSchema(fieldsForSchema(short)) } });
  },
};
