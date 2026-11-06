import { Navigate, useLocation } from "react-router-dom";
import { useAuthProvider, useAuthProviderSaves } from "@/api/authProvider";
import { combinedStatus } from "@/api/client";
import { useInstanceUrl } from "@/api/session";
import AdminAuthProvidersPage from "./AdminAuthProvidersPage";

const EDIT = "/settings/authentication";
const NEW = "/settings/authentication/new";

/**
 * AdminAuthProvidersPage's query: the provider and the instance's URL from the
 * API, and the saves. Once loaded, /settings/authentication with no provider
 * goes to /new, and /new with one comes back.
 */
export default function AdminAuthProvidersPageQuery() {
  const { pathname } = useLocation();
  const { status, provider } = useAuthProvider();
  const instance = useInstanceUrl();
  const { save, remove } = useAuthProviderSaves();

  const target = provider ? EDIT : NEW;
  return (
    <>
      {/* Next to the page, not instead of it, so the page and its focus stay through a create or a remove. */}
      {status.state === "ready" && pathname !== target && <Navigate to={target} replace />}
      <AdminAuthProvidersPage
        status={combinedStatus(status, instance.status)}
        provider={provider}
        instanceUrl={instance.url}
        onSave={save}
        onRemove={remove}
      />
    </>
  );
}
