import { useRef, useState } from "react";
import Alert from "@/components/primitives/Alert";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import Button from "@/components/primitives/Button";
import ConfirmModal from "@/components/primitives/ConfirmModal";
import EmptyState from "@/components/primitives/EmptyState";
import Section from "@/components/primitives/Section";
import { Stack } from "@/components/primitives/Stack";
import CredentialDeletionModal from "@/components/credentials/CredentialDeletionModal";
import CredentialFormModal from "@/components/credentials/CredentialFormModal";
import OauthClientFormModal from "@/components/credentials/OauthClientFormModal";
import OwnedCredentialsTable from "@/components/credentials/OwnedCredentialsTable";
import OwnedOauthClientsTable from "@/components/credentials/OwnedOauthClientsTable";
import TransferCredentialModal from "@/components/credentials/TransferCredentialModal";
import type {
  CredentialActions,
  CredentialProjectRef,
  CredentialRow,
  CredentialSchemaResult,
  CredentialTypeOption,
  OauthClientRow,
} from "@/types/credentials";
import type { ResourceStatus } from "@/types/resource";
import { useActions } from "@/utils/useAction";
import { useNotice } from "@/utils/useNotice";
import { refuseUnsaved } from "./refuseUnsaved";

/** What its .query file passes in: the viewer's credentials and OAuth clients, and the actions that change them. */
export interface CredentialsIndexPageProps
  extends Pick<
    CredentialActions,
    | "onCreateCredential"
    | "onUpdateCredential"
    | "onLoadCredentialSchema"
    | "onDeleteCredential"
    | "onCancelCredentialDeletion"
    | "onTransferCredential"
    | "onRevokeCredentialTransfer"
    | "onCreateOauthClient"
    | "onUpdateOauthClient"
    | "onDeleteOauthClient"
  > {
  /** Where loading the credentials stands. Left out, they are ready. */
  status?: ResourceStatus;
  /** Where loading the OAuth clients stands. Left out, they are ready. */
  oauthClientsStatus?: ResourceStatus;
  /** The viewer's own credentials, by name. */
  credentials: CredentialRow[];
  /** The viewer's own OAuth clients and the global ones, by name. */
  oauthClients: OauthClientRow[];
  /** Projects the viewer can share a credential or client with. */
  projects: CredentialProjectRef[];
  /** The adaptor types "New credential" offers, besides Raw JSON. */
  credentialTypes: CredentialTypeOption[];
  /** Superusers may make an OAuth client global. */
  canCreateGlobalOauthClient: boolean;
}

type Dialog =
  | { kind: "new-credential" | "new-oauth" }
  | { kind: "edit-credential"; id: string; schema: CredentialSchemaResult | undefined }
  | { kind: "transfer" | "delete-credential" | "edit-oauth" | "delete-oauth"; id: string };

// Signing in to a provider isn't on the API yet, so the form offers no OAuth types and starts no sign-in.
const withoutOauth = {
  oauthClients: [],
  oauthSignIns: [],
  onAuthorizeOauth: () => Promise.reject(new Error("OAuth credentials can't be added here yet.")),
  onDiscardOauthSignIns: async () => {},
};

type SectionKey = "credentials" | "oauth";

/**
 * Inventory view `credentials-index`: the credentials you own and your OAuth
 * clients, each in its own table with a menu per row. A result shows above
 * the table it changed. Saved secrets never reach the page, so editing
 * starts with them blank and a blank one keeps what's saved.
 */
