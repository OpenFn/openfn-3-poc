import Heading from "../Heading";
import Modal from "../Modal";
import TextLink from "../TextLink";
import type { WebhookAuthMethodRow, WebhookUsageRef } from "../../types/project-settings";

/**
 * The workflow triggers or channels an auth method protects, as a bulleted
 * list of links (channels by name, as Lightning sorts them). Shared with
 * WebhookAuthMethodDeleteModal.
 */
export function UsageLinks({ refs, sort = false }: { refs: WebhookUsageRef[]; sort?: boolean }) {
  const links = sort ? [...refs].sort((a, b) => a.name.localeCompare(b.name)) : refs;
  return (
    <ul className="list-disc space-y-1 pl-5">
      {links.map((l) => (
        <li key={l.id}>
          <TextLink to={l.href}>{l.name}</TextLink>
        </li>
      ))}
    </ul>
  );
}

interface Props {
  authMethod: WebhookAuthMethodRow;
  onClose: () => void;
}

/** `linked_usage_for_webhook_auth_method_modal` (workflow_live/components.ex). */
export default function LinkedUsageModal({ authMethod, onClose }: Props) {
  const { triggers, channels } = authMethod;
  return (
    <Modal open onClose={onClose} title="Associated Triggers & Channels">
      <div className="space-y-6">
        <p>
          The "<span className="font-semibold">{authMethod.name}</span>" authentication method is used by:
        </p>
        {triggers.length > 0 && (
          <section className="space-y-2">
            <Heading size="sm">Workflow triggers ({triggers.length})</Heading>
            <UsageLinks refs={triggers} />
          </section>
        )}
        {channels.length > 0 && (
          <section className="space-y-2">
            <Heading size="sm">Channels ({channels.length})</Heading>
            <UsageLinks refs={channels} sort />
          </section>
        )}
      </div>
    </Modal>
  );
}
