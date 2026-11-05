import { useCredentialSaves, useCredentials, useCredentialSchemas } from "@/api/credentials";
import { useOauthClients, useOauthClientSaves } from "@/api/oauthClients";
import { useProjectTree } from "@/api/projects";
import { useCurrentUser, usePermissions } from "@/session/session";
import CredentialsIndexPage from "./CredentialsIndexPage";

/**
 * CredentialsIndexPage's .query file: loads the viewer's credentials and
 * OAuth clients from the API and passes the saves down. The dialogs and the
 * notices are the page's.
 */
export default function CredentialsIndexPageQuery() {
  const user = useCurrentUser();
  const { canCreateGlobalOauthClient } = usePermissions();
  // Lightning offers the projects you're a member of, never a sandbox: sandboxes get a share through their parent.
  const projects = useProjectTree().projects.filter((p) => !p.isSandbox).map((p) => ({ id: p.id, name: p.name }));
  const { status, credentials } = useCredentials(user.email);
  const { status: oauthClientsStatus, oauthClients } = useOauthClients(user, projects);
  const { credentialTypes, loadSchema } = useCredentialSchemas();
  const saves = useCredentialSaves();
  const clientSaves = useOauthClientSaves();

  return (
    <CredentialsIndexPage
      status={status}
      oauthClientsStatus={oauthClientsStatus}
      credentials={credentials}
      oauthClients={oauthClients}
      projects={projects}
      credentialTypes={credentialTypes}
      canCreateGlobalOauthClient={canCreateGlobalOauthClient}
      onCreateCredential={saves.create}
      onUpdateCredential={saves.update}
      onLoadCredentialSchema={loadSchema}
      onDeleteCredential={saves.remove}
      onCancelCredentialDeletion={saves.cancelDeletion}
      onTransferCredential={saves.transfer}
      onRevokeCredentialTransfer={saves.revokeTransfer}
      onCreateOauthClient={clientSaves.create}
      onUpdateOauthClient={clientSaves.update}
      onDeleteOauthClient={clientSaves.remove}
    />
  );
}
