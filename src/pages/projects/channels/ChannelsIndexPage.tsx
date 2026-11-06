import { useRef, useState } from "react";
import Button from "@/components/primitives/Button";
import ConfirmModal from "@/components/primitives/ConfirmModal";
import ListPage from "@/components/patterns/ListPage";
import { useToast } from "@/components/primitives/Toast";
import ProjectBreadcrumbs from "@/components/shell/ProjectBreadcrumbs";
import ChannelFormModal from "@/components/projects/channels/ChannelFormModal";
import ChannelsTable from "@/components/projects/channels/ChannelsTable";
import type { ChannelFormValues, ChannelRow } from "@/types/channels";
import type { CurrentProject } from "@/types/projects";
import type { ResourceStatus } from "@/types/resource";

/** What its .query file passes in: data, where the form stands, the links, and the actions that change it. */
export interface ChannelsIndexPageProps {
  /** The project the channels are in, for the breadcrumbs. */
  project: CurrentProject;
  /** The picker's label, "parent/child" for a sandbox. */
  projectLabel: string;
  /** Where loading the channels stands. Left out, they are ready. */
  status?: ResourceStatus;
  /** The project's channels, by name. */
  channels: ChannelRow[];
  /** Whether New channel is on; off, it says why. */
  canCreateChannel: boolean;
  /** Whether each row has its switch and Edit; without it, Enabled is words. */
  canEditChannel: boolean;
  /** Whether each row has Delete. */
  canDeleteChannel: boolean;
  /** Where New channel goes; it opens the form over the list. */
  createHref: string;
  /** Where a channel's Edit goes; it opens the form over the list. */
  editHref: (id: string) => string;
  /** A channel's request logs, which its Requests and Last activity link to. */
  logsHref: (id: string) => string;
  /** Project settings' credentials, for the form's "Add new". */
  credentialsSettingsHref: string;
  /** Project settings' webhook security, for the form's "Add new". */
  webhookSecuritySettingsHref: string;
  /** Whether the New channel form is open. */
  creating: boolean;
  /** The channel whose Edit form is open, or null. The form opens once it's among `channels`. */
  editingId: string | null;
  /** The project's credentials, as [name, id], loaded while the form is open. */
  credentialOptions: [label: string, value: string][];
  /** The project's webhook auth methods, as [name, id], loaded while the form is open. */
  authMethodOptions: [label: string, value: string][];
  /** Where loading the form's options stands; the form waits for them, the list doesn't. Left out, they are ready. */
  optionsStatus?: ResourceStatus;
  /** Closes the form, back to the list. */
  onClose: () => void;
  /** Creates a channel. Rejects with field errors keyed as the API keys them, or a message. */
  onCreate: (values: ChannelFormValues) => Promise<void>;
  /** Saves the channel with `changes` over what it has: the whole form, or the switch's `enabled`. */
  onUpdate: (channel: ChannelRow, changes: Partial<ChannelFormValues>) => Promise<void>;
  /** Deletes a channel and its request history. */
  onDelete: (id: string) => Promise<void>;
}

/**
 * Inventory view `channels-index` (ChannelLive.Index): the project's
 * channels, each switched on or off in place, with the New / Edit channel
 * form over the list and Delete behind a dialog.
 */
export default function ChannelsIndexPage({
  project,
  projectLabel,
  status,
  channels,
  canCreateChannel,
  canEditChannel,
  canDeleteChannel,
  createHref,
  editHref,
  logsHref,
  credentialsSettingsHref,
  webhookSecuritySettingsHref,
  creating,
  editingId,
  credentialOptions,
  authMethodOptions,
  optionsStatus,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: ChannelsIndexPageProps) {
  const toast = useToast();
  // Where focus goes once a deleted channel's row, and its Delete, are gone.
  const newChannel = useRef<HTMLAnchorElement | HTMLButtonElement>(null);
  const editing = channels.find((c) => c.id === editingId);
  // Looked up each render, so a channel deleted elsewhere closes its dialog.
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleting = channels.find((c) => c.id === deletingId);

  return (
    <ListPage
      title="Channels"
      showCount
      breadcrumbs={<ProjectBreadcrumbs project={project} label={projectLabel} current="Channels" />}
      description="Reads, writes and events on other systems, each with its own endpoint."
      actions={
        <Button
          ref={newChannel}
          id="new-channel-button"
          icon="hero-plus"
          to={createHref}
          disabled={!canCreateChannel}
          tooltip={canCreateChannel ? undefined : "You are not authorized to perform this action."}
        >
          New channel
        </Button>
      }
      status={status}
      itemCount={channels.length}
      empty={{ icon: "hero-arrows-right-left", message: "No channels yet." }}
      list={
        <ChannelsTable
          channels={channels}
          canEdit={canEditChannel}
          canDelete={canDeleteChannel}
          editHref={editHref}
          logsHref={logsHref}
          onToggle={(channel, enabled) => onUpdate(channel, { enabled })}
          onDelete={setDeletingId}
        />
      }
    >
      {deleting && (
        <ConfirmModal
          key={deleting.id}
          open
          onClose={() => setDeletingId(null)}
          onConfirm={async () => {
            await onDelete(deleting.id);
            toast("Channel deleted.");
            requestAnimationFrame(() => newChannel.current?.focus());
            setDeletingId(null);
          }}
          title={`Delete ${deleting.name}?`}
          confirmLabel="Delete channel"
          tone="danger"
        >
          <p>
            Requests to it stop being forwarded straight away, and its address stops working. Workflows that call it will fail at that step. Its
            request history is deleted too.
          </p>
        </ConfirmModal>
      )}
      {(creating || editing) && (
        <ChannelFormModal
          key={editing?.id ?? "new"}
          channel={editing}
          credentialOptions={credentialOptions}
          authMethodOptions={authMethodOptions}
          status={optionsStatus}
          credentialsSettingsHref={credentialsSettingsHref}
          webhookSecuritySettingsHref={webhookSecuritySettingsHref}
          onCancel={onClose}
          onSave={async (values, opened) => {
            if (opened) await onUpdate(opened, values);
            else await onCreate(values);
            onClose();
            toast(opened ? "Channel updated successfully." : `Created ${values.name}.`);
          }}
        />
      )}
    </ListPage>
  );
}
