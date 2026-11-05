import Alert from "@/components/primitives/Alert";
import { Stack } from "@/components/primitives/Stack";
import { NestedSections } from "@/components/primitives/SectionHeader";
import { useToast } from "@/components/primitives/Toast";
import type { StepUpCredentials } from "@/components/domain/StepUpDialog";
import { useStepUp } from "@/components/domain/useStepUp";
import UserInfo from "@/components/profile/UserInfo";
import { BasicInfoForm, ChangeEmailForm, ChangePasswordForm } from "@/components/profile/ProfileForms";
import MfaCard from "@/components/profile/MfaCard";
import GithubCard from "@/components/profile/GithubCard";
import ExperimentalFeaturesCard from "@/components/profile/ExperimentalFeaturesCard";
import DeleteAccountCard from "@/components/profile/DeleteAccountCard";
import UserDeletionModal from "@/components/domain/UserDeletionModal";
import type { BasicInfoValues, ChangeEmailValues, ChangePasswordValues, MfaSetupResult, ProfilePageData } from "@/types/profile";

/**
 * What its .query file passes in: data, the actions that change it, and
 * where you are. The page announces each success in Lightning's flash words;
 * the host moves the user on where Lightning does.
 */
export interface ProfilePageProps extends ProfilePageData {
  /** The deletion modal is open (/profile/:id/delete, for the user's own id). */
  deleting: boolean;
  /** The URL asked to delete someone else's account, which Lightning refuses here. */
  refused: boolean;
  /** "Recovery codes" → View. */
  backupCodesHref: string;
  /** "Delete my account": the route that opens the deletion modal. */
  deleteHref: string;

  /** Saves "Basic information". */
  onSaveBasicInfo: (values: BasicInfoValues) => Promise<void>;
  /** Asks to change the email address (the host emails a confirmation link). The form empties on success. */
  onChangeEmail: (values: ChangeEmailValues) => Promise<void>;
  /** Changes the password. On success the host moves the user on to the projects, as Lightning does. */
  onChangePassword: (values: ChangePasswordValues) => Promise<void>;
  /** Starts MFA setup with a new secret, which comes back only in this reply and goes back with `onConfirmMfa`. On a rejection the card stays off. */
  onStartMfaSetup: () => Promise<MfaSetupResult>;
  /**
   * Finishes MFA setup with the code from the app and the secret `onStartMfaSetup` gave. Field errors are keyed `code`,
   * in Lightning's words. After a first setup the host moves the user on to the recovery codes.
   */
  onConfirmMfa: (code: string, secret: string) => Promise<void>;
  /** Removes the authenticator app, once confirmed. */
  onDisableMfa: () => Promise<void>;
  /** Removes the GitHub link, once confirmed. */
  onDisconnectGithub: () => Promise<void>;
  onSetExperimentalFeatures: (on: boolean) => Promise<void>;
  /** Schedules the account's deletion, once the user has typed its email. May be refused until you confirm it's you. The host signs the user out. */
  onDeleteAccount: () => Promise<void>;
  /** Closes the deletion modal: Cancel, Escape or the backdrop. */
  onCloseDelete: () => void;
  /** Whether a refusal means "confirm it's you first" (the API's step_up_required). Disabling MFA and deleting the account then ask for the password and try again. */
  isStepUpRequired: (error: unknown) => boolean;
  /** Confirms it's you with a password or authenticator code. Rejects with the server's words when it's wrong. */
  onStepUp: (credentials: StepUpCredentials) => Promise<void>;
}

/**
 * Inventory views `profile-account`, `profile-mfa`, `profile-github`,
 * `profile-experimental-features` and `profile-delete-account`
 * (profile_live/edit.html.heex): user info on the left, the cards on the
 * right. `deleting` opens the deletion modal over the page. Lightning's
 * optional GDPR preferences card isn't part of the page: an instance that
 * configures it renders it beside the page.
 */
export default function ProfilePage(props: ProfilePageProps) {
  const { user, deletion } = props;
  const toast = useToast();
  const announce =
    <Args extends unknown[]>(action: (...args: Args) => Promise<unknown>, message: string) =>
    async (...args: Args) => {
      await action(...args);
      toast(message);
    };
  const stepUp = { isStepUpRequired: props.isStepUpRequired, stepUp: props.onStepUp, hasMfa: props.mfa.enabled };
  const [disableMfa, disableMfaStepUp] = useStepUp(props.onDisableMfa, { ...stepUp, description: "Confirm it's you to turn off MFA." });
  const [deleteAccount, deleteStepUp] = useStepUp(props.onDeleteAccount, { ...stepUp, description: "Confirm it's you to delete your account." });
  return (
    <>
      {disableMfaStepUp}
      {deleteStepUp}
      <Stack gap="lg">
        {/* edit.ex's flash for someone else's delete URL. */}
        {props.refused && <Alert tone="danger">You can't perform this action</Alert>}
        {/* Keyed by user so the forms start again from a new user's values. */}
        <div key={user.id} className="grid gap-8 @3xl:grid-cols-3">
          {/* Its h2, the user's name, heads the section, as in Brandon's; the cards sit under it. */}
          <UserInfo user={user} />
          <NestedSections>
            <div id={`user-${user.id}`} className="space-y-4 @3xl:col-span-2">
              <BasicInfoForm
                values={{
                  first_name: user.firstName,
                  last_name: user.lastName,
                  contact_preference: user.contactPreference,
                }}
                onSave={announce(props.onSaveBasicInfo, "User information updated successfully")}
              />
              <ChangeEmailForm onSubmit={announce(props.onChangeEmail, "You will receive an email with instructions shortly.")} />
              <ChangePasswordForm onSubmit={announce(props.onChangePassword, "Password changed successfully.")} />
              <MfaCard
                mfa={props.mfa}
                backupCodesHref={props.backupCodesHref}
                onStartSetup={props.onStartMfaSetup}
                onConfirm={announce(props.onConfirmMfa, "MFA Setup")}
                onDisable={announce(disableMfa, "MFA Disabled")}
              />
              <GithubCard github={props.github} onDisconnect={announce(props.onDisconnectGithub, "GitHub connection removed successfully")} />
              <ExperimentalFeaturesCard
                enabled={props.experimentalFeatures}
                onChange={announce(props.onSetExperimentalFeatures, "Experimental features updated successfully")}
              />
              <DeleteAccountCard to={props.deleteHref} />
            </div>
          </NestedSections>
        </div>
      </Stack>
      {props.deleting && (
        <UserDeletionModal
          isCurrentUser
          email={user.email}
          hasActivityInProjects={deletion.hasActivityInProjects}
          blocked={deletion.blocked}
          onClose={props.onCloseDelete}
          onDelete={announce(deleteAccount, "User scheduled for deletion")}
        />
      )}
    </>
  );
}
