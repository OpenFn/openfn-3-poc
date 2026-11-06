/** The instance's single sign-on provider on the pretend server (api/authentication.md, Single sign-on provider). */
import { authProvider as fixture } from "@/mock-data/admin";
import { forbidden, invalid, json, noContent, notFound, now, ORIGIN, SEEDED_AT, type Body, type Handler, type Problem } from "./answers";
import { currentUser } from "./session";

interface StoredProvider {
  name: string;
  discovery_url: string;
  client_id: string;
  client_secret: string;
  inserted_at: string;
  updated_at: string;
}

// The fake's own copy: one row at most.
const seed = (): StoredProvider => ({
  name: fixture.name,
  discovery_url: fixture.discoveryUrl,
  client_id: fixture.clientId,
  client_secret: "fake-secret-not-real",
  inserted_at: SEEDED_AT,
  updated_at: SEEDED_AT,
});
let stored: StoredProvider | null = seed();

/** For stories and tests: the starting provider. */
export const resetAuthProvider = () => {
  stored = seed();
};

// Never the secret.
const entry = ({ name, discovery_url, client_id, inserted_at, updated_at }: StoredProvider) => ({
  data: { name, discovery_url, client_id, redirect_uri: `${ORIGIN}/authenticate/${name}/callback`, inserted_at, updated_at },
});

const REQUIRED = ["name", "discovery_url", "client_id"];
const KEYS = [...REQUIRED, "client_secret"];
const text = (body: Body, key: string) => (typeof body[key] === "string" ? (body[key] as string) : "");

// AuthConfigForm's checks, in Lightning's words: only "required" ignores surrounding spaces. The fake can't fetch the discovery document, so a URL
// that isn't a .well-known/openid-configuration stands in for one that can't be fetched.
function check(body: Body, hasSecret: boolean): NonNullable<Problem["errors"]> {
  const errors: NonNullable<Problem["errors"]> = Object.keys(body)
    .filter((key) => !KEYS.includes(key))
    .map((key) => ({ code: "unknown_key", detail: "is not a known field", pointer: `#/${key}` }));
  // A stored secret is kept by leaving the field out; a blank one is still blank.
  for (const key of hasSecret && !("client_secret" in body) ? REQUIRED : KEYS) {
    if (!text(body, key).trim()) errors.push({ code: "required", detail: "can't be blank", pointer: `#/${key}` });
  }
  const name = text(body, "name");
  if (name && !/^[a-z0-9_-]+$/.test(name)) {
    errors.push({ code: "format", detail: "must be lower-case and only contain alphanumeric, dash and underscore characters", pointer: "#/name" });
  }
  const url = text(body, "discovery_url");
  if (url && !url.startsWith("https://")) {
    errors.push({ code: "discovery_failed", detail: "discovery endpoint must use https", pointer: "#/discovery_url" });
  } else if (url && !url.endsWith("/.well-known/openid-configuration")) {
    errors.push({ code: "discovery_failed", detail: "could not connect to discovery endpoint", pointer: "#/discovery_url" });
  }
  return errors;
}

// Private. Superusers only: Lightning's AuthProviders functions check nothing, so the routes have to.
export const authProviderRoutes: Record<string, Handler> = {
  "GET /api/auth_provider": () => {
    if (currentUser().role !== "superuser") return forbidden();
    return stored ? json(200, entry(stored)) : notFound();
  },
  "PUT /api/auth_provider": (_params, body) => {
    if (currentUser().role !== "superuser") return forbidden();
    const errors = check(body, stored !== null);
    if (errors.length) return invalid(errors);
    const at = now();
    const values = { name: text(body, "name"), discovery_url: text(body, "discovery_url"), client_id: text(body, "client_id") };
    const secret = text(body, "client_secret");
    if (stored) {
      stored = { ...stored, ...values, ...(secret ? { client_secret: secret } : {}), updated_at: at };
      return json(200, entry(stored));
    }
    stored = { ...values, client_secret: secret, inserted_at: at, updated_at: at };
    return json(201, entry(stored));
  },
  "DELETE /api/auth_provider": () => {
    if (currentUser().role !== "superuser") return forbidden();
    if (!stored) return notFound();
    stored = null;
    return noContent();
  },
};
