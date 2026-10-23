import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RouterProvider, type Router } from "../../routing/router";
import { ToastProvider } from "../../components/Toast";
import { session } from "../../mock-data/users";
import { SessionContext } from "../../session/session";
import type { CollaboratorRow, WebhookAuthMethodRow } from "../../types/project-settings";
import { RequestError } from "../../utils/errors";
import ProjectSettingsPage, { type ProjectSettingsPageProps } from "./ProjectSettingsPage";

const me: CollaboratorRow = {
  id: "pu-me",
  firstName: "Amy",
  lastName: "Admin",
  email: "amy@example.org",
  role: "owner",
  failureAlert: true,
  digest: "weekly",
  isCurrentUser: true,
  removeBlockedReason: "You cannot remove yourself",
  ownedCredentialNames: [],
};
const esther: CollaboratorRow = {
  ...me,
  id: "pu-esther",
  firstName: "Esther",
  lastName: "Editor",
  email: "esther@example.org",
  role: "editor",
  isCurrentUser: false,
  removeBlockedReason: null,
  ownedCredentialNames: ["DHIS2 play"],
};
const basic: WebhookAuthMethodRow = {
  id: "wam1",
  name: "CommCare forwarder",
  authType: "basic",
  username: "commcare",
  maskedSecret: "********",
  triggers: [{ id: "t1", name: "Intake", href: "/projects/p1/w/w1?s=t1" }],
  channels: [],
};

const data = (): Omit<ProjectSettingsPageProps, `on${string}`> => ({
  project: { id: "p1", parentId: null, color: null },
  projectLabel: "openhie",
  parent: null,
  deleting: false,
  setup: {
    name: "openhie",
    description: "HIE",
    env: "main",
    concurrency: null,
    exportHref: "/download/yaml?id=p1",
    deleteHref: "/projects/p1/settings/delete",
    gracePeriodDays: 7,
    scheduledDeletion: null,
    sandboxDeletion: null,
    canEditProject: true,
    canDeleteProject: true,
  },
  credentials: {
    credentials: [],
    oauthClients: [],
    keychainCredentials: [],
    canCreateProjectCredential: true,
    canCreateKeychainCredential: true,
    canEditKeychainCredential: true,
    canCreateGlobalOauthClient: false,
  },
  collections: {
    collections: [{ id: "c1", name: "patients", byteSizeSum: 2048, downloadHref: "/download/collections/p1/patients" }],
    canManage: true,
  },
  webhookSecurity: { authMethods: [basic], canWrite: true },
  collaboration: {
    collaborators: [me, esther],
    supportAccess: false,
    canEditProject: true,
    canAddProjectUser: true,
    addBlockedReason: null,
    canReceiveFailureAlerts: true,
  },
  security: { requiresMfa: false, canEditProject: true, canRequireMfa: true },
  githubSync: {
    enabled: true,
    connection: { repo: "openfn/demo", branch: "main", githubInstallationId: "42", configPath: "./config.json", syncVersion: true },
    userConnected: true,
    connectAccountHref: "https://github.com/login/oauth/authorize",
    canInstall: true,
    canInitiateSync: true,
  },
  dataStorage: {
    historyRetentionPeriod: 30,
    dataclipRetentionPeriod: null,
    retentionPolicy: "retain_all",
    periods: [7, 30, 90],
    limitMessage: null,
    canEdit: true,
  },
  historyExports: [
    { id: "f1", insertedAt: "2026-10-09T13:20:00Z", fileName: "history.zip", requestedBy: "Amy Admin", status: "completed", downloadHref: "/project_files/f1/download" },
    { id: "f2", insertedAt: "2026-10-14T08:55:00Z", fileName: null, requestedBy: "Amy Admin", status: "in_progress", downloadHref: null },
  ],
});

