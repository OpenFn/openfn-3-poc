import type { ReactNode } from "react";
import { Link } from "@/routing/router";
import type { SandboxRow } from "@/types/sandboxes";
import { formatUtcDate } from "@/utils/format";
import Card from "@/components/primitives/Card";
import Heading from "@/components/primitives/Heading";
import Pill from "@/components/primitives/Pill";
import { Row } from "@/components/primitives/Stack";
import Text from "@/components/primitives/Text";
import Tooltip from "@/components/primitives/Tooltip";

function deletionTooltip(iso: string) {
  const days = Math.trunc((new Date(iso).getTime() - Date.now()) / 86_400_000);
  const suffix = days > 1 ? ` (in ${days} days)` : days === 1 ? " (in 1 day)" : days === 0 ? " (today)" : "";
  return `Scheduled for deletion on ${formatUtcDate(iso)}${suffix}. Cancel the deletion to restore it.`;
}

/**
 * A project on the sandboxes page: its colour strip, its name with the
 * "Selected" and "Main" badges, a line about it and what it was made from.
 * With `href` the name opens that project. A sandbox scheduled for deletion
 * is struck through, says when it goes on hover, and opens nothing.
 */
export default function WorkspaceCard({
  sandbox,
  isMain = false,
  selected = false,
  href,
  actions,
}: {
  sandbox: SandboxRow;
  /** The project at the top of the workspace, when it isn't a sandbox. */
  isMain?: boolean;
  selected?: boolean;
  href?: string | undefined;
  /** The card's buttons, at its right. */
  actions?: ReactNode;
}) {
  const deleted = sandbox.scheduledDeletion;
  const description = isMain ? "The live version of this project. Sandboxes merge back into main." : sandbox.description;
  const name = deleted ? <s>{sandbox.name}</s> : sandbox.name;
  return (
    <Card padding="none" variant={deleted ? "muted" : "default"} className="flex overflow-hidden">
      <div className="w-3 shrink-0" style={{ backgroundColor: (!isMain && sandbox.color) || "var(--background-color-brand)" }} />
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-4" {...(deleted && { "aria-description": deletionTooltip(deleted) })}>
        <Row wrap>
          <Tooltip content={deleted ? deletionTooltip(deleted) : undefined}>
            {/* Tooltip wraps its child in a span, and a heading can't sit in one. */}
            <div className="min-w-0">
              <Heading size="lg" className="truncate">
                {href ? <Link to={href}>{name}</Link> : name}
              </Heading>
            </div>
          </Tooltip>
          {selected && <Pill tone="info">Selected</Pill>}
          {isMain && <Pill>Main</Pill>}
        </Row>
        <Text as="p" tone={description ? "body" : "faint"}>
          {description || "No description"}
        </Text>
        {sandbox.parentName && (
          <Text as="p" variant="body-sm" tone="muted">
            Made from {sandbox.parentName}
          </Text>
        )}
      </div>
      {actions && <div className="flex items-center pr-4">{actions}</div>}
    </Card>
  );
}
