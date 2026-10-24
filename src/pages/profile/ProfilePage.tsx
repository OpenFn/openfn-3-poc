import Header from "../../components/Header";
import { Centered, PageContent } from "../../components/PageContent";
import UserInfo from "../../components/profile/UserInfo";
import { BasicInfoForm, ChangeEmailForm, ChangePasswordForm } from "../../components/profile/ProfileForms";
import MfaCard from "../../components/profile/MfaCard";
import GithubCard from "../../components/profile/GithubCard";
import ExperimentalFeaturesCard from "../../components/profile/ExperimentalFeaturesCard";
import DeleteAccountCard from "../../components/profile/DeleteAccountCard";
import UserDeletionModal from "../../components/admin/UserDeletionModal";
import type {
  AccountDeletionSettings,
  BasicInfoValues,
  ChangeEmailValues,
  ChangePasswordValues,
  GithubAccessSettings,
  MfaSettings,
  MfaSetupResult,
  ProfileDetail,
} from "../../types/profile";

/**
 * The contract between this page and whatever feeds it (the replica wrapper,
 * later Lightning). Every action resolves once the host has answered; the
 * host announces success (its flash) and moves the user on where Lightning
 * does, and the page says what went wrong. Unless an action says otherwise,
 * a rejection's message shows where the user acted (in the form's card, or in
 * the modal, which stays open).
 */
export interface ProfilePageProps {
  /**
   * The signed-in user. The basic information form starts from these values
   * when it mounts or `user.id` changes; new values for the same user don't
   * reset what's being typed.
   */
  user: ProfileDetail;
  mfa: MfaSettings;
  /**
   * Linking happens in another tab, so the host watches for it to finish, then
   * sends the new `status` and announces "GitHub account linked successfully",
   * or "Oops! GitHub account failed to link. Please try again" (Lightning's
   * `OauthTokenAdded` / `OauthTokenFailed` events).
   */
  github: GithubAccessSettings;
  /** The user's "experimental_features" preference. */
  experimentalFeatures: boolean;
  deletion: AccountDeletionSettings;
  /** The deletion modal is open (/profile/:id/delete, for the user's own id). */
  deleting: boolean;

  /** Saves "Change basic information". Rejects with field errors (`firstName`, `lastName`, `contactPreference`) or a message. On success the host reloads the page's data. */
  onSaveBasicInfo: (values: BasicInfoValues) => Promise<void>;
  /** Asks to change the email address (the host emails a confirmation link). Rejects with field errors (`email`, `currentPassword`) or a message. The form empties on success. */
  onChangeEmail: (values: ChangeEmailValues) => Promise<void>;
  /** Changes the password. Rejects with field errors (`password`, `passwordConfirmation`, `currentPassword`) or a message. On success the host signs the user in again, as Lightning does. */
  onChangePassword: (values: ChangePasswordValues) => Promise<void>;
  /** Starts MFA setup with a new secret, which comes back only in this reply. The host keeps it for `onConfirmMfa`. A rejection's message shows as an error toast and the switch stays off. */
  onStartMfaSetup: () => Promise<MfaSetupResult>;
  /**
   * Finishes MFA setup with the code from the app. Rejects with field errors (`code`: "invalid code") or a message.
   * On success, after a first setup the host moves the user on to the recovery codes (Lightning gives that page a
   * sudo token); after "Setup another device" it reloads the page's data.
   */
  onConfirmMfa: (code: string) => Promise<void>;
  /** Removes the authenticator app. On success the host reloads the page's data. */
  onDisableMfa: () => Promise<void>;
  /** Removes the GitHub link. On success the host reloads the page's data. */
  onDisconnectGithub: () => Promise<void>;
  /** Saves on every flip of the switch. On a rejection the switch goes back and its message shows as an error toast. */
  onSetExperimentalFeatures: (on: boolean) => Promise<void>;
  /**
   * Deletes the account with the email the user typed. The host checks the email and refuses a superuser; the
   * message shows in the modal. The host moves the user on.
   */
  onDeleteAccount: (email: string) => Promise<void>;
  /** Closes the deletion modal: Cancel, Escape or the backdrop. */
  onCloseDelete: () => void;
}

/**
 * Inventory views `profile-account`, `profile-mfa`, `profile-github`,
 * `profile-experimental-features` and `profile-delete-account`
 * (profile_live/edit.html.heex): user info on the left, the cards on the
 * right. `deleting` opens the deletion modal over the page. Props only, so it
 * can run unchanged in Lightning; the replica's data lives in
 * ProfilePage.replica.tsx.
 */
export default function ProfilePage(props: ProfilePageProps) {
  const { user, deletion } = props;
  return (
    <PageContent header={<Header title="User Profile" />}>
      <Centered>
        {/* Keyed by user so the forms start again from a new user's values. */}
        <div key={user.id} className="grid gap-8 md:grid-cols-3">
          <UserInfo user={user} />
          <div id={`user-${user.id}`} className="space-y-4 md:col-span-2">
            <BasicInfoForm
              values={{ firstName: user.firstName, lastName: user.lastName, contactPreference: user.contactPreference }}
              onSave={props.onSaveBasicInfo}
            />
            <ChangeEmailForm onSubmit={props.onChangeEmail} />
            <ChangePasswordForm onSubmit={props.onChangePassword} />
            <MfaCard
              mfa={props.mfa}
              onStartSetup={props.onStartMfaSetup}
              onConfirm={props.onConfirmMfa}
              onDisable={props.onDisableMfa}
            />
            <GithubCard github={props.github} onDisconnect={props.onDisconnectGithub} />
            <ExperimentalFeaturesCard enabled={props.experimentalFeatures} onChange={props.onSetExperimentalFeatures} />
            <DeleteAccountCard to={deletion.href} />
          </div>
        </div>
      </Centered>
      {props.deleting && (
        <UserDeletionModal
          isCurrentUser
          email={user.email}
          hasActivityInProjects={deletion.hasActivityInProjects}
          blocked={deletion.blocked}
          onClose={props.onCloseDelete}
          onDelete={props.onDeleteAccount}
        />
      )}
    </PageContent>
  );
}
