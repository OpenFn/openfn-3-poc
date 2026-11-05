import type { ReactNode } from "react";
import Section from "@/components/primitives/Section";
import InfoTooltip from "@/components/primitives/InfoTooltip";
import Pill from "@/components/primitives/Pill";
import CopyChip from "@/components/primitives/CopyChip";
import { Row } from "@/components/primitives/Stack";
import { Table, Td, Th, Tr, Truncated } from "@/components/primitives/Table";
import type { CredentialRow, KeychainCredentialRow, OauthClientRow } from "@/types/credentials";
import Tooltip from "@/components/primitives/Tooltip";
import { formatCredentialType } from "@/utils/format";

/**
 * The three tables of the credential index (live/components/data_tables.ex):
 * a plain title, then either the table or the empty state passed in.
 */

function ProjectBadges({ names }: { names: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {names.map((name) => (
        <Pill key={name} color="indigo" variant="square">
          {name}
        </Pill>
      ))}
    </div>
  );
}

interface TableProps<T> {
  rows: T[];
  showOwner?: boolean;
  /** Rendered instead of the table when there are no rows. */
  emptyState: ReactNode;
  /** Last-column content per row (the Actions dropdown). */
  actions?: (row: T) => ReactNode;
}

export function OauthClientsTable({ rows, showOwner = false, emptyState, actions }: TableProps<OauthClientRow>) {
  return (
    <Section id="oauth-clients-table-container" title="OAuth Clients">
      {rows.length === 0 ? (
        emptyState
      ) : (
        <Table
          id="oauth-clients-table"
          header={
            <Tr>
              <Th>Name</Th>
              {showOwner && <Th>Owner</Th>}
              <Th>Projects With Access</Th>
              <Th>Authorization URL</Th>
              <Th actions />
            </Tr>
          }
        >
          {rows.map((client) => (
            <Tr key={client.id} id={`oauth-clients-${client.id}`}>
              <Td truncate maxWidth={60}>{client.name}</Td>
              {showOwner && <Td truncate maxWidth={60}>{client.global ? "GLOBAL" : client.ownerEmail}</Td>}
              <Td wrap maxWidth={80}>
                <ProjectBadges names={client.global ? ["GLOBAL"] : client.projects.map((p) => p.name)} />
              </Td>
              <Td wrap maxWidth={72}>{client.authorizationEndpoint}</Td>
              <Td actions>{actions?.(client)}</Td>
            </Tr>
          ))}
        </Table>
      )}
    </Section>
  );
}

export function CredentialsTable({ rows, showOwner = false, emptyState, actions }: TableProps<CredentialRow>) {
  return (
    <Section id="credentials-table-container" title="Credentials">
      {rows.length === 0 ? (
        emptyState
      ) : (
        <Table
          id="credentials-table"
          header={
            <Tr>
              <Th>Name</Th>
              <Th>Type</Th>
              {showOwner && <Th>Owner</Th>}
              <Th>Projects with access</Th>
              <Th>External ID</Th>
              <Th>Environments</Th>
              <Th actions />
            </Tr>
          }
        >
          {rows.map((credential) => (
            <Tr key={credential.id} id={`credentials-${credential.id}`}>
              <Td>
                {/* Only the name is cut off, so a long one can't push the warning out of sight. */}
                <Row gap="sm" className="max-w-60">
                  <Truncated className="min-w-0">{credential.name}</Truncated>
                  {credential.schema === "oauth" && !credential.oauthClient && (
                    <InfoTooltip title="OAuth client not found" icon="hero-exclamation-triangle" iconClass="h-5 w-5" />
                  )}
                </Row>
              </Td>
              <Td truncate maxWidth={40}>{formatCredentialType(credential)}</Td>
              {showOwner && <Td truncate maxWidth={60}>{credential.ownerEmail}</Td>}
              <Td wrap maxWidth={100}>
                <ProjectBadges names={credential.projects.map((p) => p.name)} />
              </Td>
              <Td truncate maxWidth={48}>
                {credential.externalId ? <CopyChip value={credential.externalId} /> : <span className="text-faint">-</span>}
              </Td>
              <Td>
                <Tooltip content={credential.environments.join(", ")}>
                  <span>{credential.environments.length}</span>
                </Tooltip>
              </Td>
              <Td actions>{actions?.(credential)}</Td>
            </Tr>
          ))}
        </Table>
      )}
    </Section>
  );
}

export function KeychainCredentialsTable({ rows, showOwner = true, emptyState, actions }: TableProps<KeychainCredentialRow>) {
  return (
    <Section id="keychain-credentials-table-container" title="Keychain Credentials">
      {rows.length === 0 ? (
        emptyState
      ) : (
        <Table
          id="keychain-credentials-table"
          header={
            <Tr>
              <Th>Name</Th>
              <Th>Path</Th>
              <Th>Default Credential</Th>
              {showOwner && <Th>Owner</Th>}
              <Th actions />
            </Tr>
          }
        >
          {rows.map((kc) => (
            <Tr key={kc.id} id={`keychain-credentials-${kc.id}`}>
              <Td truncate maxWidth={60}>{kc.name}</Td>
              <Td truncate maxWidth={100}>
                <CopyChip value={kc.path} />
              </Td>
              <Td truncate maxWidth={60}>
                {kc.defaultCredential ? kc.defaultCredential.name : <span className="text-faint">None</span>}
              </Td>
              {showOwner && <Td truncate maxWidth={60}>{kc.ownerEmail}</Td>}
              <Td actions>{actions?.(kc)}</Td>
            </Tr>
          ))}
        </Table>
      )}
    </Section>
  );
}
