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
 * values), or a project taken away. It goes once the form saves through the
 * API's environment and project routes.
 */
export function refuseUnsaved(values: CredentialValues, saved: CredentialRow | undefined) {
  const names = saved?.environments ?? ["main"];
  const environmentsChanged =
    values.environments.length !== names.length ||
    values.environments.some((e) => !names.includes(e.name) || (e.previousName ?? e.name) !== e.name || (e.name !== "main" && isFilled(e.body)));
  const projectRemoved = saved?.projects.some((p) => !values.projectIds.includes(p.id));
  if (environmentsChanged || projectRemoved) {
    throw new RequestError("You can only change main here, and you can't remove a project. Undo that and save again.");
  }
}
