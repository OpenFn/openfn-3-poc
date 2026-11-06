import type { SandboxRow } from "@/types/sandboxes";
import Button from "@/components/primitives/Button";
import Card from "@/components/primitives/Card";
import Section from "@/components/primitives/Section";
import { Stack } from "@/components/primitives/Stack";
import Text from "@/components/primitives/Text";
import SandboxActions from "./SandboxActions";
import WorkspaceCard from "./WorkspaceCard";

/**
 * The sandboxes page's list, in openfn-ia-demo's sections: "Selected" (the
 * page's project), "Active" (the rest of the workspace, its top project
 * first), then Lightning's "Scheduled for deletion", whose cards offer
 * Restore. The top project's card has no actions. The selected card isn't a
 * link: you're already there.
 */
export default function WorkspaceList({
  root,
  rootIsSandbox,
  sandboxes,
  currentProjectId,
  workflowsHref,
  editHref,
  restoreBlockedReason,
  restoring,
  onMerge,
  onDelete,
  onRestore,
}: {
  /** The top of the workspace the viewer can open. */
  root: SandboxRow;
  rootIsSandbox: boolean;
  /** Every sandbox below it the viewer is in, live and scheduled, by name. */
  sandboxes: SandboxRow[];
  currentProjectId: string;
  workflowsHref: (id: string) => string;
  editHref: (id: string) => string;
  restoreBlockedReason: string | null;
  /** Whether this sandbox's Restore is waiting on the server. */
  restoring: (id: string) => boolean;
  onMerge: (sandbox: SandboxRow) => void;
  onDelete: (sandbox: SandboxRow) => void;
  onRestore: (sandbox: SandboxRow) => void;
}) {
  const all = [root, ...sandboxes];
  const selected = all.find((s) => s.id === currentProjectId);
  const active = all.filter((s) => s !== selected && !s.scheduledDeletion);
  const scheduled = sandboxes.filter((s) => s.scheduledDeletion);
  const restoreBlocked = (s: SandboxRow) => (s.canCancelDeletion ? restoreBlockedReason : "You are not authorized to cancel deletion of this sandbox");
  const card = (s: SandboxRow) => (
    <WorkspaceCard
      key={s.id}
      sandbox={s}
      isMain={s === root && !rootIsSandbox}
      selected={s === selected}
      href={s === selected || s.scheduledDeletion ? undefined : workflowsHref(s.id)}
      actions={
        s === root ? null : s.scheduledDeletion ? (
          <Button
            variant="secondary"
            disabled={restoreBlocked(s) !== null}
            tooltip={restoreBlocked(s) ?? undefined}
            pending={restoring(s.id)}
            onClick={() => onRestore(s)}
          >
            Restore
          </Button>
        ) : (
          <SandboxActions sandbox={s} editHref={editHref(s.id)} onMerge={() => onMerge(s)} onDelete={() => onDelete(s)} />
        )
      }
    />
  );

  return (
    <Stack gap="lg">
      {selected && (
        <Section size="sm" title="Selected">
          {card(selected)}
        </Section>
      )}
      <Section size="sm" title="Active">
        {active.length > 0 ? (
          active.map(card)
        ) : (
          // Words only: the header's New sandbox is the one way to make one.
          <Card variant="dashed" className="flex flex-col items-center gap-1">
            <span className="hero-beaker h-6 w-6 text-faint" aria-hidden="true" />
            <Text variant="label-md" tone="strong">
              No other sandboxes
            </Text>
            <Text tone="muted">Create a sandbox to try out changes without touching main.</Text>
          </Card>
        )}
      </Section>
      {scheduled.length > 0 && (
        <Section size="sm" title="Scheduled for deletion">
          {scheduled.map(card)}
        </Section>
      )}
    </Stack>
  );
}