function renderPage(props: Partial<ProjectSettingsPageProps> = {}, hash = "") {
  const router: Router = {
    navigate: vi.fn(),
    useHref: (to) => to,
    useLocation: () => ({ pathname: "/projects/p1/settings", search: "", hash }),
  };
  const done = () => vi.fn().mockResolvedValue(undefined);
  const handlers = {
    onSaveIdentity: done(),
    onSaveConcurrency: done(),
    onDeleteProject: done(),
    onCloseDelete: vi.fn(),
    onCreateCollection: done(),
    onRenameCollection: done(),
    onDeleteCollection: done(),
    onPreviewCollection: vi.fn().mockResolvedValue('[{"key": "patient-1"}]'),
    onCreateWebhookAuthMethod: done(),
    onRenameWebhookAuthMethod: done(),
    onDeleteWebhookAuthMethod: done(),
    onGenerateApiKey: vi.fn().mockResolvedValue("generated-api-key-0001"),
    onRevealWebhookSecret: vi.fn().mockResolvedValue("hunter22"),
    onAddCollaborators: vi.fn().mockResolvedValue({ toInvite: [] }),
    onInviteCollaborators: done(),
    onRemoveCollaborator: done(),
    onSetSupportAccess: done(),
    onSetFailureAlert: done(),
    onSetDigest: done(),
    onSetRequiresMfa: done(),
    onInitiateGithubSync: done(),
    onRemoveGithubConnection: done(),
    onSaveDataStorage: done(),
  };
  const page = (next: Partial<ProjectSettingsPageProps>) => (
    <SessionContext.Provider value={session}>
      <RouterProvider value={router}>
        <ToastProvider>
          <ProjectSettingsPage {...data()} {...handlers} {...next} />
        </ToastProvider>
      </RouterProvider>
    </SessionContext.Provider>
  );
  const { rerender } = render(page(props));
  return { ...handlers, rerender: (next: Partial<ProjectSettingsPageProps>) => rerender(page(next)) };
}

const panel = (id: string) => document.getElementById(`${id}-panel`)!;
const dialog = () => screen.getByRole("dialog");

