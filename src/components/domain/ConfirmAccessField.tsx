import type { ComponentProps } from "react";
import { PasswordInput, TextInput } from "../primitives/Inputs";
import TextLink from "../primitives/TextLink";

/** How the person proves it's them: their password, or a code from their authenticator. */
export type ConfirmAccessMethod = "password" | "totp";

type Props = { method: ConfirmAccessMethod } & Omit<ComponentProps<typeof TextInput>, "id" | "name" | "label" | "hint" | "type">;

/**
 * The one box of Lightning's Confirm access form, for the password or the
 * authenticator code, in Lightning's words and ids. Spread `useForm`'s
 * `fieldProps` onto it.
 */
export default function ConfirmAccessField({ method, ...field }: Props) {
  return method === "password" ? (
    <PasswordInput
      id="user_password"
      name="password"
      label="Password"
      hint="Enter your password to confirm access"
      required
      autoComplete="current-password"
      {...field}
    />
  ) : (
    <TextInput
      id="user_code"
      name="code"
      label="Authentication Code"
      hint="Open your two-factor authenticator (TOTP) app or browser extension to view your authentication code."
      required
      autoComplete="one-time-code"
      inputMode="numeric"
      placeholder="XXXXXX"
      {...field}
    />
  );
}

/** The link that swaps to the other method: "Use your authenticator app instead", or back. */
export function ConfirmAccessSwitch({ method, onSwitch }: { method: ConfirmAccessMethod; onSwitch: (next: ConfirmAccessMethod) => void }) {
  return method === "password" ? (
    <TextLink id="use-totp" onClick={() => onSwitch("totp")}>
      Use your authenticator app instead
    </TextLink>
  ) : (
    <TextLink id="use-password" onClick={() => onSwitch("password")}>
      Use your password instead
    </TextLink>
  );
}
