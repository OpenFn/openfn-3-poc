/** Dataclips on the pretend server (api/dataclips.md, Get a dataclip). Nothing here writes, so resetFakeApi has nothing to put back. */
import { dataclips as fixtures } from "@/mock-data/history";
import type { Dataclip } from "@/mock-data/models/history";
import { forbidden, json, ORIGIN, type Handler } from "./answers";
import { canEnter, findProject } from "./projects";

const OPENHIE = "4adf2644-ed4e-4f97-a24c-ab35b3cb1efa";
// A fixed wipe time, later than every seeded inserted_at.
const WIPED_AT = "2026-10-20T00:00:00Z";

// The fake's own copy. The fixtures have no update time, so updated_at is inserted_at.
const dataclips = [
  ...fixtures,
  // The fixtures' wiped dataclip is in DHIS2, which needs MFA the first user hasn't set up; this one they can open.
  { id: "dc-wiped-openhie", projectId: OPENHIE, type: "step_result", name: null, insertedAt: "2026-10-01T09:00:00Z", wiped: true, body: null } satisfies Dataclip,
].map((d) => ({
  id: d.id,
  attributes: {
    name: d.name,
    type: d.type,
    project_id: d.projectId,
    wiped_at: d.wiped ? WIPED_AT : null,
    inserted_at: d.insertedAt,
    updated_at: d.insertedAt,
    body: d.wiped ? null : d.body,
  },
}));

export const dataclipRoutes: Record<string, Handler> = {
  // Private. An id it doesn't hold, malformed included, is 403 like a project the caller can't enter:
  // nobody hears 404 on a top-level record (api/errors.md).
  "GET /api/dataclips/:id": ({ id }) => {
    const dataclip = dataclips.find((d) => d.id === id);
    const project = findProject(dataclip?.attributes.project_id);
    if (!dataclip || !project || !canEnter(project)) return forbidden();
    const self = `${ORIGIN}/api/dataclips/${id}`;
    return json(200, { data: { type: "dataclips", ...dataclip, relationships: {}, links: { self } }, included: [], links: { self } });
  },
};
