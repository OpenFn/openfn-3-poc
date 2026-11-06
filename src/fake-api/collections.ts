/** Collections on the pretend server (api/collections.md). */
import { collections as fixtures } from "@/mock-data/project-settings";
import type { CollectionSortKey } from "@/types/admin";
import { compareBy, type SortValue } from "@/utils/useTableSort";
import { badSort, forbidden, parseSort, invalid, json, notFound, paged, type Handler, type Problem } from "./answers";
import { findProject } from "./projects";
import { currentUser } from "./session";

interface StoredCollection {
  id: string;
  project_id: string;
  name: string;
  byte_size_sum: number;
}

// The fake's own copy, like projects.
const seed = (): StoredCollection[] =>
  fixtures.map((c) => ({ id: c.id, project_id: c.projectId, name: c.name, byte_size_sum: c.byteSizeSum }));
let collections = seed();

/** For stories and tests: the starting collections. */
export const resetCollections = () => {
  collections = seed();
};

const sorts: Record<CollectionSortKey, (c: StoredCollection) => SortValue> = { name: (c) => c.name, byte_size_sum: (c) => c.byte_size_sum };
// Lowercase letters and digits, separated by -, _ or . (Lightning's Collection changeset).
const URL_SAFE = /^[a-z0-9]+([-_.][a-z0-9]+)*$/;
const entry = ({ id, project_id, name }: StoredCollection) => ({ data: { id, project_id, name } });

export const collectionRoutes: Record<string, Handler> = {
  // Private. Superusers only: Lightning's list_collections checks nothing, so the route has to.
  "GET /api/collections": (_params, _body, query) => {
    if (currentUser().role !== "superuser") return forbidden();
    const { field, key, direction } = parseSort(query, sorts, "name");
    if (!key) return badSort(field);
    const rows = [...collections]
      .sort(compareBy(sorts[key], direction))
      .map((c) => ({ ...c, project_name: findProject(c.project_id)!.name }));
    return json(200, paged("/api/collections", rows, query));
  },
  // Creates, renames, or moves the collection to this project. A superuser's token and the move are
  // planned scope; project owners and admins may call it too, but no page does yet, so only superusers here.
  "PUT /api/projects/:project_id/collections/:id": ({ project_id, id }, body) => {
    if (currentUser().role !== "superuser") return forbidden();
    if (!findProject(project_id)) return notFound();
    const name = typeof body["name"] === "string" ? body["name"] : "";
    const errors: NonNullable<Problem["errors"]> = [];
    if (name === "") errors.push({ code: "required", detail: "can't be blank", pointer: "#/name" });
    else if (!URL_SAFE.test(name)) errors.push({ code: "format", detail: "Collection name must be URL safe", pointer: "#/name" });
    else if (collections.some((c) => c.project_id === project_id && c.name === name && c.id !== id)) {
      errors.push({ code: "taken", detail: "A collection with this name already exists", pointer: "#/name" });
    }
    if (errors.length) return invalid(errors);
    const existing = collections.find((c) => c.id === id);
    if (existing) {
      Object.assign(existing, { project_id, name });
      return json(200, entry(existing));
    }
    const created = { id: id!, project_id: project_id!, name, byte_size_sum: 0 };
    collections = [...collections, created];
    return json(201, entry(created));
  },
};