export default function CredentialsIndexPage({
  status = { state: "ready" },
  oauthClientsStatus = { state: "ready" },
  credentials,
  oauthClients,
  projects,
  credentialTypes,
  canCreateGlobalOauthClient,
  ...on
}: CredentialsIndexPageProps) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const { notice, say } = useNotice<SectionKey>();
  const noticeIn = (where: SectionKey) =>
    notice?.where === where && (
      <Alert key={notice.key} tone={notice.tone}>
        {notice.message}
      </Alert>
    );
  // Where focus goes when the row it came from is gone.
  const newCredentialButton = useRef<HTMLButtonElement>(null);
  const newClientButton = useRef<HTMLButtonElement>(null);
  const close = () => setDialog(null);
  const done = (section: SectionKey, message: string, { rowGone = false } = {}) => {
    setDialog(null);
    say(section, "success", message);
    if (rowGone) requestAnimationFrame(() => (section === "credentials" ? newCredentialButton : newClientButton).current?.focus());
  };
  // Edit (loading the adaptor's fields) and Cancel deletion wait on the server with the row's menu spinning.
  const rowAction = useActions((_id: string, run: () => Promise<void>) => run(), {
    onError: (error) => say("credentials", "danger", error.message),
  });

  const editCredential = (c: CredentialRow) => {
    if (c.schema === "oauth") return say("credentials", "info", "OAuth credentials can't be edited here yet.");
    void rowAction.run(c.id, async () => {
      const loaded = c.schema === "raw" ? undefined : await on.onLoadCredentialSchema(c.schema);
      // A blank field keeps what's saved, so none is required.
      const schema = loaded && { fields: loaded.fields.map((f) => ({ ...f, required: false, placeholder: "Saved. Leave blank to keep it." })) };
      // Unless another dialog opened while the fields loaded.
      setDialog((open) => open ?? { kind: "edit-credential", id: c.id, schema });
    });
  };
  const cancelDeletion = (c: CredentialRow) =>
    rowAction.run(c.id, async () => {
      await on.onCancelCredentialDeletion(c.id);
      say("credentials", "success", "Credential deletion canceled");
    });

  const id = dialog && "id" in dialog ? dialog.id : null;
  const credential = credentials.find((c) => c.id === id);
  const client = oauthClients.find((c) => c.id === id);
  const credentialForm = { ...withoutOauth, credentialTypes, projects, onLoadCredentialSchema: on.onLoadCredentialSchema, onClose: close };

  return (
    <Stack gap="lg">
      <Section
        size="lg"
        title="Credentials"
        description="Credentials you own. Share them with any project you collaborate on."
        action={
          <Button ref={newCredentialButton} icon="hero-plus" onClick={() => setDialog({ kind: "new-credential" })}>
            New credential
          </Button>
        }
      >
        <Stack gap="md">
          {noticeIn("credentials")}
          <AsyncBoundary status={status}>
            {credentials.length ? (
              <OwnedCredentialsTable
                credentials={credentials}
                isPending={rowAction.pending}
                onEdit={editCredential}
                onTransfer={(c) => setDialog({ kind: "transfer", id: c.id })}
                onCancelDeletion={cancelDeletion}
                onDelete={(c) => setDialog({ kind: "delete-credential", id: c.id })}
              />
            ) : (
              <EmptyState icon="hero-key" title="No credentials yet" message="Credentials hold the logins and keys your workflows use to reach other systems." />
            )}
          </AsyncBoundary>
        </Stack>
      </Section>

      <Section
        size="lg"
        title="OAuth clients"
        description="Apps registered with external systems so credentials can sign in with OAuth."
        action={
          <Button ref={newClientButton} variant="secondary" icon="hero-plus" onClick={() => setDialog({ kind: "new-oauth" })}>
            New OAuth client
          </Button>
        }
      >
        <Stack gap="md">
          {noticeIn("oauth")}
          <AsyncBoundary status={oauthClientsStatus}>
            {oauthClients.length ? (
              <OwnedOauthClientsTable
                clients={oauthClients}
                onEdit={(c) => setDialog({ kind: "edit-oauth", id: c.id })}
                onDelete={(c) => setDialog({ kind: "delete-oauth", id: c.id })}
              />
            ) : (
              <EmptyState icon="hero-window" title="No OAuth clients yet" message="Register an app to let credentials sign in with OAuth." />
            )}
          </AsyncBoundary>
        </Stack>
      </Section>

      {dialog?.kind === "new-credential" && (
        <CredentialFormModal
          open
          {...credentialForm}
          onSave={async (values) => {
            refuseUnsaved(values, undefined);
            await on.onCreateCredential(values);
            done("credentials", "Credential created successfully");
          }}
        />
      )}
      {dialog?.kind === "edit-credential" && credential && (
        <CredentialFormModal
          open
          {...credentialForm}
          credential={credential}
          secrets={{ environments: credential.environments.map((name) => ({ name, body: "{}", oauth: null })) }}
          schema={dialog.schema}
          onSave={async (values) => {
            refuseUnsaved(values, credential);
            await on.onUpdateCredential(credential.id, values);
            done("credentials", "Credential updated successfully");
          }}
        />
      )}
      {dialog?.kind === "transfer" && credential && (
        <TransferCredentialModal
          open
          onClose={close}
          credential={credential}
          onTransfer={async (email) => {
            await on.onTransferCredential(credential.id, email);
            done("credentials", "Credential transfer initiated. We've sent you a confirmation email.");
          }}
          onRevoke={async () => {
            await on.onRevokeCredentialTransfer(credential.id);
            done("credentials", "Transfer revoked successfully");
          }}
        />
      )}
      {dialog?.kind === "delete-credential" && credential && (
        <CredentialDeletionModal
          key={credential.id}
          onClose={close}
          credential={credential}
          onDelete={async (intent) => {
            await on.onDeleteCredential(credential.id, intent);
            done("credentials", intent.now ? `"${credential.name}" deleted` : "Credential scheduled for deletion", { rowGone: intent.now });
          }}
        />
      )}
      {(dialog?.kind === "new-oauth" || (dialog?.kind === "edit-oauth" && client)) && (
        <OauthClientFormModal
          open
          onClose={close}
          client={client}
          projects={projects}
          allowGlobal={canCreateGlobalOauthClient}
          onSave={async (values) => {
            await (client ? on.onUpdateOauthClient(client.id, values) : on.onCreateOauthClient(values));
            done("oauth", client ? "OAuth client updated successfully" : "OAuth client created successfully");
          }}
        />
      )}
      {dialog?.kind === "delete-oauth" && client && (
        <ConfirmModal
          open
          title="Delete OAuth client"
          tone="danger"
          confirmLabel="Delete OAuth client"
          onClose={close}
          onConfirm={async () => {
            await on.onDeleteOauthClient(client.id);
            done("oauth", `"${client.name}" deleted`, { rowGone: true });
          }}
        >
          <p>
            You are about to delete the OAuth client "{client.name}", which may be used in other projects. All steps that depend on this client will
            fail.
          </p>
          <p>Do you want to proceed?</p>
        </ConfirmModal>
      )}
    </Stack>
  );
}
