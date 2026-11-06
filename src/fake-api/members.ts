/** A new project's members on the pretend server. */
import type { Project, ProjectRole } from "@/types/projects";
import type { Problem } from "./answers";
import { people } from "./session";

const ROLES: string[] = ["owner", "admin", "editor", "viewer"] satisfies ProjectRole[];

/** A new project's members as a superuser sends them (api/projects.md, Create or replace a project), and what's wrong with them. */
export function membersOf(sent: unknown, errors: NonNullable<Problem["errors"]>): Project["members"] {
  if (!Array.isArray(sent)) {
    errors.push({ code: "type", detail: "is not a list", pointer: "#/members" });
    return [];
  }
  const members: Project["members"] = [];
  const seen = new Set<string>();
  sent.forEach((entry: { email?: unknown; role?: unknown } | null, i) => {
    const m = entry ?? {};
    const user = people.find((u) => typeof m.email === "string" && u.email.toLowerCase() === m.email.toLowerCase());
    if (!user) errors.push({ code: "not_found", detail: "has no account", pointer: `#/members/${i}/email` });
    else if (seen.has(user.id)) errors.push({ code: "duplicate", detail: "is listed twice", pointer: `#/members/${i}/email` });
    if (user) seen.add(user.id);
    if (typeof m.role !== "string" || !ROLES.includes(m.role)) {
      errors.push({ code: "inclusion", detail: "has a role that isn't owner, admin, editor or viewer", pointer: `#/members/${i}/role` });
    } else if (user) members.push({ userId: user.id, role: m.role as ProjectRole, failureAlert: true, digest: "never" });
  });
  const owners = sent.filter((m: { role?: unknown } | null) => m?.role === "owner").length;
  // The member routes' code for the same rule; api/projects.md names none for a create (docs/api-gaps.md).
  if (owners === 0) errors.push({ code: "one_owner", detail: "Every project must have exactly one owner.", pointer: "#/members" });
  if (owners > 1) errors.push({ code: "one_owner", detail: "A project can have only one owner.", pointer: "#/members" });
  return members;
}
