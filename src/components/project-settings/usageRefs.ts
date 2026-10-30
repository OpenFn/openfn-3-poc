import type { WebhookUsageRef } from "../../types/project-settings";

/** Refs sorted by name, as Lightning lists an auth method's channels. */
export const byName = (refs: WebhookUsageRef[]) => [...refs].sort((a, b) => a.name.localeCompare(b.name));
