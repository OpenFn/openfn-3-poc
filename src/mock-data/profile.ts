/**
 * Profile page settings (/profile). Static fixtures only.
 */
import type { MfaSetupResult, ProfilePageData } from "@/types/profile";
import type { User } from "@/types/users";

/** VersionControl.github_enabled?(): the demo instance has no GitHub app configured, like the reference. */
export const githubOauthEnabled = false;

/** Whether the user has run activity in projects (UserDeletionModal's footnote). */
export const hasActivityInProjects = true;

/** What starting MFA setup answers with: a fake secret and its otpauth URI. */
export const fakeMfaSetup: MfaSetupResult = {
  secret: "DEMOFAKESECRETNOTREAL234",
  otpauthUri: "otpauth://totp/OpenFn:amy@example.org?secret=DEMOFAKESECRETNOTREAL234&issuer=OpenFn",
};

/** The profile page's data for a user, as Lightning's ProfileLive would send it. */
export function profilePropsFor(user: User): ProfilePageData {
  return {
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      contactPreference: user.contactPreference,
      insertedAt: user.insertedAt,
    },
    mfa: { enabled: user.mfaEnabled },
    github: {
      connectHref: githubOauthEnabled ? "https://github.com/login/oauth/authorize?client_id=demo" : null,
      status: user.githubConnected ? "connected" : "none",
    },
    experimentalFeatures: user.experimentalFeatures,
    deletion: {
      hasActivityInProjects,
      // UserDeletionModal: a scheduled account is deleted at once, which project activity blocks.
      blocked: user.scheduledDeletion !== null && hasActivityInProjects,
    },
  };
}
