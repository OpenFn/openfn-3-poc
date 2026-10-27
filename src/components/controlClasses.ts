import { cn } from "../utils/cn";

/** The shared look of text inputs, textareas and selects. */
export function controlClasses(hasErrors = false, className?: string) {
  return cn(
    "block w-full rounded-lg bg-surface text-strong sm:text-sm sm:leading-6",
    "focus:ring-0 focus:outline-2 focus:outline-offset-1",
    "disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted",
    hasErrors
      ? "border-danger-400 focus:border-danger-400 focus:outline-danger-400"
      : "border-strong focus:border-emphasis focus:outline-focus",
    className
  );
}
