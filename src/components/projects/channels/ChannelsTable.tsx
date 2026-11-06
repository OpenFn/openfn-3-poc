import { useState } from "react";
import type { ChannelRow } from "@/types/channels";
import { errorMessage } from "@/utils/errors";
import { useChosenValue } from "@/utils/useChosenValue";
import Button from "@/components/primitives/Button";
import { Table, Td, Th, Tr } from "@/components/primitives/Table";
import Toggle from "@/components/primitives/Toggle";
import DateTime from "@/components/primitives/DateTime";
import Text from "@/components/primitives/Text";
import TextLink from "@/components/primitives/TextLink";
import { useToast } from "@/components/primitives/Toast";
import ProxyUrlCopy from "./ProxyUrlCopy";

/**
 * The channels table (ChannelLive.Index `channels_table`): name, destination
 * with the copyable proxy URL under it, request count and last activity
 * (both link to the channel's logs), the Enabled switch, and Edit / Delete.
 * Without `canEdit`, Enabled is words and Edit is hidden; without
 * `canDelete`, Delete is hidden, as Lightning hides them.
 */
export default function ChannelsTable({
  channels,
  canEdit,
  canDelete,
  editHref,
  logsHref,
  onToggle,
  onDelete,
}: {
  channels: ChannelRow[];
  /** Whether each row has its switch and Edit; without it, Enabled is words. */
  canEdit: boolean;
  /** Whether each row has Delete. */
  canDelete: boolean;
  /** Where a channel's Edit goes. */
  editHref: (id: string) => string;
  /** The channel's request logs. */
  logsHref: (id: string) => string;
  /** Saves the switch. It shows the choice at once, and goes back with the message in a toast if this rejects. */
  onToggle: (channel: ChannelRow, enabled: boolean) => Promise<void>;
  /** A row's Delete; the page asks before it deletes. */
  onDelete: (id: string) => void;
}) {
  return (
    <Table
      id="channels-table"
      header={
        <Tr>
          <Th>Name</Th>
          <Th>Destination</Th>
          <Th>Requests</Th>
          <Th>Last activity</Th>
          <Th>Enabled</Th>
          <Th actions />
        </Tr>
      }
    >
      {channels.map((channel) => (
        <Tr key={channel.id} id={`channel-${channel.id}`}>
          <Td wrap maxWidth={60}>
            <Text id={`channel-name-${channel.id}`} tone="strong">
              {channel.name}
            </Text>
          </Td>
          <Td wrap maxWidth={80}>
            <div className="flex items-center gap-1.5 font-mono text-muted">
              <span className="hero-arrow-right-start-on-rectangle h-4 w-4 shrink-0 text-faint" />
              <span className="min-w-0">{channel.destinationUrl}</span>
            </div>
            <ProxyUrlCopy url={channel.proxyUrl} icon className="mt-1" />
          </Td>
          <Td>
            <TextLink to={logsHref(channel.id)}>{channel.requestCount}</TextLink>
          </Td>
          <Td>
            <TextLink to={logsHref(channel.id)}>
              {channel.lastActivityAt ? <DateTime value={channel.lastActivityAt} /> : <span className="italic">Never</span>}
            </TextLink>
          </Td>
          <Td>
            {canEdit ? (
              <EnabledSwitch channel={channel} onToggle={onToggle} />
            ) : (
              <Text tone={channel.enabled ? "body" : "muted"}>{channel.enabled ? "Enabled" : "Disabled"}</Text>
            )}
          </Td>
          <Td actions>
            {canEdit && (
              <Button variant="secondary" size="xs" to={editHref(channel.id)} aria-label={`Edit ${channel.name}`}>
                Edit
              </Button>
            )}
            {canDelete && (
              <Button variant="secondary" size="xs" onClick={() => onDelete(channel.id)} aria-label={`Delete ${channel.name}`}>
                Delete
              </Button>
            )}
          </Td>
        </Tr>
      ))}
    </Table>
  );
}

/**
 * A row's switch, labelled by the channel's name. A press while the last one
 * is still saving is ignored: it would send the version that save replaces.
 */
function EnabledSwitch({ channel, onToggle }: { channel: ChannelRow; onToggle: (channel: ChannelRow, enabled: boolean) => Promise<void> }) {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const save = async (next: boolean) => {
    setSaving(true);
    try {
      await onToggle(channel, next);
    } finally {
      setSaving(false);
    }
  };
  const enabled = useChosenValue(channel.enabled, save, (error) => toast(errorMessage(error), "danger"));
  return (
    <Toggle
      id={channel.id}
      name="channel_state"
      labelledBy={`channel-name-${channel.id}`}
      checked={enabled.value}
      onChange={(next) => !saving && enabled.choose(next)}
    />
  );
}
