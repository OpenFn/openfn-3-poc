/**
 * Users on the pretend server: api/users.md (Create, Update and Delete a
 * user) and api/account.md (GitHub). Creating is built for first setup and sign-up.
 * Changing is the planned scope for your own id; a superuser changing
 * someone else isn't built, so another id is refused.
 */
import { forbidden, invalid, json, noContent, now, problem, stepUpRequired, type Body, type Handler, type Problem } from "./answers";
import type { User } from "@/types/users";
import { isValidEmail } from "@/utils/validate";
import { allowSignup, needsSetup, setNeedsSetup } from "./instance";
import {
  currentUser,
  endSession,
  isSignedIn,
  isSteppedUp,
  passwordErrors,
  pendingEmails,
  people,
  setPassword,
  startSession,
  unauthenticated,
  userJson,
} from "./session";

// Planned: what a person may change on their own account (api/users.md, Update a user).
const OWN_KEYS = ["first_name", "last_name", "contact_preference", "email", "password", "experimental_features", "consent", "ai_disclaimer_accepted"];

const unknownKeys = (body: Body, known: string[]): NonNullable<Problem["errors"]> =>
  Object.keys(body)
    .filter((key) => !known.includes(key))
    .map((key) => ({ code: "unknown_key", detail: "is not a known field", pointer: `#/${key}` }));

function check(body: Body): NonNullable<Problem["errors"]> {
  const errors = unknownKeys(body, OWN_KEYS);
  for (const key of ["first_name", "last_name"]) {
    if (key in body && (typeof body[key] !== "string" || !(body[key] as string).trim())) {
      errors.push({ code: "required", detail: "can't be blank", pointer: `#/${key}` });
    }
  }
  if ("contact_preference" in body && !["critical", "any"].includes(body["contact_preference"] as string)) {
    errors.push({ code: "invalid", detail: "is invalid", pointer: "#/contact_preference" });
  }
  if ("experimental_features" in body && typeof body["experimental_features"] !== "boolean") {
    errors.push({ code: "type", detail: "must be true or false", pointer: "#/experimental_features" });
  }
  const email = body["email"];
  if (email !== undefined) {
    const me = currentUser();
    // Lightning's change_user_email: the same address exactly is unchanged; any case of a used one is taken.
    if (typeof email !== "string" || !isValidEmail(email)) {
      errors.push({ code: "format", detail: "must have the @ sign and no spaces", pointer: "#/email" });
    } else if (email === me.email) {
      errors.push({ code: "unchanged", detail: "has not changed", pointer: "#/email" });
    } else if (people.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
      errors.push({ code: "taken", detail: "has already been taken", pointer: "#/email" });
    }
  }
  if ("password" in body) errors.push(...passwordErrors(body["password"]));
  return errors;
}

export const userRoutes: Record<string, Handler> = {
  // The shared create (api/users.md, Create a user). While `needs_setup` the first account becomes the superuser
  // (api/account.md), with or without sign-up, terms accepted but not required. Otherwise, with sign-up on,
  // someone signed out registers as a user and must accept the terms. The admin create extends this block; until
  // then, any other create is refused.
  "POST /api/users": (_params, body) => {
    const setup = needsSetup();
    if (!setup && isSignedIn()) return forbidden();
    if (!setup && !allowSignup()) return unauthenticated();
    const keys = ["first_name", "last_name", "email", "password"];
    // Lightning doesn't cast `role` or `confirmed` on sign-up, so they're ignored, not refused (docs/api-gaps.md).
    const ignored = setup ? [] : ["role", "confirmed"];
    const errors = unknownKeys(body, [...keys, "terms_accepted", ...ignored]);
    const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : "");
    for (const key of keys) {
      if (!text(key)) errors.push({ code: "required", detail: "can't be blank", pointer: `#/${key}` });
    }
    const email = text("email").toLowerCase();
    // Lightning's validate_email_format.
    if (email && !isValidEmail(email)) errors.push({ code: "format", detail: "must be a valid email address", pointer: "#/email" });
    else if (email && people.some((u) => u.email.toLowerCase() === email)) errors.push({ code: "taken", detail: "has already been taken", pointer: "#/email" });
    if (text("password")) errors.push(...passwordErrors(body["password"]));
    // Refused when left out too, where Lightning lets a hand-built request through (docs/lightning-differences.md).
    if (!setup && body["terms_accepted"] !== true) {
      errors.push({ code: "must_accept", detail: "Please accept the terms and conditions to register.", pointer: "#/terms_accepted" });
    }
    if (errors.length) return invalid(errors);
    const user: User = {
      id: crypto.randomUUID(),
      firstName: text("first_name"),
      lastName: text("last_name"),
      email,
      role: setup ? "superuser" : "user",
      // As Lightning: unconfirmed, and nothing is emailed.
      confirmedAt: null,
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
    if (setup) setNeedsSetup(false);
    startSession(user.id);
    return json(201, userJson(user));
  },

  "PATCH /api/users/:id": ({ id }, body) => {
    const me = currentUser();
    if (id !== me.id) return forbidden();
    if (("email" in body || "password" in body) && !isSteppedUp()) return stepUpRequired();
    const errors = check(body);
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

  // Planned: a person schedules their own deletion with a stepped-up session, and is signed out at once.
  "DELETE /api/users/:id": ({ id }) => {
    const me = currentUser();
    if (id !== me.id) return forbidden();
    if (!isSteppedUp()) return stepUpRequired();
    // Lightning refuses to schedule a superuser (User.scheduled_deletion_changeset); api/ doesn't say how (docs/api-gaps.md).
    if (me.role === "superuser") return problem({ status: 403, code: "forbidden", detail: "You can't delete a superuser account." });
    if (me.scheduledDeletion) return problem({ status: 409, code: "scheduled_for_deletion", detail: "This account is already scheduled for deletion." });
    me.scheduledDeletion = new Date(Date.now() + 7 * 24 * 60 * 60_000).toISOString();
    // Disabled, so they can't sign back in. ponytail: their tokens aren't revoked; add it if a test uses one after.
    me.disabled = true;
    endSession();
    return noContent();
  },

  "DELETE /api/me/github_connection": () => {
    currentUser().githubConnected = false;
    return noContent();
  },
};
