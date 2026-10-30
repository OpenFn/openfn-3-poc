import type { ReactNode } from "react";
import Button, { type ButtonVariant } from "./Button";
import Menu from "./Menu";
import type { FloatingAlign } from "./floating";

interface Props {
  /** The button's text, e.g. "Actions". A chevron is added after it. */
  label: ReactNode;
  variant?: ButtonVariant;
  align?: FloatingAlign;
  /** Width class for the menu. */
  className?: string;
  /** Spins the button while something it started is loading (an Edit fetching its record). */
  pending?: boolean;
  disabled?: boolean;
  /** MenuItems. */
  children: ReactNode;
}

/**
 * A labelled button with a chevron that opens a Menu: row "Actions" menus,
 * "Add new" menus (Lightning's `simple_dropdown`).
 */
export default function ButtonMenu({ label, variant = "secondary", align, className, pending = false, disabled = false, children }: Props) {
  return (
    <Menu
      align={align}
      className={className}
      trigger={
        <Button variant={variant} pending={pending} disabled={disabled} icon="hero-chevron-down" iconPosition="right">
          {label}
        </Button>
      }
    >
      {children}
    </Menu>
  );
}
