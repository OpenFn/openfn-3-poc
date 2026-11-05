import { firstNotReady } from "@/api/client";
import { useCredentialSaves, useCredentials, useCredentialSchemas } from "@/api/credentials";
import { useOauthClients, useOauthClientSaves } from "@/api/oauthClients";
import { useShareableProjects } from "@/api/projects";
import { useCurrentUser, usePermissions } from "@/session/session";
import CredentialsIndexPage from "./CredentialsIndexPage";

export default function CredentialsIndexPageQuery() {
  const user = useCurrentUser();
  const { canCreateGlobalOauthClient } = usePermissions();
  // The forms share with these, so the sections wait for them too.
  const { status: projectsStatus, projects } = useShareableProjects();
  const { status, credentials } = useCredentials(user.email);
  const { status: oauthClientsStatus, oauthClients } = useOauthClients(user);
  const { credentialTypes, loadSchema } = useCredentialSchemas();
  const saves = useCredentialSaves();
  const clientSaves = useOauthClientSaves();

  return (
    <CredentialsIndexPage
      status={firstNotReady(status, projectsStatus)}
      oauthClientsStatus={firstNotReady(oauthClientsStatus, projectsStatus)}
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
