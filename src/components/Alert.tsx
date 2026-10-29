import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export type AlertTone = "info" | "success" | "warning" | "danger";

// Lightning's Common.alert_classes/1, written out in full for Tailwind.
const classes: Record<AlertTone, { bg: string; icon: string; header: string; text: string; iconName: string }> = {
  success: {
    bg: "bg-success-50",
    icon: "text-success-400",
    header: "text-success-800",
    text: "text-success-700",
    iconName: "hero-check-circle-solid",
  },
  warning: {
    bg: "bg-warning-50",
    icon: "text-warning-400",
    header: "text-warning-800",
    text: "text-warning-700",
    iconName: "hero-exclamation-triangle",
  },
  danger: {
    bg: "bg-danger-50",
    icon: "text-danger-400",
    header: "text-danger-800",
    text: "text-danger-700",
    iconName: "hero-x-circle-solid",
  },
  info: {
    bg: "bg-info-50",
    icon: "text-info-400",
    header: "text-info-800",
    text: "text-info-700",
    iconName: "hero-information-circle-solid",
  },
};

interface Props {
  tone: AlertTone;
  header?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}

/**
 * Lightning's `Common.alert` (live/components/common.ex): a tinted,
 * rounded box with a tone icon, an optional header and a message.
 */
export default function Alert({ tone, header, children, className, id }: Props) {
  const c = classes[tone];
  return (
    <div id={id} className={cn("rounded-md p-4 text-wrap", c.bg, className)} data-ui="alert" data-tone={tone} role={tone === "danger" ? "alert" : "status"}>
      <div className={cn("flex", header ? "items-start" : "items-center")}>
        <div className="shrink-0">
          <span className={cn(c.iconName, "block h-5 w-5", c.icon)} />
        </div>
        <div className="ml-3 min-w-0 flex-1">
          {header ? (
            <>
              <h3 className={cn("text-sm font-medium", c.header)}>{header}</h3>
              <div className={cn("mt-2 text-sm", c.text)}>{children}</div>
            </>
          ) : (
            <div className={cn("text-sm", c.text)}>{children}</div>
          )}
        </div>
      </div>
    </div>
  );
}
