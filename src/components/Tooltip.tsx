import {
  arrow,
  autoUpdate,
  flip,
  FloatingArrow,
  FloatingPortal,
  offset,
  safePolygon,
  shift,
  useDismiss,
  useFloating,
  useFocus,
  useHover,
  useInteractions,
  useMergeRefs,
  useRole,
} from "@floating-ui/react";
import { cloneElement, useState, type ReactElement, type ReactNode, type Ref, type SyntheticEvent } from "react";
import { cn } from "../utils/cn";
import { useCopy } from "../utils/useCopy";

// One tooltip at a time, like Radix: one open from keyboard focus closes when another opens on hover.
let closeShown: (() => void) | undefined;

/**
 * Lightning's React `Tooltip` (assets/js/components/Tooltip.tsx), on Floating
 * UI, which Headless UI's menus and popovers also sit on. The child must be a
 * single element that can take a ref; it becomes the trigger. No `content`
 * renders no tooltip. With `copy`, clicking the child copies that text and the
 * tooltip says "Copied!" for 1.5 seconds, then hides, like Lightning's Tooltip
 * and Copy hooks. With `disabled`, the child is a disabled control and a
 * wrapper takes its hover. With `interactive`, the pointer can move onto the
 * tooltip, so a link in it can be clicked.
 */
export default function Tooltip({
  children,
  content,
  copy,
  side = "bottom",
  disabled = false,
  interactive = false,
}: {
  children: ReactElement;
  content: ReactNode;
  /** Text to copy when the child is clicked. */
  copy?: string | undefined;
  side?: "top" | "right" | "bottom" | "left" | undefined;
  /** The child is a disabled control. */
  disabled?: boolean | undefined;
  /** The tooltip holds something to click, such as a link. */
  interactive?: boolean | undefined;
}) {
  const [open, setOpen] = useState(false);
  // With no content the listeners are off, so text that goes while the tooltip is open would leave this set.
  if (!content && open) setOpen(false);
  const { copied, copy: copyNow } = useCopy(copy ?? "", 1500);
  const [arrowEl, setArrowEl] = useState<SVGSVGElement | null>(null);
  const { refs: { setReference, setFloating }, floatingStyles, context } = useFloating({
    open: !!content && (open || copied),
    onOpenChange: (next) => {
      if (next) {
        closeShown?.();
        closeShown = () => setOpen(false);
      }
      setOpen(next);
    },
    placement: side,
    middleware: [offset(10), flip(), shift(), arrow({ element: arrowEl })],
    whileElementsMounted: autoUpdate,
  });
  const enabled = !!content;
  const { getReferenceProps, getFloatingProps } = useInteractions([
    // Only mouseenter opens it, so the next mouse move doesn't undo a press that closed it.
    useHover(context, { enabled, delay: { open: 200 }, mouseOnly: true, move: false, handleClose: interactive ? safePolygon() : null }),
    // Only keyboard focus: Headless Menu and Dialog hand focus back to their trigger after a mouse close.
    useFocus(context, { enabled, visibleOnly: true }),
    // Escape goes on to a modal too, so one press closes both. A press on the trigger closes it, unless it copies.
    useDismiss(context, { enabled, referencePress: copy === undefined, bubbles: { escapeKey: true } }),
    useRole(context, { enabled, role: "tooltip" }),
  ]);

  const child = (
    disabled && content ? (
      // Disabled controls don't get hover events in every browser, so the wrapper takes them, and it
      // swallows the click, since a disabled control's click does nothing (not even a clickable row's).
      <span className="inline-flex cursor-not-allowed *:pointer-events-none" onClick={(e) => e.stopPropagation()}>
        {/* The tooltip can't open from a disabled control, so the reason goes on it for screen readers. */}
        {typeof content === "string" ? cloneElement(children as ReactElement<{ "aria-description"?: string }>, { "aria-description": content }) : children}
      </span>
    ) : (
      children
    )
  ) as ReactElement<{ ref?: Ref<Element>; onClick?: (e: SyntheticEvent) => void }>;
  const ref = useMergeRefs([setReference, child.props.ref]);
  // Like Lightning's Copy hook, the click copies and goes no further, even inside a link or a clickable row.
  const onClick = (e: SyntheticEvent) => {
    child.props.onClick?.(e);
    if (copy === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    copyNow();
    setOpen(false); // "Copied!" holds it open, then it hides.
  };

  return (
    <>
      {cloneElement(child, getReferenceProps({ ...child.props, ref, onClick }))}
      {context.open && (
        <FloatingPortal>
          {/* z-300: the same layer as Menu and Popover panels, above modals. Clicks go through it to whatever is underneath, unless it is interactive. */}
          <div
            ref={setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={cn("z-300 max-w-xs rounded-md bg-primary-950 px-3 py-1.5 text-center text-xs text-primary-50 shadow-md", !interactive && "pointer-events-none")}
            data-ui="tooltip"
          >
            {copied ? "Copied!" : content}
            <FloatingArrow ref={setArrowEl} context={context} width={10} height={5} className="fill-primary-950" />
          </div>
        </FloatingPortal>
      )}
      {copy !== undefined && (
        <span role="status" className="sr-only">
          {copied ? "Copied to clipboard" : ""}
        </span>
      )}
    </>
  );
}
