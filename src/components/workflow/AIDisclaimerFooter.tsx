import { cn } from "../../utils/cn";
import TextLink from "../TextLink";

/** "Please use AI responsibly. Never share PII." (AIDisclaimerFooter.tsx). `muted` is the quieter one, without the icon. */
export default function AIDisclaimerFooter({ variant = "default" }: { variant?: "default" | "muted" }) {
  const muted = variant === "muted";
  return (
    <div className="flex items-center gap-1.5" data-testid="ai-disclaimer-footer">
      {!muted && <span className="hero-shield-exclamation h-3.5 w-3.5 shrink-0 text-warning-500" />}
      <span className={cn("text-xs", muted ? "text-faint" : "font-medium text-muted")}>
        Please use AI responsibly. Never share PII.{" "}
        <TextLink
          variant="plain"
          to="https://www.openfn.org/ai"
          external
          className={cn("underline hover:text-strong", muted && "hover:text-muted")}
        >
          Learn more.
        </TextLink>
      </span>
    </div>
  );
}
