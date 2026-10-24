import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { credentialsFixture, type CredentialsFixture } from "../../mock-data/credentials";
import { findUser } from "../../mock-data/users";
import type { CredentialValues } from "../../types/credentials";
import { RequestError } from "../../utils/errors";
import { credentialReplicaActions } from "./credentialsReplica";

// The replica stands in for Lightning, so it must keep the contract's OAuth promises too.
const viewer = findUser("user-amy")!;
const id = "cred-google-sheets";
const values = (environment: Partial<CredentialValues["environments"][number]>): CredentialValues => ({
  formId: "form-1",
  name: "Reporting spreadsheet",
  externalId: "",
  schema: "oauth",
  oauthClientId: "oc-google",
  projectIds: [],
  environments: [{ name: "main", previousName: "main", body: "", signInId: null, ...environment }],
});

let fixture: CredentialsFixture;
const actions = () =>
  credentialReplicaActions(fixture, (change) => (fixture = { ...fixture, ...change(fixture) }), viewer, () => {});
const settle = async <T,>(promise: Promise<T>) => {
  await vi.runAllTimersAsync();
  return promise;
};

beforeEach(() => {
  vi.useFakeTimers();
  fixture = credentialsFixture();
});
afterEach(() => vi.useRealTimers());

describe("credentialReplicaActions", () => {
  it("keeps the stored token when an OAuth environment wasn't signed in on this form, even when renamed", async () => {
    const before = (await settle(actions().onLoadCredentialSecrets(id))).environments[0]!;
    await settle(actions().onUpdateCredential(id, values({ name: "prod" })));
    expect(fixture.secrets[id]![0]!.body).toContain("fixture-access-token");
    const after = (await settle(actions().onLoadCredentialSecrets(id))).environments[0]!;
    expect(after).toEqual({ ...before, name: "prod" });
  });

  it("takes the token of a sign-in from this form for this credential", async () => {
    fixture.signIns["s1"] = { formId: "form-1", credentialId: id, oauthClientId: "oc-google", scopes: ["openid", "drive"], userInfo: null };
    await settle(actions().onUpdateCredential(id, values({ signInId: "s1" })));
    expect(fixture.secrets[id]![0]!.oauth?.scopes).toEqual(["openid", "drive"]);
    expect(fixture.signIns["s1"]).toBeUndefined();
  });

  const refusal = async (v: CredentialValues) => {
    const refused = actions().onUpdateCredential(id, v).catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    return ((await refused) as RequestError).fieldErrors;
  };
  const signIn = { formId: "form-1", credentialId: id, oauthClientId: "oc-google", scopes: ["openid"], userInfo: null };
  const cantUse = ["sign in again: that sign-in can't be used here"];

  it.each([
    ["another form", { formId: "other-form" }],
    ["another credential", { credentialId: null }],
    ["another client", { oauthClientId: "oc-salesforce" }],
  ])("refuses a sign-in started by %s", async (_, differs) => {
    fixture.signIns["s2"] = { ...signIn, ...differs };
    expect(await refusal(values({ signInId: "s2" }))).toEqual({ "environments.main": cantUse });
    expect(fixture.secrets[id]).toBeUndefined();
  });

  it("refuses one sign-in named by two environments", async () => {
    fixture.signIns["s3"] = signIn;
    const v = values({ signInId: "s3" });
    v.environments.push({ name: "staging", previousName: null, body: "", signInId: "s3" });
    expect(await refusal(v)).toEqual({ "environments.main": cantUse, "environments.staging": cantUse });
  });

  it("refuses a sign-in a discarded form started", async () => {
    fixture.signIns["s4"] = signIn;
    await settle(actions().onDiscardOauthSignIns("form-1"));
    expect(fixture.signIns["s4"]).toBeUndefined();
    expect(await refusal(values({ signInId: "s4" }))).toEqual({ "environments.main": cantUse });
  });

  it("refuses a sign-in id it never handed out", async () => {
    expect(await refusal(values({ signInId: "never-started" }))).toEqual({ "environments.main": cantUse });
  });

  it("gives no token to a sign-in that comes back after its form was discarded", async () => {
    const started = actions().onAuthorizeOauth({ formId: "form-9", signInId: "s9", credentialId: id, oauthClientId: "oc-google", scopes: ["openid"], environment: "main" });
    await settle(actions().onDiscardOauthSignIns("form-9"));
    await settle(started);
    await vi.runAllTimersAsync();
    expect(fixture.signIns["s9"]).toBeUndefined();
    expect(fixture.oauthSignIns).toEqual([]);
  });

  it("unshares a credential from every project when it schedules its deletion", async () => {
    await settle(actions().onDeleteCredential("cred-hapi-fhir"));
    const credential = fixture.credentials.find((c) => c.id === "cred-hapi-fhir")!;
    expect(credential.scheduledDeletion).not.toBeNull();
    expect(credential.projectIds).toEqual([]);
  });

  it("won't delete a scheduled credential with activity in projects", async () => {
    const refused = actions().onDeleteCredential("cred-old-postgres").catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    expect(((await refused) as RequestError).message).toBe("Cannot delete a credential that has activities in projects");
    expect(fixture.credentials.some((c) => c.id === "cred-old-postgres")).toBe(true);
  });

  it("won't transfer a credential to someone outside a project that uses it", async () => {
    const refused = actions().onTransferCredential("cred-hapi-fhir", "super@openfn.org").catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    expect(((await refused) as RequestError).fieldErrors).toEqual({ receiverEmail: ["User doesn't have access to these projects: openhie-project"] });
    await settle(actions().onTransferCredential("cred-hapi-fhir", "editor@openfn.org"));
    expect(fixture.credentials.find((c) => c.id === "cred-hapi-fhir")!.transferStatus).toBe("pending");
  });

  it("won't transfer a credential to someone who doesn't exist, or to the viewer", async () => {
    const refusal = async (email: string) => {
      const refused = actions().onTransferCredential("cred-hapi-fhir", email).catch((e: unknown) => e);
      await vi.runAllTimersAsync();
      return ((await refused) as RequestError).fieldErrors;
    };
    expect(await refusal("nobody@example.org")).toEqual({ receiverEmail: ["User does not exist"] });
    expect(await refusal(viewer.email)).toEqual({ receiverEmail: ["You cannot transfer a credential to yourself"] });
    expect(fixture.credentials.find((c) => c.id === "cred-hapi-fhir")!.transferStatus).toBeNull();
  });

  it("moves tokens by the names stored before the save, so renames that swap names swap tokens", async () => {
    const token = (scope: string) => ({ name: "", body: scope, oauth: { scopes: [scope], status: "ready" as const, userInfo: null } });
    fixture.secrets[id] = [
      { ...token("main-scope"), name: "main" },
      { ...token("staging-scope"), name: "staging" },
    ];
    // main→tmp, staging→main, tmp→staging in the form, sent as the result.
    const v = values({ name: "staging", previousName: "main" });
    v.environments.push({ name: "main", previousName: "staging", body: "", signInId: null });
    await settle(actions().onUpdateCredential(id, v));
    expect(fixture.secrets[id]!.map((e) => [e.name, e.body])).toEqual([
      ["staging", "main-scope"],
      ["main", "staging-scope"],
    ]);
  });

  it("refuses an environment with no sign-in and nothing stored under its previous name", async () => {
    expect(await refusal(values({ previousName: "gone" }))).toEqual({ "environments.main": ["sign in before saving"] });
  });
});
