import type { ReactNode } from "react";
import Button from "../primitives/Button";
import Card from "../primitives/Card";

/**
 * One action card on the Maintenance page (maintenance_live/index.html.heex):
 * a title and description on the left, a primary "Run" button on the right.
 */
export default function MaintenanceCard({
  id,
  buttonId,
  title,
  description,
  onRun,
  pending = false,
}: {
  id?: string;
  /** The Run button's id (Lightning's `refresh-adaptors-button`). */
  buttonId?: string | undefined;
  title: string;
  description: ReactNode;
  onRun?: () => void;
  /** Shows the Run button pending while the action runs. */
  pending?: boolean;
}) {
  return (
    <Card
      id={id}
      padding="lg"
      title={title}
      description={description}
      action={
        // Named after its card, so two "Run"s read apart; pending keeps focus and says busy.
        <Button id={buttonId} onClick={onRun} pending={pending} aria-label={`Run ${title}`}>
          Run
        </Button>
      }
    />
  );
}
