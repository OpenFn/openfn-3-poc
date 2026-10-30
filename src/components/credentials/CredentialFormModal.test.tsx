import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { CredentialRow, CredentialSecretsResult, OauthClientRow, OauthSignInResult } from "../../types/credentials";
import { RequestError } from "../../utils/errors";
import CredentialFormModal from "./CredentialFormModal";
import { isDisabled } from "../../test/disabled";

const credential: CredentialRow = {
  id: "cred-1",
  name: "HAPI FHIR",
  schema: "raw",
  oauthClient: null,
  ownerEmail: "amy@example.org",
  projects: [],
  externalId: null,
  environments: ["main", "staging"],
  transferStatus: null,
  scheduledDeletion: null,
  hasActivityInProjects: false,
  canEdit: true,
};
const secrets: CredentialSecretsResult = {
  environments: [
    { name: "main", body: '{"a":1}', oauth: null },
    { name: "staging", body: '{"a":2}', oauth: null },
  ],
};
const google: OauthClientRow = {
  id: "oc1",
  name: "Google Workspace",
  ownerEmail: "amy@example.org",
  global: false,
  projects: [],
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "",
  revocationEndpoint: "",
  introspectionEndpoint: "",
  userinfoEndpoint: "",
  mandatoryScopes: ["openid"],
  optionalScopes: ["spreadsheets", "drive"],
  scopesDocUrl: "",
  canEdit: true,
};
const sheets: CredentialRow = { ...credential, id: "cred-2", name: "Sheets", schema: "oauth", oauthClient: { id: "oc1", name: "Google Workspace", mandatoryScopes: ["openid"], optionalScopes: ["spreadsheets", "drive"], scopesDocUrl: "" }, environments: ["main"] };

type Props = React.ComponentProps<typeof CredentialFormModal>;
function renderModal(props: Partial<Props> = {}) {
  const all: Props = {
    open: true,
    onClose: () => {},
    credential,
    secrets,
    oauthClients: [google],
    credentialTypes: [],
    projects: [],
    oauthSignIns: [],
    onAuthorizeOauth: vi.fn().mockResolvedValue({ authorizeUrl: "about:blank" }),
    onDiscardOauthSignIns: vi.fn().mockResolvedValue(undefined),
    onLoadCredentialSchema: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    ...props,
  };
  const view = render(<CredentialFormModal {...all} />);
  return { ...all, rerender: (next: Partial<Props>) => view.rerender(<CredentialFormModal {...all} {...next} />) };
}

const envTabs = () => screen.getAllByRole("tab").map((t) => t.textContent);
const nameInput = () => document.getElementById("environment-name-input") as HTMLInputElement;
const save = () => fireEvent.click(screen.getByRole("button", { name: "Save Credential" }));

afterEach(() => vi.restoreAllMocks());

