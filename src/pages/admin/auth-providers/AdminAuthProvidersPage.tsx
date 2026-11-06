import Alert from "@/components/primitives/Alert";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import Header from "@/components/primitives/Header";
import { Centered, PageContent } from "@/components/primitives/PageContent";
import { Stack } from "@/components/primitives/Stack";
import { useToast } from "@/components/primitives/Toast";
import AuthProviderForm from "@/components/admin/AuthProviderForm";
import type { AuthProvider, AuthProviderValues } from "@/types/admin";
import type { ResourceStatus } from "@/types/resource";

/** What its .query file passes in: data and the actions that change it. */
export interface AdminAuthProvidersPageProps {
  /** Where loading the provider stands, when the host loads it after the page renders. Left out, it is ready. */
  status?: ResourceStatus;
  /** The instance's provider, or null when none is set up. */
  provider: AuthProvider | null;
  /** The instance's own base URL, which the redirect URI starts with. */
  instanceUrl: string;
  /** Sets up or replaces the provider. Resolves once the provider has reloaded; rejects with field errors (`name`, `discovery_url`, …) or a message. */
  onSave: (values: AuthProviderValues) => Promise<void>;
  /** Removes the provider, which turns off single sign-on. Resolves once it has reloaded; rejects with the server's message. */
  onRemove: () => Promise<void>;
}

/**
 * Inventory view `admin-auth-providers` (AuthProvidersLive.Index): the
 * instance's OpenID Connect provider, set up, changed or removed. Its toasts
 * are Lightning's flash words.
 */
export default function AdminAuthProvidersPage({ status = { state: "ready" }, provider, instanceUrl, onSave, onRemove }: AdminAuthProvidersPageProps) {
  const toast = useToast();

  return (
    <PageContent
      header={
        <Header
          title="Authentication"
          description="Single sign-on through an OpenID Connect provider. People with an account here can log in with the external account that has the same email address."
        />
      }
    >
      <Centered>
        <AsyncBoundary status={status}>
          <Stack gap="lg" className="md:w-2/3">
            {!provider && (
              <Alert tone="info" header="No provider set up">
                Everyone logs in with their email and password. Fill in the form below to add single sign-on.
              </Alert>
            )}
            <AuthProviderForm
              provider={provider}
              instanceUrl={instanceUrl}
              onSave={async (values) => {
                await onSave(values);
                toast(provider ? "Authentication Provider updated." : "Authentication Provider created.");
              }}
              onRemove={async () => {
                await onRemove();
                toast("Authentication Provider removed");
              }}
            />
          </Stack>
        </AsyncBoundary>
      </Centered>
    </PageContent>
  );
}
