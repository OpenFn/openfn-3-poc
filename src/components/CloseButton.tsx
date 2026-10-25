import type { ComponentProps } from "react";
import IconButton from "./IconButton";

type Props = Omit<ComponentProps<typeof IconButton>, "icon" | "label" | "title"> & {
  /** Accessible name, e.g. "Close panel". */
  label?: string;
};

/**
 * The X that closes a modal, toast or panel. Unlike other icon buttons it has
 * no tooltip: everyone knows what an X does, and an open tooltip would take the
 * first Escape away from a modal.
 */
export default function CloseButton({ label = "Close", ...rest }: Props) {
  return <IconButton icon="hero-x-mark" label={label} title="" {...rest} />;
}