describe("CredentialFormModal", () => {
  it("asks before deleting an environment, and keeps it on Cancel", async () => {
    renderModal();
    expect(envTabs()).toEqual(["main", "staging"]);

    fireEvent.click(screen.getByRole("button", { name: "Delete environment" }));
    const confirm = screen.getByRole("dialog", { name: "Delete environment" });
    expect(confirm.textContent).toContain("Are you sure you want to delete the main environment?");
    fireEvent.click(screen.getAllByRole("button", { name: "Cancel" }).at(-1)!);
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Delete environment" })).toBeNull());
    expect(envTabs()).toEqual(["main", "staging"]);

    fireEvent.click(screen.getByRole("button", { name: "Delete environment" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(envTabs()).toEqual(["staging"]));
  });

  it("deletes an environment without saving or closing the credential", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSave, onClose });

    fireEvent.click(screen.getByRole("button", { name: "Delete environment" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(envTabs()).toEqual(["staging"]));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("refuses a raw body that isn't JSON on Save, without asking the host", async () => {
    const onSave = vi.fn();
    renderModal({ onSave, secrets: { environments: [{ name: "main", body: "{", oauth: null }] }, credential: { ...credential, environments: ["main"] } });
    save();
    expect(await screen.findByText("main: the body must be valid JSON")).toBeTruthy();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("sends every environment on edit, the untouched one unchanged", async () => {
    const { onSave } = renderModal();
    fireEvent.click(screen.getByRole("tab", { name: "staging" }));
    fireEvent.change(document.getElementById("credential-body-raw")!, { target: { value: '{"a":3}' } });
    save();
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          environments: [
            { name: "main", previousName: "main", body: '{"a":1}', signInId: null },
            { name: "staging", previousName: "staging", body: '{"a":3}', signInId: null },
          ],
        })
      )
    );
  });


  it("shows each credential type's icon after its name, as Lightning does", () => {
    renderModal({ credential: undefined, secrets: undefined, credentialTypes: [{ key: "dhis2", name: "dhis2" }] });
    const icon = (key: string) => document.getElementById(`credential-schema-picker_selected_${key}`)!.closest("label")!.querySelector("img")!.getAttribute("src");
    expect(icon("dhis2")).toBe("/images/adaptors/dhis2-square.png");
    expect(icon("raw")).toBe("/images/raw.png");
    expect(icon("oc1")).toBe("/images/oauth-2.png");
  });

  it("sorts the stored environments as Lightning does, and opens on the primary one", () => {
    renderModal({
      secrets: {
        environments: [
          { name: "staging", body: '{"a":2}', oauth: null },
          { name: "main", body: '{"a":1}', oauth: null },
        ],
      },
    });
    expect(envTabs()).toEqual(["main", "staging"]);
    expect(screen.getByRole("tab", { name: "main" }).getAttribute("aria-selected")).toBe("true");
    expect((document.getElementById("credential-body-raw") as HTMLTextAreaElement).value).toBe('{"a":1}');
  });

  describe("environment names", () => {
    it("never offers a default name that's taken, and sorts a new one in as Lightning does", () => {
      renderModal();
      fireEvent.click(screen.getByRole("button", { name: "Add new environment" }));
      expect(envTabs()).toEqual(["main", "staging", "untitled"]);
      expect(screen.getByRole("tab", { name: "untitled" }).getAttribute("aria-selected")).toBe("true");
      fireEvent.click(screen.getByRole("button", { name: "Add new environment" }));
      expect(envTabs()).toEqual(["main", "staging", "untitled", "untitled-1"]);
      fireEvent.change(nameInput(), { target: { value: "production" } });
      fireEvent.click(screen.getByRole("button", { name: "Add new environment" }));
      expect(envTabs()).toEqual(["main", "production", "staging", "untitled", "untitled-1"]);
    });

    it("clears the host's refusal of an environment once that environment changes", async () => {
      const onSave = vi.fn().mockRejectedValue(new RequestError("Please fix the errors below.", { fieldErrors: { "environments.staging": ["is reserved"] } }));
      renderModal({ onSave });
      save();
      await screen.findByText("staging: is reserved");
      fireEvent.click(screen.getByRole("tab", { name: "staging" }));
      expect(screen.getByText("is reserved")).toBeTruthy();
      // A change to another environment leaves staging's own error; any change clears the list, as Lightning re-validates.
      fireEvent.click(screen.getByRole("tab", { name: "main" }));
      fireEvent.change(document.getElementById("credential-body-raw")!, { target: { value: '{"a":9}' } });
      expect(document.getElementById("credential-environments-errors")).toBeNull();
      fireEvent.click(screen.getByRole("tab", { name: "staging" }));
      expect(screen.getByText("is reserved")).toBeTruthy();
      fireEvent.change(document.getElementById("credential-body-raw")!, { target: { value: '{"a":3}' } });
      expect(screen.queryByText("is reserved")).toBeNull();
    });

    it("lowercases and trims a name, and refuses a bad or taken one as it's typed", () => {
      renderModal();
      fireEvent.change(nameInput(), { target: { value: " Prod " } });
      expect(envTabs()).toEqual(["prod", "staging"]);
      fireEvent.change(nameInput(), { target: { value: "my env" } });
      expect(screen.getByText("Must be lowercase alphanumeric with hyphens or underscores (max 32 chars)")).toBeTruthy();
      fireEvent.change(nameInput(), { target: { value: "staging" } });
      expect(screen.getByText("Environment 'staging' already exists")).toBeTruthy();
      expect(envTabs()).toEqual(["prod", "staging"]);
    });

    it("sends a renamed environment with its stored name, so the host can move it", async () => {
      const { onSave } = renderModal();
      fireEvent.change(nameInput(), { target: { value: "prod" } });
      save();
      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(
          expect.objectContaining({ environments: [expect.objectContaining({ name: "prod", previousName: "main" }), expect.anything()] })
        )
      );
    });

    it("shows the host's refusal of one environment on that environment", async () => {
      const onSave = vi.fn().mockRejectedValue(new RequestError("Please fix the errors below.", { fieldErrors: { "environments.staging": ["is reserved"] } }));
      renderModal({ onSave });
      save();
      expect(await screen.findByText("staging: is reserved")).toBeTruthy();
      expect(screen.queryByText("Please fix the errors below.")).toBeNull();
      fireEvent.click(screen.getByRole("tab", { name: "staging" }));
      expect(within(nameInput().closest<HTMLElement>('[data-ui="form-group"]')!).getByText("is reserved")).toBeTruthy();
    });
  });

  describe("OAuth", () => {
    const stored = (status: "ready" | "unavailable" | "reauthorize", scopes = ["openid", "drive"]): CredentialSecretsResult => ({
      environments: [{ name: "main", body: "", oauth: { scopes, status, userInfo: null } }],
    });
    const fakePopup = () => {
      const popup = { location: { href: "" }, close: vi.fn() };
      vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);
      return popup;
    };
    const lastSignIn = (onAuthorizeOauth: Props["onAuthorizeOauth"]) =>
      (onAuthorizeOauth as ReturnType<typeof vi.fn>).mock.lastCall![0] as { signInId: string; formId: string; scopes: string[] };

    it("edits with the credential's own client, even when it isn't shared here", () => {
      renderModal({ credential: sheets, secrets: stored("ready"), oauthClients: [] });
      expect(screen.queryByText("OAuth client not found")).toBeNull();
      expect(screen.getByText(/Successfully authenticated with Google Workspace/)).toBeTruthy();
      expect(screen.getByLabelText("spreadsheets")).toBeTruthy();
    });

    it("warns that changed permissions need a new sign-in, and drops the warning when they're put back", () => {
      renderModal({ credential: sheets, secrets: stored("ready") });
      fireEvent.click(screen.getByLabelText("spreadsheets"));
      expect(screen.getByText("Reauthentication Required")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Reauthenticate" })).toBeTruthy();
      expect(screen.queryByText(/Successfully authenticated/)).toBeNull();
      fireEvent.click(screen.getByLabelText("spreadsheets"));
      expect(screen.queryByText("Reauthentication Required")).toBeNull();
      expect(screen.getByText(/Successfully authenticated/)).toBeTruthy();
    });

    it("won't save while permissions differ from the token's, and compares them ignoring case", async () => {
      const { onSave } = renderModal({ credential: sheets, secrets: stored("ready", ["OpenID", "Drive"]) });
      const saveButton = () => screen.getByRole("button", { name: "Save Credential" }) as HTMLButtonElement;
      expect(screen.queryByText("Reauthentication Required")).toBeNull();
      expect(isDisabled(saveButton())).toBe(false);
      fireEvent.click(screen.getByLabelText("spreadsheets"));
      expect(isDisabled(saveButton())).toBe(true);
      save();
      fireEvent.click(screen.getByLabelText("spreadsheets"));
      expect(isDisabled(saveButton())).toBe(false);
      expect(onSave).not.toHaveBeenCalled();
    });

    it("warns about changed permissions after a sign-in on this form too", async () => {
      fakePopup();
      const { onAuthorizeOauth, rerender } = renderModal({ credential: sheets, secrets: { environments: [{ name: "main", body: "", oauth: null }] } });
      fireEvent.click(screen.getByRole("button", { name: "Sign in with Google Workspace" }));
      await screen.findByText(/Authenticating with Google Workspace/);
      rerender({ oauthSignIns: [{ signInId: lastSignIn(onAuthorizeOauth).signInId, error: null, userInfo: null }] });
      expect(await screen.findByText(/Successfully authenticated/)).toBeTruthy();
      fireEvent.click(screen.getByLabelText("drive"));
      expect(screen.getByText("Reauthentication Required")).toBeTruthy();
    });

    it("keeps stored scopes the client no longer lists, and asks for them again", async () => {
      fakePopup();
      const { onAuthorizeOauth } = renderModal({ credential: sheets, secrets: stored("ready", ["openid", "legacy"]) });
      expect((screen.getByLabelText("legacy") as HTMLInputElement).checked).toBe(true);
      expect(screen.queryByText("Reauthentication Required")).toBeNull();
      fireEvent.click(screen.getByRole("link", { name: /reauthenticate with Google Workspace/ }));
      await waitFor(() => expect(lastSignIn(onAuthorizeOauth).scopes).toEqual(["openid", "legacy"]));
    });

    it("says when the provider couldn't be reached to check the token", () => {
      renderModal({ credential: sheets, secrets: stored("unavailable") });
      expect(screen.getByText("Google Workspace is Having Issues")).toBeTruthy();
      expect(screen.queryByText(/Successfully authenticated/)).toBeNull();
      expect(screen.getByRole("button", { name: "Try Again Later" })).toBeTruthy();
    });

    it("says when the sign-in window was blocked, without starting a sign-in", async () => {
      vi.spyOn(window, "open").mockReturnValue(null);
      const { onAuthorizeOauth } = renderModal({ credential: sheets, secrets: { environments: [{ name: "main", body: "", oauth: null }] } });
      fireEvent.click(screen.getByRole("button", { name: "Sign in with Google Workspace" }));
      expect(await screen.findByText(/Your browser blocked the sign-in window/)).toBeTruthy();
      expect(onAuthorizeOauth).not.toHaveBeenCalled();
      expect(screen.queryByText(/Authenticating with/)).toBeNull();
    });

    it("lets a sign-in that never comes back be started again", async () => {
      fakePopup();
      const { onAuthorizeOauth } = renderModal({ credential: sheets, secrets: { environments: [{ name: "main", body: "", oauth: null }] } });
      fireEvent.click(screen.getByRole("button", { name: "Sign in with Google Workspace" }));
      await screen.findByText(/Authenticating with Google Workspace/);
      const first = lastSignIn(onAuthorizeOauth).signInId;
      fireEvent.click(screen.getByRole("link", { name: "Start again" }));
      await waitFor(() => expect(lastSignIn(onAuthorizeOauth).signInId).not.toBe(first));
    });

    it("doesn't point the window at the provider for a form closed while the host answered, and asks the host to drop its sign-ins", async () => {
      const popup = fakePopup();
      let answer!: (r: { authorizeUrl: string }) => void;
      const onAuthorizeOauth = vi.fn(() => new Promise<{ authorizeUrl: string }>((resolve) => (answer = resolve)));
      const onDiscardOauthSignIns = vi.fn().mockResolvedValue(undefined);
      const view = renderModal({ credential: sheets, secrets: { environments: [{ name: "main", body: "", oauth: null }] }, onAuthorizeOauth, onDiscardOauthSignIns });
      fireEvent.click(screen.getByRole("button", { name: "Sign in with Google Workspace" }));
      await waitFor(() => expect(onAuthorizeOauth).toHaveBeenCalled());
      cleanup();
      answer({ authorizeUrl: "https://provider.example/auth" });
      await waitFor(() => expect(popup.close).toHaveBeenCalled());
      expect(popup.location.href).toBe("");
      expect(onDiscardOauthSignIns).toHaveBeenCalledWith(lastSignIn(view.onAuthorizeOauth).formId);
    });

    it("saves a sign-in through edit, then asks the host to drop what's left", async () => {
      fakePopup();
      const { onAuthorizeOauth, onSave, onDiscardOauthSignIns, rerender } = renderModal({ credential: sheets, secrets: stored("reauthorize") });
      fireEvent.click(screen.getByRole("button", { name: "Reauthorize with Google Workspace" }));
      await screen.findByText(/Authenticating with Google Workspace/);
      const { signInId, formId } = lastSignIn(onAuthorizeOauth);
      rerender({ oauthSignIns: [{ signInId, error: null, userInfo: { name: "Amy", email: null } }] });
      expect(await screen.findByText("Amy")).toBeTruthy();
      save();
      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ formId, environments: [{ name: "main", previousName: "main", body: "", signInId }] }))
      );
      expect(onDiscardOauthSignIns).not.toHaveBeenCalled();
      cleanup();
      expect(onDiscardOauthSignIns).toHaveBeenCalledWith(formId);
    });

    it("works where crypto.randomUUID doesn't (plain http)", () => {
      const original = crypto.randomUUID;
      Object.defineProperty(crypto, "randomUUID", { value: undefined, configurable: true });
      try {
        renderModal();
        expect(envTabs()).toEqual(["main", "staging"]);
      } finally {
        Object.defineProperty(crypto, "randomUUID", { value: original, configurable: true });
      }
    });

    it("keeps the stored token on edit, ticks its scopes again, and sends no sign-in", async () => {
      const { onSave } = renderModal({ credential: sheets, secrets: stored("ready") });
      expect((screen.getByLabelText("drive") as HTMLInputElement).checked).toBe(true);
      expect((screen.getByLabelText("spreadsheets") as HTMLInputElement).checked).toBe(false);
      expect(screen.getByText(/Successfully authenticated with Google Workspace/)).toBeTruthy();
      save();
      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ environments: [{ name: "main", previousName: "main", body: "", signInId: null }] }))
      );
    });

    it("lets a signed-in environment be renamed and saved", async () => {
      const { onSave } = renderModal({ credential: sheets, secrets: stored("ready") });
      fireEvent.change(nameInput(), { target: { value: "prod" } });
      expect(screen.getByText(/Successfully authenticated with Google Workspace/)).toBeTruthy();
      save();
      await waitFor(() =>
        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ environments: [{ name: "prod", previousName: "main", body: "", signInId: null }] }))
      );
    });

    it("says when the stored token has expired or was revoked, not that it worked", () => {
      renderModal({ credential: sheets, secrets: stored("reauthorize") });
      expect(screen.getByText("Your authorization with Google Workspace has expired or was revoked.")).toBeTruthy();
      expect(screen.queryByText(/Successfully authenticated/)).toBeNull();
      expect(screen.getByRole("button", { name: "Reauthorize with Google Workspace" })).toBeTruthy();
    });

    it("shows a sign-in request's spinner and failure only on the environment that asked", async () => {
      fakePopup();
      let fail!: (e: Error) => void;
      const onAuthorizeOauth = vi.fn(() => new Promise<{ authorizeUrl: string }>((_, reject) => (fail = reject)));
      const twoEnvs: CredentialSecretsResult = {
        environments: [
          { name: "main", body: "", oauth: null },
          { name: "staging", body: "", oauth: null },
        ],
      };
      renderModal({ credential: { ...sheets, environments: ["main", "staging"] }, secrets: twoEnvs, onAuthorizeOauth });
      const button = () => screen.getByRole("button", { name: /Sign in with Google Workspace/ });
      fireEvent.click(button());
      expect(button().getAttribute("aria-busy")).toBe("true");
      fireEvent.click(screen.getByRole("tab", { name: "staging" }));
      expect(button().getAttribute("aria-busy")).toBeNull();
      fail(new RequestError("The provider is down"));
      fireEvent.click(screen.getByRole("tab", { name: "main" }));
      expect(await screen.findByText("The provider is down")).toBeTruthy();
      fireEvent.click(screen.getByRole("tab", { name: "staging" }));
      expect(screen.queryByText("The provider is down")).toBeNull();
    });

    it("tells two identical failures apart, and tracks each environment's sign-in on its own", async () => {
      vi.spyOn(window, "open").mockReturnValue({ location: { href: "" }, close: vi.fn() } as unknown as Window);
      const twoEnvs: CredentialSecretsResult = {
        environments: [
          { name: "main", body: "", oauth: null },
          { name: "staging", body: "", oauth: null },
        ],
      };
      const { onAuthorizeOauth, onSave, rerender } = renderModal({ credential: { ...sheets, environments: ["main", "staging"] }, secrets: twoEnvs });
      const signIn = async (name: string) => {
        fireEvent.click(screen.getByRole("button", { name }));
        await screen.findByText("Authenticating with Google Workspace...");
        return (onAuthorizeOauth as ReturnType<typeof vi.fn>).mock.lastCall![0] as { signInId: string; formId: string; credentialId: string };
      };
      const first = await signIn("Sign in with Google Workspace");
      expect(first.credentialId).toBe("cred-2");
      const denied = (id: string): OauthSignInResult => ({ signInId: id, error: "access_denied", userInfo: null });
      let answers = [denied(first.signInId)];
      rerender({ oauthSignIns: answers });
      expect(await screen.findByText("access_denied")).toBeTruthy();

      const second = await signIn("Try again");
      expect(second.signInId).not.toBe(first.signInId);
      expect(second.formId).toBe(first.formId);
      // Main waits; staging starts its own sign-in meanwhile.
      fireEvent.click(screen.getByRole("tab", { name: "staging" }));
      const third = await signIn("Sign in with Google Workspace");
      answers = [...answers, denied(second.signInId), { signInId: third.signInId, error: null, userInfo: null }];
      rerender({ oauthSignIns: answers });
      expect(await screen.findByText(/Successfully authenticated/)).toBeTruthy();
      fireEvent.click(screen.getByRole("tab", { name: "main" }));
      expect(screen.getByText("access_denied")).toBeTruthy();
      expect(screen.queryByText("Authenticating with Google Workspace...")).toBeNull();

      save();
      expect(await screen.findByText("main: sign in with Google Workspace first")).toBeTruthy();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  it("keeps a schema value's type: booleans, numbers and objects", async () => {
    const { onSave } = renderModal({
      credential: { ...credential, schema: "postgresql", environments: ["main"] },
      secrets: { environments: [{ name: "main", body: "{}", oauth: null }] },
      schema: {
        fields: [
          { key: "port", label: "Port", kind: "integer", required: true, placeholder: null, unrecognizedType: null },
          { key: "ssl", label: "SSL", kind: "boolean", required: false, placeholder: null, unrecognizedType: null },
          { key: "tls", label: "TLS", kind: "object", required: false, placeholder: null, unrecognizedType: null },
        ],
      },
    });
    fireEvent.change(screen.getByLabelText(/Port/), { target: { value: "5432" } });
    fireEvent.click(screen.getByLabelText("SSL"));
    fireEvent.change(screen.getByLabelText(/TLS/), { target: { value: '{"ca": "x"}' } });
    save();
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ environments: [expect.objectContaining({ body: '{"port":5432,"ssl":true,"tls":{"ca":"x"}}' })] })
      )
    );
  });

  it("keeps an integer too big for a number as typed, and warns about a type Lightning doesn't know", async () => {
    const { onSave } = renderModal({
      credential: { ...credential, schema: "postgresql", environments: ["main"] },
      secrets: { environments: [{ name: "main", body: "{}", oauth: null }] },
      schema: {
        fields: [
          { key: "port", label: "Port", kind: "integer", required: false, placeholder: null, unrecognizedType: null },
          { key: "odd", label: "Odd", kind: "text", required: false, placeholder: null, unrecognizedType: "date" },
        ],
      },
    });
    expect(screen.getByText(/specifies an unrecognized type \(date\) for this field/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/Port/), { target: { value: "9007199254740993" } });
    save();
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ environments: [expect.objectContaining({ body: '{"port":"9007199254740993"}' })] })
      )
    );
  });

  it("keeps a stored integer too big for a number exactly as stored when another field changes", async () => {
    const { onSave } = renderModal({
      credential: { ...credential, schema: "postgresql", environments: ["main"] },
      secrets: { environments: [{ name: "main", body: '{"port":9007199254740993,"host":"a"}', oauth: null }] },
      schema: {
        fields: [
          { key: "port", label: "Port", kind: "integer", required: false, placeholder: null, unrecognizedType: null },
          { key: "host", label: "Host", kind: "text", required: false, placeholder: null, unrecognizedType: null },
        ],
      },
    });
    expect((screen.getByLabelText(/Port/) as HTMLInputElement).value).toBe("9007199254740993");
    fireEvent.change(screen.getByLabelText(/Host/), { target: { value: "b" } });
    save();
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ environments: [expect.objectContaining({ body: '{"port":9007199254740993,"host":"b"}' })] })
      )
    );
  });

  it("shows the host's refusal of the projects on the projects picker", async () => {
    const onSave = vi.fn().mockRejectedValue(new RequestError("Please fix the errors below.", { fieldErrors: { projectIds: ["you can't share into that project"] } }));
    renderModal({ onSave });
    save();
    expect(await screen.findByText("you can't share into that project")).toBeTruthy();
  });
});
