import Button from "../primitives/Button";
import type { SsoProvider } from "../../types/auth";

/**
 * The "or / via external provider" block under the login button, shown when
 * an OIDC auth provider is configured (Lightning's `@auth_handler_url`).
 */
export default function SsoLogin({ provider }: { provider: SsoProvider }) {
  return (
    <>
      <div className="flex items-center gap-2 text-xs text-body">
        <hr className="flex-1 border-subtle" />
        or
        <hr className="flex-1 border-subtle" />
      </div>
      <Button variant="secondary" href={provider.handlerUrl} tooltip={provider.name} className="w-full" icon="hero-identification">
        via external provider
      </Button>
    </>
  );
}
