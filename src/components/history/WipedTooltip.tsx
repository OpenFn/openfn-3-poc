import type { ReactElement } from "react";
import TextLink from "../primitives/TextLink";
import Tooltip from "../primitives/Tooltip";

/**
 * The tooltip on a control the retention policy disabled: what was lost,
 * then where to change the policy, or who to ask (run_live/components.ex
 * `zero_persistence_action_message`). Interactive, so the link can be clicked.
 */
export default function WipedTooltip({
  message,
  dataStorageHref,
  children,
}: {
  message: string;
  /** The project's data storage settings; null when the viewer can't change the policy. */
  dataStorageHref: string | null;
  /** The disabled control. */
  children: ReactElement;
}) {
  return (
    <Tooltip
      side="top"
      disabled
      interactive
      content={
        <>
          {message}
          <br />
          {dataStorageHref ? (
            <TextLink to={dataStorageHref} variant="plain" className="underline">
              Go to data storage settings
            </TextLink>
          ) : (
            "For more information, contact one of your project admins."
          )}
        </>
      }
    >
      {children}
    </Tooltip>
  );
}