describe("ProjectSettingsPage", () => {
  it("shows the tab the URL hash names, and Setup for any other hash", () => {
    renderPage({}, "#collaboration");
    expect(panel("collaboration").className).not.toContain("hidden");
    expect(panel("project").className).toContain("hidden");
    expect(screen.getByRole("tab", { name: "Collaboration" }).getAttribute("aria-selected")).toBe("true");
  });

  it("falls back to Setup for a hash that isn't a tab", () => {
    renderPage({}, "#nope");
    const shown = screen.getAllByRole("tabpanel", { hidden: true }).filter((p) => !p.className.includes("hidden"));
    expect(shown.map((p) => p.id)).toEqual(["project-panel"]);
  });

  it("saves Project Identity with the name as typed, and shows the host's field error", async () => {
    const onSaveIdentity = vi.fn().mockRejectedValue(new RequestError("invalid", { fieldErrors: { rawName: ["has already been taken"] } }));
    renderPage({ onSaveIdentity });
    fireEvent.change(document.getElementById("project-settings-form_raw_name")!, { target: { value: "New Name" } });
    fireEvent.submit(document.getElementById("project-settings-form")!);
    await waitFor(() => expect(onSaveIdentity).toHaveBeenCalledWith({ rawName: "New Name", description: "HIE" }));
    expect(await screen.findByText("has already been taken")).toBeTruthy();
  });

  it("links Export and Delete to the host's hrefs", () => {
    renderPage();
    expect(screen.getByRole("link", { name: "Export project" }).getAttribute("href")).toBe("/download/yaml?id=p1");
    expect(screen.getByRole("link", { name: "Delete project" }).getAttribute("href")).toBe("/projects/p1/settings/delete");
  });

  it("deletes the project once its name is typed, and closes on Cancel", async () => {
    const { onDeleteProject, onCloseDelete } = renderPage({ deleting: true });
    fireEvent.change(within(dialog()).getByLabelText(/Project name/), { target: { value: "openhie" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete project" }));
    await waitFor(() => expect(onDeleteProject).toHaveBeenCalledWith("openhie"));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Cancel" }));
    expect(onCloseDelete).toHaveBeenCalled();
  });

  it("says a project already scheduled for deletion is deleted today", () => {
    renderPage({ deleting: true, setup: { ...data().setup, scheduledDeletion: "2026-10-30T00:00:00Z" } });
    expect(dialog().textContent).toContain("along with all workflows and work order history, today.");
    expect(dialog().textContent).not.toContain("day(s) from today");
  });

  it("deletes a sandbox through the sandbox dialog, which names where the user lands", async () => {
    const { onDeleteProject } = renderPage({
      deleting: true,
      parent: { name: "openhie", settingsHref: "/projects/p0/settings" },
      setup: { ...data().setup, name: "sandbox-a", sandboxDeletion: { rootName: "openhie", descendantCount: 2 } },
    });
    expect(within(dialog()).getByRole("heading", { name: "Delete sandbox" })).toBeTruthy();
    expect(dialog().textContent).toContain("Its 2 child sandboxes will also be deleted.");
    expect(dialog().textContent).toContain("you'll be redirected to openhie");
    fireEvent.change(within(dialog()).getByLabelText(/Sandbox name/), { target: { value: "sandbox-a" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete sandbox" }));
    await waitFor(() => expect(onDeleteProject).toHaveBeenCalledWith("sandbox-a"));
  });

  it("creates a collection from the name as typed, then closes the form", async () => {
    const { onCreateCollection } = renderPage({}, "#collections");
    fireEvent.click(screen.getByRole("button", { name: "Create collection" }));
    fireEvent.change(within(dialog()).getByLabelText(/Name/), { target: { value: "My Things" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onCreateCollection).toHaveBeenCalledWith("My Things"));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("asks the host for a collection's first record before showing the preview", async () => {
    const { onPreviewCollection } = renderPage({}, "#collections");
    expect(document.getElementById("download-collection-c1-button")!.getAttribute("href")).toBe("/download/collections/p1/patients");
    fireEvent.click(document.getElementById("preview-collection-c1-button")!);
    expect(onPreviewCollection).toHaveBeenCalledWith("c1");
    expect(await screen.findByText('[{"key": "patient-1"}]')).toBeTruthy();
  });

  it("shows which preview is loading, and holds back the others until it's done", () => {
    const collections = [...data().collections.collections, { id: "c2", name: "visits", byteSizeSum: 0, downloadHref: "/download/collections/p1/visits" }];
    renderPage({ collections: { collections, canManage: true }, onPreviewCollection: vi.fn(() => new Promise<string>(() => {})) }, "#collections");
    const button = (id: string) => document.getElementById(`preview-collection-${id}-button`) as HTMLButtonElement;
    fireEvent.click(button("c1"));
    expect(button("c1").getAttribute("aria-busy")).toBe("true");
    expect(button("c2").disabled).toBe(true);
  });

  it("shows the key the host generated, and leaves the key with the host on create", async () => {
    const { onGenerateApiKey, onCreateWebhookAuthMethod } = renderPage({}, "#webhook_security");
    fireEvent.click(screen.getByRole("button", { name: "New auth method" }));
    fireEvent.click(screen.getByText(/API Key Authentication/));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Next" }));
    await waitFor(() => expect(onGenerateApiKey).toHaveBeenCalled());
    expect(((await screen.findByDisplayValue("generated-api-key-0001")) as HTMLInputElement).disabled).toBe(true);
    fireEvent.change(document.getElementById("webhook_auth_method_name")!, { target: { value: "Partner" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Create auth method" }));
    await waitFor(() =>
      expect(onCreateWebhookAuthMethod).toHaveBeenCalledWith({ authType: "api", name: "Partner" })
    );
  });

  it("shows a method's secret only after the host accepts the re-authentication", async () => {
    const onRevealWebhookSecret = vi.fn().mockRejectedValueOnce(new RequestError("Invalid! Please try again")).mockResolvedValue("hunter22");
    renderPage({ onRevealWebhookSecret }, "#webhook_security");
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    expect((document.getElementById("webhook_auth_method_password") as HTMLInputElement).value).toBe("********");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Show" }));
    fireEvent.change(document.getElementById("user_password")!, { target: { value: "wrong" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Done" }));
    expect(await within(dialog()).findByText("Invalid! Please try again")).toBeTruthy();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(onRevealWebhookSecret).toHaveBeenLastCalledWith("wam1", { password: "wrong", code: "" }));
    await waitFor(() => expect((document.getElementById("webhook_auth_method_password") as HTMLInputElement).value).toBe("hunter22"));
  });

  it("starts the re-authentication afresh after Back", async () => {
    renderPage({ onRevealWebhookSecret: vi.fn().mockRejectedValue(new RequestError("Invalid! Please try again")) }, "#webhook_security");
    fireEvent.click(screen.getByRole("button", { name: "View" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Show" }));
    fireEvent.change(document.getElementById("user_password")!, { target: { value: "wrong" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Done" }));
    expect(await within(dialog()).findByText("Invalid! Please try again")).toBeTruthy();
    fireEvent.click(within(dialog()).getByRole("button", { name: "Back" }));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Show" }));
    expect(within(dialog()).queryByText("Invalid! Please try again")).toBeNull();
    expect((document.getElementById("user_password") as HTMLInputElement).value).toBe("");
  });

  it("sends a sandbox to its parent for webhook auth methods", () => {
    renderPage({ parent: { name: "openhie", settingsHref: "/projects/p0/settings" } }, "#webhook_security");
    expect(screen.getByRole("link", { name: /Manage them in the parent project/ }).getAttribute("href")).toBe(
      "/projects/p0/settings#webhook_security"
    );
    expect(screen.queryByRole("button", { name: "New auth method" })).toBeNull();
  });

  it("adds collaborators and moves the ones without accounts on to the invite form", async () => {
    const onAddCollaborators = vi.fn().mockResolvedValue({ toInvite: [{ email: "new@example.org", role: "viewer" }] });
    renderPage({ onAddCollaborators }, "#collaboration");
    fireEvent.click(screen.getByRole("button", { name: "Add Collaborator(s)" }));
    fireEvent.change(within(dialog()).getByLabelText("Email"), { target: { value: "new@example.org" } });
    fireEvent.change(within(dialog()).getByLabelText("Role"), { target: { value: "viewer" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Save Collaborator" }));
    await waitFor(() => expect(onAddCollaborators).toHaveBeenCalledWith([{ email: "new@example.org", role: "viewer" }]));
    expect(await screen.findByText("Invite new user(s) to join OpenFn")).toBeTruthy();
    expect((within(dialog()).getByLabelText("Email") as HTMLInputElement).value).toBe("new@example.org");
  });

  it("shows the host's error on the invite row it belongs to", async () => {
    const onAddCollaborators = vi.fn().mockResolvedValue({
      toInvite: [
        { email: "new@example.org", role: "viewer" },
        { email: "taken@example.org", role: "viewer" },
      ],
    });
    const onInviteCollaborators = vi
      .fn()
      .mockRejectedValue(new RequestError("Please fix the errors below.", { fieldErrors: { "1.email": ["This email is already taken"] } }));
    renderPage({ onAddCollaborators, onInviteCollaborators }, "#collaboration");
    fireEvent.click(screen.getByRole("button", { name: "Add Collaborator(s)" }));
    fireEvent.change(within(dialog()).getByLabelText("Email"), { target: { value: "new@example.org" } });
    fireEvent.change(within(dialog()).getByLabelText("Role"), { target: { value: "viewer" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Save Collaborator" }));
    await screen.findByText("Invite new user(s) to join OpenFn");
    for (const label of ["First Name", "Last Name"]) {
      for (const input of within(dialog()).getAllByLabelText(label)) fireEvent.change(input, { target: { value: "Ann" } });
    }
    fireEvent.click(within(dialog()).getByRole("button", { name: "Invite new users" }));
    await waitFor(() => expect(onInviteCollaborators).toHaveBeenCalled());
    const [first, second] = within(dialog()).getAllByLabelText("Email").map((e) => e.closest<HTMLElement>('[data-ui="form-group"]')!);
    expect(await within(second!).findByText("This email is already taken")).toBeTruthy();
    expect(first!.textContent).not.toContain("This email is already taken");
    expect(within(dialog()).queryByText("Please fix the errors below.")).toBeNull();
  });

  it("removes a collaborator after confirming, naming their credentials, and says why others can't be", async () => {
    const { onRemoveCollaborator } = renderPage({}, "#collaboration");
    expect((document.getElementById("remove_project_user_pu-me_button") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(document.getElementById("remove_project_user_pu-esther_button")!);
    expect(dialog().textContent).toContain("their owned credential DHIS2 play will be removed from it");
    fireEvent.click(within(dialog()).getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(onRemoveCollaborator).toHaveBeenCalledWith("pu-esther"));
  });

  it("changes the viewer's own alerts, and says so when the host refuses", async () => {
    const onSetFailureAlert = vi.fn().mockRejectedValue(new RequestError("You are not authorized to perform this action."));
    const { onSetDigest } = renderPage({ onSetFailureAlert }, "#collaboration");
    expect(document.getElementById("digest-pu-esther")).toBeNull();
    fireEvent.change(document.getElementById("digest-pu-me")!, { target: { value: "daily" } });
    expect(onSetDigest).toHaveBeenCalledWith("pu-me", "daily");
    const alert = document.getElementById("failure-alert-pu-me") as HTMLSelectElement;
    fireEvent.change(alert, { target: { value: "false" } });
    expect(await screen.findByText("You are not authorized to perform this action.")).toBeTruthy();
    expect(alert.value).toBe("true");
  });

  it("shows the chosen digest while the host saves it, and puts it back if the save fails", async () => {
    let fail: (e: Error) => void = () => {};
    const onSetDigest = vi.fn(() => new Promise<void>((_, reject) => (fail = reject)));
    renderPage({ onSetDigest }, "#collaboration");
    const digest = document.getElementById("digest-pu-me") as HTMLSelectElement;
    fireEvent.change(digest, { target: { value: "daily" } });
    expect(onSetDigest).toHaveBeenCalledWith("pu-me", "daily");
    expect(digest.value).toBe("daily");
    fail(new RequestError("Error when updating the project user"));
    expect(await screen.findByText("Error when updating the project user")).toBeTruthy();
    expect(digest.value).toBe("weekly");
  });

  it("shows the MFA switch's new state at once, and puts it back if the save fails", async () => {
    let fail: (e: Error) => void = () => {};
    renderPage({ onSetRequiresMfa: vi.fn(() => new Promise<void>((_, reject) => (fail = reject))) }, "#security");
    const mfa = document.getElementById("toggle-mfa-switch")!;
    fireEvent.click(mfa);
    expect(mfa.getAttribute("aria-checked")).toBe("true");
    fail(new Error("refused"));
    await waitFor(() => expect(mfa.getAttribute("aria-checked")).toBe("false"));
  });

  it("switches MFA", () => {
    const { onSetRequiresMfa } = renderPage({}, "#security");
    fireEvent.click(document.getElementById("toggle-mfa-switch")!);
    expect(onSetRequiresMfa).toHaveBeenCalledWith(true);
  });

  it("keeps MFA read-only in a sandbox", () => {
    renderPage({ parent: { name: "openhie", settingsHref: "/projects/p0/settings" } }, "#security");
    expect((document.getElementById("toggle-mfa-switch") as HTMLButtonElement).disabled).toBe(true);
  });

  it("starts a GitHub sync and removes the connection after confirming", async () => {
    const { onInitiateGithubSync, onRemoveGithubConnection } = renderPage({}, "#vcs");
    fireEvent.click(screen.getByRole("button", { name: "Initiate Sync to Branch" }));
    expect(onInitiateGithubSync).toHaveBeenCalled();
    fireEvent.click(screen.getByText("Remove Integration."));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Disconnect" }));
    await waitFor(() => expect(onRemoveGithubConnection).toHaveBeenCalled());
  });

  it("refuses a dataclip period longer than history on Save, then saves a valid one", async () => {
    const { onSaveDataStorage } = renderPage({}, "#data-storage");
    fireEvent.change(document.getElementById("project_dataclip_retention_period")!, { target: { value: "90" } });
    fireEvent.click(document.getElementById("input-output-retention-period-submit-btn")!);
    expect(await screen.findByText("dataclip retention period must be less or equal to the history retention period")).toBeTruthy();
    expect(onSaveDataStorage).not.toHaveBeenCalled();
    fireEvent.change(document.getElementById("project_dataclip_retention_period")!, { target: { value: "7" } });
    fireEvent.click(document.getElementById("input-output-retention-period-submit-btn")!);
    await waitFor(() =>
      expect(onSaveDataStorage).toHaveBeenCalledWith({ historyRetentionPeriod: 30, dataclipRetentionPeriod: 7, retentionPolicy: "retain_all" })
    );
  });

  it("links a finished export, and holds back one still running", () => {
    renderPage({}, "#history-exports");
    expect(document.getElementById("download-export-file-f1-button")!.getAttribute("href")).toBe("/project_files/f1/download");
    expect((document.getElementById("download-export-file-f2-button") as HTMLButtonElement).disabled).toBe(true);
  });

  it("follows new props from the host", () => {
    const { rerender } = renderPage({}, "#security");
    expect(document.getElementById("toggle-mfa-switch")!.getAttribute("aria-checked")).toBe("false");
    const next = data();
    rerender({
      security: { ...next.security, requiresMfa: true },
      collaboration: { ...next.collaboration, collaborators: [me] },
    });
    expect(document.getElementById("toggle-mfa-switch")!.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("(currently required for this project)")).toBeTruthy();
    expect(document.getElementById("project_user-pu-esther")).toBeNull();
  });

  describe("without permission", () => {
    const off = (button: string) => (screen.getByRole("button", { name: button }) as HTMLButtonElement).disabled;

    it("can't create, rename or delete collections", () => {
      renderPage({ collections: { ...data().collections, canManage: false } }, "#collections");
      expect(off("Create collection")).toBe(true);
      expect((document.getElementById("edit-collection-c1-button") as HTMLButtonElement).disabled).toBe(true);
      expect((document.getElementById("delete-collection-c1-button") as HTMLButtonElement).disabled).toBe(true);
      expect((document.getElementById("preview-collection-c1-button") as HTMLButtonElement).disabled).toBe(false);
    });

    it("can't add, view or delete webhook auth methods", () => {
      renderPage({ webhookSecurity: { authMethods: [basic], canWrite: false } }, "#webhook_security");
      expect(off("New auth method")).toBe(true);
      const row = within(panel("webhook_security"));
      expect((row.getByRole("button", { name: "Edit" }) as HTMLButtonElement).disabled).toBe(true);
      expect((row.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled).toBe(true);
    });

    it("can't add collaborators, and says why", () => {
      renderPage({ collaboration: { ...data().collaboration, canAddProjectUser: false } }, "#collaboration");
      const add = screen.getByRole("button", { name: "Add Collaborator(s)" }) as HTMLButtonElement;
      expect(add.disabled).toBe(true);
      expect(add.title).toBe("You are not authorized to perform this action");
    });

    it("can't add collaborators past the plan's limit, and says so", () => {
      renderPage({ collaboration: { ...data().collaboration, addBlockedReason: "You have reached your collaborator limit." } }, "#collaboration");
      const add = screen.getByRole("button", { name: "Add Collaborator(s)" }) as HTMLButtonElement;
      expect(add.disabled).toBe(true);
      expect(add.title).toBe("You have reached your collaborator limit.");
    });

    it("can't change data storage", () => {
      renderPage({ dataStorage: { ...data().dataStorage, canEdit: false } }, "#data-storage");
      expect((document.getElementById("project_history_retention_period") as HTMLSelectElement).disabled).toBe(true);
      expect((document.getElementById("retain_all") as HTMLInputElement).disabled).toBe(true);
      expect((document.getElementById("input-output-retention-period-submit-btn") as HTMLButtonElement).disabled).toBe(true);
    });

    it("shows the plan's retention limit by the history period", () => {
      renderPage({ dataStorage: { ...data().dataStorage, limitMessage: "Upgrade for longer retention." } }, "#data-storage");
      expect(screen.getByText("Upgrade for longer retention.")).toBeTruthy();
    });

    it("can't start a GitHub sync", () => {
      renderPage({ githubSync: { ...data().githubSync, canInitiateSync: false } }, "#vcs");
      expect(off("Initiate Sync to Branch")).toBe(true);
    });

    it("can't delete the project: no danger zone, and no dialog on the delete route", () => {
      renderPage({ deleting: true, setup: { ...data().setup, canDeleteProject: false } });
      expect(screen.queryByText("The danger zone")).toBeNull();
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("can't switch MFA without edit rights, even when the plan allows it", () => {
      renderPage({ security: { requiresMfa: false, canEditProject: false, canRequireMfa: true } }, "#security");
      const mfa = document.getElementById("toggle-mfa-switch") as HTMLButtonElement;
      expect(mfa.disabled).toBe(true);
      expect(mfa.title).toBe("You do not have permission to perform this action");
    });
  });
});
