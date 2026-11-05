/** A loose email check: something@something, no spaces. */
export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+$/.test(s);
}

/** Lightning's required-field error, for a `useForm` `validate`. Whitespace counts as blank, as in Ecto. */
export function blank(value: string): string[] {
  return value.trim() ? [] : ["can't be blank"];
}

/** A required email: blank, or not shaped like one (Lightning's User changeset wording). */
export function emailErrors(value: string): string[] {
  const empty = blank(value);
  if (empty.length > 0) return empty;
  return isValidEmail(value.trim()) ? [] : ["must have the @ sign and no spaces"];
}

/**
 * A project's URL-safe name (after `urlSafeName`): blank, or outside Lightning's
 * Project format, lowercase letters, digits and hyphens. `urlSafeName` keeps
 * "_", "." and accented letters, so "my_project" needs this error, as in Lightning.
 */
export function projectNameErrors(name: string): string[] {
  const empty = blank(name);
  if (empty.length > 0) return empty;
  return /^[a-z0-9-]+$/.test(name) ? [] : ["has invalid format"];
}
