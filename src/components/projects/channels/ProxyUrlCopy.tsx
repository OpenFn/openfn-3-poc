import type { ReactNode } from "react";
import Text from "../../primitives/Text";
import Tooltip from "../../primitives/Tooltip";
import { cn } from "../../../utils/cn";

/**
 * A channel's proxy URL that copies itself on click (ChannelLive.Helpers
 * .proxy_url_copy): the tooltip offers the copy and says "Copied!" after it,
 * as Lightning's Copy hook does. The host and path truncate from the left so
 * the channel id stays visible. `leading` goes before the URL, such as an
 * icon. The host builds the URL; it knows its own address.
 */
export default function ProxyUrlCopy({ url, leading, className }: { url: string; leading?: ReactNode; className?: string }) {
  const [scheme, rest] = url.includes("://") ? [url.split("://")[0] + "://", url.split("://")[1]] : ["", url];

  return (
    <Tooltip content="Copy proxy URL" copy={url}>
      <div
        role="button"
        tabIndex={0}
        aria-label="Copy proxy URL"
        // Enter and Space copy too; the Tooltip's click handler does the work.
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
        className={cn("group flex min-w-0 cursor-pointer items-center gap-1.5 text-muted hover:text-body", className)}
      >
        {leading}
        <Text variant="code-sm" className="flex min-w-0">
          <span className="shrink-0">{scheme}</span>
          <span className="truncate" style={{ direction: "rtl", textAlign: "left" }}>
            {rest}
          </span>
        </Text>
        <span className="hero-clipboard-document h-4 w-4 shrink-0 text-faint opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Tooltip>
  );
}
