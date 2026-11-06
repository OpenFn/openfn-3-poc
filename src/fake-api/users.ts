/**
 * Users on the pretend server: a superuser listing, creating and changing
 * them and scheduling or cancelling their deletion, and a person changing
 * their own account, api/users.md and api/account.md (GitHub). Changing one is
 * planned scope, as is a superuser's session doing any of it without stepping
 * up.
 */
import { badSort, DAY_MS, forbidden, invalid, json, noContent, notFound, now, paged, parseSort, problem, stepUpRequired, type Body, type Handler, type Problem } from "./answers";
import type { User } from "@/types/users";
import { matchesQuery } from "@/utils/search";
import { compareBy, type SortValue } from "@/utils/useTableSort";
import { isValidEmail } from "@/utils/validate";
import {
  currentUser,
  endSession,
  isSteppedUp,
  pendingEmails,
  people,
  PURGE_DELETED_AFTER_DAYS,
  setPassword,
  userJson,
} from "./session";

// Planned: what a person may change on their own account, and what a superuser may set on a new user and change on
// anyone else's (api/users.md, Create a user and Update a user).
const OWN_KEYS = ["first_name", "last_name", "contact_preference", "email", "password", "experimental_features", "consent", "ai_disclaimer_accepted"];
const CREATE_KEYS = ["email", "password", "first_name", "last_name", "role", "confirmed"];
const ADMIN_KEYS = ["first_name", "last_name", "email", "password", "role", "support_user", "disabled"];

/** Every problem with a body that may hold only `keys`, for a new user (`target` null) or a change to `target`. */
function check(body: Body, keys: string[], target: User | null): NonNullable<Problem["errors"]> {
  const errors: NonNullable<Problem["errors"]> = Object.keys(body)
    .filter((key) => !keys.includes(key))
    .map((key) => ({ code: "unknown_key", detail: "is not a known field", pointer: `#/${key}` }));
  for (const key of ["first_name", "last_name"]) {
    if (key in body && (typeof body[key] !== "string" || !(body[key] as string).trim())) {
      errors.push({ code: "required", detail: "can't be blank", pointer: `#/${key}` });
    }
  }
  // A key the body may not hold is already unknown_key, so only an allowed one has its value checked.
  const sent = (key: string) => keys.includes(key) && key in body;
  if (sent("contact_preference") && !["critical", "any"].includes(body["contact_preference"] as string)) {
    errors.push({ code: "invalid", detail: "is invalid", pointer: "#/contact_preference" });
  }
  if (sent("role") && !["user", "superuser"].includes(body["role"] as string)) {
    errors.push({ code: "invalid", detail: "is invalid", pointer: "#/role" });
  }
  for (const key of ["experimental_features", "support_user", "disabled", "confirmed"]) {
    if (sent(key) && typeof body[key] !== "boolean") errors.push({ code: "type", detail: "must be true or false", pointer: `#/${key}` });
  }
  const email = body["email"];
  if (email !== undefined) {
    // Lightning's change_user_email, on your own account: the same address exactly is unchanged; any case of a used
    // one is taken. A superuser setting someone's is taken only if anyone else holds it.
    const own = target !== null && target === currentUser();
    if (typeof email !== "string" || !isValidEmail(email)) {
      errors.push({ code: "format", detail: "must have the @ sign and no spaces", pointer: "#/email" });
    } else if (own && email === target?.email) {
      errors.push({ code: "unchanged", detail: "has not changed", pointer: "#/email" });
    } else if (people.some((u) => (own || u !== target) && u.email.toLowerCase() === email.toLowerCase())) {
      errors.push({ code: "taken", detail: "has already been taken", pointer: "#/email" });
    }
  }
  const password = body["password"];
  if (password !== undefined) {
    if (typeof password !== "string" || password.length < 12) {
      errors.push({ code: "too_short", detail: "should be at least 12 character(s)", pointer: "#/password" });
    } else if (password.length > 72) {
      errors.push({ code: "too_long", detail: "should be at most 72 character(s)", pointer: "#/password" });
    }
  }
  return errors;
}

// The fields GET /api/users sorts by (planned).
const userSorts: Record<"email" | "first_name" | "last_name" | "role" | "support_user" | "disabled" | "scheduled_deletion", (u: User) => SortValue> = {
  email: (u) => u.email,
  first_name: (u) => u.firstName,
  last_name: (u) => u.lastName,
  role: (u) => u.role,
  support_user: (u) => u.supportUser,
  disabled: (u) => u.disabled,
  scheduled_deletion: (u) => u.scheduledDeletion,
};

// A superuser changing anyone else's account, at once and without stepping up. Lightning lets one save demote or
// disable the last superuser; the fake refuses it. The caller is always another enabled superuser, so the app can't
// reach that refusal; tests make it with failNext.
function changeSomeoneElse(id: string | undefined, body: Body) {
  if (currentUser().role !== "superuser") return forbidden();
  const user = people.find((u) => u.id === id);
  if (!user) return notFound();
  const errors = check(body, ADMIN_KEYS, user);
  const lastSuperuser = user.role === "superuser" && !people.some((u) => u !== user && u.role === "superuser" && !u.disabled);
  const lastOne = (pointer: string) => ({ code: "last_superuser", detail: "would leave this instance with no superuser", pointer });
  if (lastSuperuser && body["role"] === "user") errors.push(lastOne("#/role"));
  if (lastSuperuser && body["disabled"] === true) errors.push(lastOne("#/disabled"));
  if (errors.length) return invalid(errors);
  if ("first_name" in body) user.firstName = body["first_name"] as string;
  if ("last_name" in body) user.lastName = body["last_name"] as string;
  if ("email" in body) user.email = body["email"] as string;
  if ("password" in body) setPassword(user.id, body["password"] as string);
  if ("support_user" in body) user.supportUser = body["support_user"] as boolean;
  if ("disabled" in body) user.disabled = body["disabled"] as boolean;
  if ("role" in body) {
    user.role = body["role"] as User["role"];
    // A superuser is never scheduled for deletion (api/users.md).
    if (user.role === "superuser") user.scheduledDeletion = null;
  }
  return json(200, userJson(user));
}

