import { useState } from "react";
import Button from "../primitives/Button";
import Card from "../primitives/Card";
import SectionHeader from "../primitives/SectionHeader";
import TextLink from "../primitives/TextLink";
import LinkedUsageModal from "./LinkedUsageModal";
import WebhookAuthMethodDeleteModal from "./WebhookAuthMethodDeleteModal";
import WebhookAuthMethodFormModal from "./WebhookAuthMethodFormModal";
import WebhookAuthMethodsTable from "./WebhookAuthMethodsTable";
import type {
  ParentProjectRef,
  ReauthValues,
  WebhookAuthMethodRow,
  WebhookAuthMethodValues,
  WebhookSecuritySettings,
} from "../../types/project-settings";

interface Props {
  webhookSecurity: WebhookSecuritySettings;
  /** Set for a sandbox: methods are managed in the parent. */
  parent: ParentProjectRef | null;
  onCreate: (values: WebhookAuthMethodValues) => Promise<void>;
  /** Renames a method: only the name of an existing method can change. */
  onRename: (id: string, name: string) => Promise<void>;
  /** Deletes a method, after the user has typed DELETE. */
  onDelete: (id: string) => Promise<void>;
  onGenerateApiKey: () => Promise<string>;
  onReveal: (id: string, values: ReauthValues) => Promise<string>;
}

type Modal =
  | { kind: "new" }
  | { kind: "edit" | "delete" | "usage"; method: WebhookAuthMethodRow }
  | null;

/** The Webhook Security tab (`#webhook_security`, settings.html.heex:378-568). */
export default function WebhookSecurityPanel({ webhookSecurity: { authMethods, canWrite }, parent, onCreate, onRename, onDelete, onGenerateApiKey, onReveal }: Props) {
  const [modal, setModal] = useState<Modal>(null);
  const close = () => setModal(null);
  const title = "Webhook security";
  const subtitle = "Webhook authentication methods that are used with the starting trigger in workflows.";

  if (parent) {
    return (
      <>
        <SectionHeader size="lg" title={title} subtitle={subtitle} />
        <Card
          id="webhook-security-sandbox-notice"
          title="Webhook authentication is managed in the parent project"
          description="Methods are shared with this sandbox and enforced on its webhook triggers, but can only be created, edited, or deleted from the parent."
        >
          <TextLink to={`${parent.settingsHref}#webhook_security`}>
            Manage them in the parent project ({parent.name})
          </TextLink>
        </Card>
      </>
    );
  }

  return (
    <>
      <SectionHeader
        size="lg"
        title={title}
        subtitle={subtitle}
        permissionsSection={canWrite ? undefined : "webhook auth methods."}
        action={
          <Button id="add_new_auth_method" size="lg" disabled={!canWrite} onClick={() => setModal({ kind: "new" })}>
            New auth method
          </Button>
        }
      />
      {(modal?.kind === "new" || modal?.kind === "edit") && (
        <WebhookAuthMethodFormModal
          authMethod={modal.kind === "edit" ? modal.method : undefined}
          onCancel={close}
          onSave={async (values) => {
            await (modal.kind === "edit" ? onRename(modal.method.id, values.name) : onCreate(values));
            close();
          }}
          onGenerateApiKey={onGenerateApiKey}
          onReveal={modal.kind === "edit" ? (values) => onReveal(modal.method.id, values) : undefined}
        />
      )}
      {modal?.kind === "delete" && (
        <WebhookAuthMethodDeleteModal
          authMethod={modal.method}
          onCancel={close}
          onDelete={async () => {
            await onDelete(modal.method.id);
            close();
          }}
        />
      )}
      {modal?.kind === "usage" && <LinkedUsageModal authMethod={modal.method} onClose={close} />}
      <WebhookAuthMethodsTable
        authMethods={authMethods}
        canWrite={canWrite}
        onCreate={() => setModal({ kind: "new" })}
        onView={(method) => setModal({ kind: "edit", method })}
        onDelete={(method) => setModal({ kind: "delete", method })}
        onShowUsage={(method) => setModal({ kind: "usage", method })}
      />
    </>
  );
}
