import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";
import type { Tone } from "./tone";
import Heading from "./Heading";
import Text from "./Text";

export type AlertTone = Extract<Tone, "info" | "success" | "warning" | "danger">;

// Lightning's Common.alert_classes/1, written out in full for Tailwind.
const classes: Record<AlertTone, { bg: string; icon: string; header: string; text: string; iconName: string }> = {
  success: {
    bg: "bg-success",
    icon: "text-success-icon",
    header: "text-success-strong",
    text: "text-success",
    iconName: "hero-check-circle-solid",
  },
  warning: {
    bg: "bg-warning",
    icon: "text-warning-icon",
    header: "text-warning-strong",
    text: "text-warning",
    iconName: "hero-exclamation-triangle",
  },
  danger: {
    bg: "bg-danger",
    icon: "text-danger-icon",
    header: "text-danger-strong",
    text: "text-danger",
    iconName: "hero-x-circle-solid",
  },
  info: {
    bg: "bg-info",
    icon: "text-info-icon",
    header: "text-info-strong",
    text: "text-info",
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
 * rounded box with a tone icon, an optional header and a message. It is read
 * out when it appears, assertively for `danger`. The same message shown again
 * under a new `key` is read again.
 */
export default function Alert({ tone, header, children, className, id }: Props) {
  const c = classes[tone];
  // Screen readers skip a live region that mounts holding its text. So the box starts invisible, hidden from
  // them too, and appears 100ms later, once the region has registered (React Aria's announcer waits as long).
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setShown(true), 100);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div id={id} role={tone === "danger" ? "alert" : "status"}>
      <div className={cn("rounded-md p-4 text-wrap", c.bg, !shown && "invisible", className)} data-ui="alert" data-tone={tone}>
        <div className={cn("flex", header ? "items-start" : "items-center")}>
          <div className="shrink-0">
            <span className={cn(c.iconName, "block h-5 w-5", c.icon)} />
          </div>
          <div className="ml-3 min-w-0 flex-1">
            {header ? (
              <>
                <Heading size="sm" className={c.header}>
                  {header}
                </Heading>
                <Text as="div" className={cn("mt-2", c.text)}>
                  {children}
                </Text>
              </>
            ) : (
              <Text as="div" className={c.text}>
                {children}
              </Text>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