export const userRoutes: Record<string, Handler> = {
  // A superuser's personal access token, q and sort are planned scope; anyone else is refused.
  "GET /api/users": (_params, _body, query) => {
    if (currentUser().role !== "superuser") return forbidden();
    const { field, key, direction } = parseSort(query, userSorts, "email");
    if (!key) return badSort(field);
    const q = query.get("q") ?? "";
    const rows = people
      .filter((u) => matchesQuery(q, u.firstName, u.lastName, u.email, u.role))
      // Users with no scheduled deletion sort last either way: descending flips where nulls go, so ask for them first.
      .sort(compareBy(userSorts[key], direction, direction === "asc" ? "last" : "first"))
      .map((u) => userJson(u).data);
    return json(200, paged("/api/users", rows, query));
  },

  "GET /api/users/:id": ({ id }) => {
    const me = currentUser();
    if (id !== me.id && me.role !== "superuser") return forbidden();
    const user = people.find((u) => u.id === id);
    return user ? json(200, userJson(user)) : notFound();
  },

  // A signed-in superuser's branch. Register and first setup are a signed-out caller's branches of this handler.
  "POST /api/users": (_params, body) => {
    if (currentUser().role !== "superuser") return forbidden();
    const errors = check({ first_name: "", last_name: "", email: "", password: "", ...body }, CREATE_KEYS, null);
    if (errors.length) return invalid(errors);
    const user: User = {
      id: crypto.randomUUID(),
      firstName: body["first_name"] as string,
      lastName: body["last_name"] as string,
      email: body["email"] as string,
      role: (body["role"] as User["role"] | undefined) ?? "user",
      confirmedAt: body["confirmed"] === true ? now() : null,
      insertedAt: now(),
      mfaEnabled: false,
      githubConnected: false,
      experimentalFeatures: false,
      supportUser: false,
      disabled: false,
      scheduledDeletion: null,
      contactPreference: "critical",
    };
    people.push(user);
    setPassword(user.id, body["password"] as string);
    return json(201, userJson(user));
  },

  "PATCH /api/users/:id": ({ id }, body) => {
    const me = currentUser();
    if (id !== me.id) return changeSomeoneElse(id, body);
    if (("email" in body || "password" in body) && !isSteppedUp()) return stepUpRequired();
    const errors = check(body, OWN_KEYS, me);
    if (errors.length) return invalid(errors);
    if ("first_name" in body) me.firstName = body["first_name"] as string;
    if ("last_name" in body) me.lastName = body["last_name"] as string;
    if ("contact_preference" in body) me.contactPreference = body["contact_preference"] as typeof me.contactPreference;
    if ("experimental_features" in body) me.experimentalFeatures = body["experimental_features"] as boolean;
    if ("email" in body) pendingEmails.set(me.id, body["email"] as string);
    // The fake has one session, this one, so there are no others to end. ponytail: the person's tokens aren't
    // revoked; move the token list out of index.ts and clear it here if a test uses one after.
    if ("password" in body) setPassword(me.id, body["password"] as string);
    return json(200, userJson(me));
  },

  // Planned: a person schedules their own deletion with a stepped-up session, and is signed out at once. A superuser
  // schedules anyone else's without stepping up (which tokens may is a gap: docs/api-gaps.md, Superuser access).
  "DELETE /api/users/:id": ({ id }) => {
    const me = currentUser();
    const self = id === me.id;
    if (!self && me.role !== "superuser") return forbidden();
    const user = people.find((u) => u.id === id);
    if (!user) return notFound();
    if (self && !isSteppedUp()) return stepUpRequired();
    // Lightning refuses to schedule a superuser (User.scheduled_deletion_changeset); api/ doesn't say how (docs/api-gaps.md).
    if (user.role === "superuser") return problem({ status: 403, code: "forbidden", detail: "You can't delete a superuser account." });
    if (user.scheduledDeletion) return problem({ status: 409, code: "scheduled_for_deletion", detail: "This account is already scheduled for deletion." });
    user.scheduledDeletion = now(new Date(Date.now() + PURGE_DELETED_AFTER_DAYS * DAY_MS));
    // Disabled, so they can't sign back in. ponytail: the fake has one session, so only your own ends, and tokens
    // aren't revoked; add both if a test signs in as the target after.
    user.disabled = true;
    if (self) endSession();
    return noContent();
  },

  "DELETE /api/users/:id/scheduled_deletion": ({ id }) => {
    if (currentUser().role !== "superuser") return forbidden();
    const user = people.find((u) => u.id === id);
    if (!user) return notFound();
    if (!user.scheduledDeletion) return problem({ status: 404, code: "not_found", detail: "This user isn't scheduled for deletion." });
    user.scheduledDeletion = null;
    user.disabled = false;
    return json(200, userJson(user));
  },

  "DELETE /api/me/github_connection": () => {
    currentUser().githubConnected = false;
    return noContent();
  },
};
