import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SessionContext, type Session } from "../../session/session";
import type { Credential } from "../../types/credentials";
import CredentialFormModal from "./CredentialFormModal";

const session: Session = {
  user: {
    id: "u1",
    firstName: "Amy",
    lastName: "Admin",
    email: "amy@example.org",
    role: "user",
    confirmedAt: "2026-01-01T00:00:00Z",
    insertedAt: "2026-01-01T00:00:00Z",
    mfaEnabled: false,
    githubConnected: false,
    experimentalFeatures: false,
    supportUser: false,
    disabled: false,
    scheduledDeletion: null,
    contactPreference: "critical",
  },
  instance: { adminEmail: "admin@example.org", releaseLabel: "v2" },
};

const credential: Credential = {
  id: "cred-1",
  name: "HAPI FHIR",
  schema: "raw",
  ownerId: session.user.id,
  projectIds: [],
  externalId: null,
  environments: ["main", "staging"],
  transferStatus: null,
  scheduledDeletion: null,
};

describe("CredentialFormModal", () => {
  it("asks before deleting an environment, and keeps it on Cancel", async () => {
    render(
      <SessionContext.Provider value={session}>
        <CredentialFormModal open onClose={() => {}} credential={credential} oauthClients={[]} />
      </SessionContext.Provider>
    );
    const envTabs = () => screen.getAllByRole("tab").map((t) => t.textContent);
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
    render(
      <SessionContext.Provider value={session}>
        <CredentialFormModal open onClose={onClose} onSave={onSave} credential={credential} oauthClients={[]} />
      </SessionContext.Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete environment" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual(["staging"]));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });
});
