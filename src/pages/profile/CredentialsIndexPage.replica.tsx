import { useState } from "react";
import { useToast } from "../../components/Toast";
import { credentialIndexDataFor, credentialsFixture, type CredentialsFixture } from "../../mock-data/credentials";
import { useCurrentUser } from "../../session/session";
import { credentialReplicaActions } from "./credentialsReplica";
import CredentialsIndexPage from "./CredentialsIndexPage";

/**
 * The replica's side of CredentialsIndexPage: the credentials, clients and
 * secrets held in state as the server would, the actions, and the success
 * toasts (Lightning's flashes). Lightning replaces this file with a LiveView
 * wrapper; CredentialsIndexPage stays as it is.
 */
export default function CredentialsIndexPageReplica() {
  const viewer = useCurrentUser();
  const toast = useToast();
  const [fixture, setFixture] = useState<CredentialsFixture>(credentialsFixture);
  const update = (change: (f: CredentialsFixture) => Partial<CredentialsFixture>) => setFixture((f) => ({ ...f, ...change(f) }));

  return (
    <CredentialsIndexPage
      {...credentialIndexDataFor(fixture, undefined, viewer)}
      {...credentialReplicaActions(fixture, update, viewer, toast)}
    />
  );
}
