import { cn } from "../../utils/cn";

/**
 * The shared look of text inputs, textareas and selects. Focus is the same
 * outline as every other control; `aria-invalid` turns the border, the
 * outline and the typed text red.
 */
export function controlClasses(className?: string) {
  return cn(
    "block w-full rounded-lg border-strong bg-surface text-strong sm:text-sm sm:leading-6",
    "focus:border-emphasis focus:ring-0 focus:outline-2 focus:outline-offset-1 focus:outline-focus",
    "disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted",
    "aria-invalid:border-invalid aria-invalid:text-invalid aria-invalid:focus:border-invalid aria-invalid:focus:outline-invalid",
    className
  );
}
