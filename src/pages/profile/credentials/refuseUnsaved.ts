import type { CredentialRow, CredentialValues } from "@/types/credentials";
import { RequestError } from "@/utils/errors";

/** Whether a body holds anything typed: an untouched one is `{}`, and a blank field keeps what's saved. */
const isFilled = (body: string) => {
  try {
    return Object.values(JSON.parse(body) as Record<string, unknown>).some((v) => v !== "");
  } catch {
    return body.trim() !== "";
  }
};

/**
 * Refuses what today's form can change but this page can't save yet:
 * anything but `main` (an environment added, renamed, removed or given new
 * values), or a project taken away.
 */
export function refuseUnsaved(values: CredentialValues, saved: CredentialRow | undefined) {
  const names = saved?.environments ?? ["main"];
  const environmentsChanged =
    values.environments.length !== names.length ||
    values.environments.some((e) => !names.includes(e.name) || (e.previousName ?? e.name) !== e.name || (e.name !== "main" && isFilled(e.body)));
  const projectRemoved = saved?.projects.some((p) => !values.projectIds.includes(p.id));
  if (environmentsChanged || projectRemoved) {
    throw new RequestError("Only main can be changed here yet, and a project can't be taken away. Undo that and save again.");
  }
}
