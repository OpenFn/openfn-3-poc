import * as RadixTooltip from "@radix-ui/react-tooltip";
import { useRef, type ReactNode } from "react";

/**
 * Lightning's React `Tooltip` (assets/js/components/Tooltip.tsx), on Radix.
 * The child must be a single element that can take a ref; it becomes the
 * trigger. No `content` renders the child alone. `open` and `onOpenChange`
 * control it, e.g. to hold it open while it says "Copied!".
 */
export default function Tooltip({
  children,
  content,
  side = "bottom",
  align = "center",
  delayDuration = 200,
  open,
  onOpenChange,
}: {
  children: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  if (!content) return <>{children}</>;
  return (
    <RadixTooltip.Provider delayDuration={delayDuration}>
      <RadixTooltip.Root open={open} onOpenChange={onOpenChange}>
        <RadixTooltip.Trigger asChild ref={trigger}>{children}</RadixTooltip.Trigger>
        <RadixTooltip.Portal>
          {/* z-[300]: the same layer as Menu and Popover panels, above modals. */}
          <RadixTooltip.Content
            side={side}
            align={align}
            sideOffset={5}
            // A press on the trigger is the trigger's to handle (it closes unless the trigger prevents it), not a press outside.
            onPointerDownOutside={(e) => trigger.current?.contains(e.target as Node) && e.preventDefault()}
            className="z-[300] max-w-xs overflow-hidden rounded-md bg-primary-950 px-3 py-1.5 text-center text-xs text-primary-50 shadow-md"
            data-ui="tooltip"
          >
            {content}
            <RadixTooltip.Arrow className="fill-primary-950" />
          </RadixTooltip.Content>
        </RadixTooltip.Portal>
      </RadixTooltip.Root>
    </RadixTooltip.Provider>
  );
}
