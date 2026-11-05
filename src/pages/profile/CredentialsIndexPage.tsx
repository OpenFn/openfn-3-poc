import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import Section from "@/components/primitives/Section";
import { NestedSections } from "@/components/primitives/SectionHeader";
import CredentialIndex from "@/components/credentials/CredentialIndex";
import NewCredentialMenuButton from "@/components/credentials/NewCredentialMenuButton";
import type { CredentialActions, CredentialIndexData } from "@/types/credentials";
import type { ResourceStatus } from "@/types/resource";

/**
 * The contract between this page and whatever feeds it (the replica wrapper,
 * later Lightning): the viewer's own credentials and OAuth clients, and the
 * credential index's actions. Both shapes are documented in types/credentials.ts.
 */
export interface CredentialsIndexPageProps extends CredentialIndexData, CredentialActions {
  /** While the host loads the lists, or why it couldn't (STANDARDS pattern 5). Leave it out when the data arrives with the page. */
  status?: ResourceStatus;
}

/**
 * Inventory view `credentials-index` (credential_live/index.html.heex): the
 * user's own OAuth clients and credentials, with "Add new" as the section's action.
 * Props only, so it can run unchanged in Lightning; the replica's data lives
 * in CredentialsIndexPage.replica.tsx.
 */
export default function CredentialsIndexPage({ status = { state: "ready" }, ...props }: CredentialsIndexPageProps) {
  return (
    <Section
      size="lg"
      title="Credentials"
      description="Credentials you own. Share them with any project you collaborate on."
      action={<NewCredentialMenuButton id="credential-options-menu-button" />}
    >
      {/* Lightning hard-codes can_create_project_credential here (credential_live/index.html.heex:33). */}
      <AsyncBoundary status={status}>
        <NestedSections>
          <CredentialIndex {...props} project={null} canCreateProjectCredential />
        </NestedSections>
      </AsyncBoundary>
    </Section>
  );
}
