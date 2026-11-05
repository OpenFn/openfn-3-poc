import { useNavigate, useParams } from "react-router-dom";
import { isApiError } from "@/api/client";
import { useMfaSaves } from "@/api/mfa";
import { useAccountSaves, useProfile, useSessionSaves } from "@/api/session";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import { RequestError } from "@/utils/errors";
import type { ProfilePageData } from "@/types/profile";
import ProfilePage from "./ProfilePage";

/** Lightning's words for a wrong current password (`Accounts.apply_user_email`, `update_user_password`), on its field. */
const onCurrentPassword =
  <Values,>(save: (values: Values) => Promise<void>) =>
  (values: Values) =>
    save(values).catch((error: unknown) => {
      if (!isApiError(error, "invalid_credentials")) throw error;
      throw new RequestError("is not valid", { fieldErrors: { currentPassword: ["is not valid"] } });
    });

/**
 * ProfilePage's .query file: loads you from the API, reads the deletion
 * modal's user from the URL, and moves you on where Lightning does: to
 * /projects after a new password, to the backup codes after a first MFA
 * setup, and out after scheduling your deletion. It holds the page back until
 * you've loaded, as ProjectGate does, so the saves have your id. It only
 * passes data and actions; the toasts and the password popup are the page's.
 */
export default function ProfilePageQuery() {
  const { status, profile } = useProfile();
  if (!profile) return <AsyncBoundary status={status} />;
  return <Loaded profile={profile} />;
}

const backupCodesHref = "/profile/auth/backup_codes";

function Loaded({ profile }: { profile: ProfilePageData }) {
  const { userId } = useParams();
  const navigate = useNavigate();
  const id = profile.user.id;
  const account = useAccountSaves(id);
  const mfa = useMfaSaves();
  const { stepUp } = useSessionSaves();
  return (
    <ProfilePage
      {...profile}
      deleting={userId === id}
      // Lightning only lets you delete your own account here (Policies.Users :delete_account).
      refused={userId !== undefined && userId !== id}
      backupCodesHref={backupCodesHref}
      deleteHref={`/profile/${id}/delete`}
      onSaveBasicInfo={account.saveBasicInfo}
      onChangeEmail={onCurrentPassword(account.changeEmail)}
      onChangePassword={onCurrentPassword(async (values) => {
        await account.changePassword(values);
        // Lightning signs this browser in again and lands on the projects; the API keeps this session.
        navigate("/projects");
      })}
      onStartMfaSetup={mfa.start}
      onConfirmMfa={async (code, secret) => {
        await mfa.confirm(code, secret);
        // The first setup goes on to the backup codes; the session is stepped up to show them.
        if (!profile.mfa.enabled) navigate(backupCodesHref);
      }}
      onDisableMfa={mfa.disable}
      onDisconnectGithub={account.disconnectGithub}
      onSetExperimentalFeatures={account.setExperimentalFeatures}
      onDeleteAccount={async () => {
        await account.deleteAccount();
        navigate("/users/log_out");
      }}
      onCloseDelete={() => navigate("/profile")}
      isStepUpRequired={(error) => isApiError(error, "step_up_required")}
      onStepUp={stepUp}
    />
  );
}
