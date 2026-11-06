/** The instance on the pretend server (api/account.md, Get the instance), and whether it's a fresh install waiting for first setup. */
import { authConfig } from "@/mock-data/auth";
import { session as sessionFixture } from "@/mock-data/users";
import { json, ORIGIN, type Handler } from "./answers";
import { endSession, isSignedIn } from "./session";

/** A fresh install: no superuser yet. */
let setupNeeded = false;
export const needsSetup = () => setupNeeded;

/** Turns a fresh install on (stories and tests) or off (the first create). On ends the session; the fixture users stay, so an email can be taken. */
export function setNeedsSetup(on = true) {
  setupNeeded = on;
  if (on) endSession();
}

/** Whether anyone may sign up. Only tests turn it on. */
let signupAllowed = false;
// ponytail: also reads the fixture, which reset's and confirm's tests still set by hand; auth-cleanup drops it.
export const allowSignup = () => signupAllowed || authConfig.allowSignup;
export function setAllowSignup(on = true) {
  signupAllowed = on;
}

export const instanceRoutes: Record<string, Handler> = {
  "GET /api/instance": () => {
    const provider = authConfig.ssoProvider;
    return json(200, {
      data: {
        needs_setup: setupNeeded,
        allow_signup: allowSignup(),
        url: ORIGIN,
        release: { label: sessionFixture.instance.releaseLabel, commit: null, image_tag: null, branch: null },
        admin_email: isSignedIn() ? sessionFixture.instance.adminEmail : null,
        purge_deleted_after_days: 7,
        sign_in_providers: provider ? [{ name: provider.name, kind: "external", start_url: `${ORIGIN}${provider.handlerUrl}` }] : [],
        ai_assistant: true,
        github_sync: false,
        github_connect_url: null,
      },
    });
  },
};
