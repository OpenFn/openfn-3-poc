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
import type { ButtonAction, ChoiceAction, FormAction, ModalAction } from "../../types/actions";

/**
 * The contract between this page and whatever feeds it (the replica wrapper,
 * later Lightning). Each action's type (types/actions.ts) says where a
 * rejection shows. The host announces success (its flash) and moves the user
 * on where Lightning does.
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

  /** Saves "Change basic information". On success the host reloads the page's data. */
  onSaveBasicInfo: FormAction<BasicInfoValues>;
  /** Asks to change the email address (the host emails a confirmation link). The form empties on success. */
  onChangeEmail: FormAction<ChangeEmailValues>;
  /** Changes the password. On success the host signs the user in again, as Lightning does. */
  onChangePassword: FormAction<ChangePasswordValues>;
  /** Starts MFA setup with a new secret, which comes back only in this reply. The host keeps it for `onConfirmMfa`. On a rejection the switch stays off. */
  onStartMfaSetup: ButtonAction<[], MfaSetupResult>;
  /**
   * Finishes MFA setup with the code from the app, submitted from the setup form. Field errors are keyed `code` ("invalid code").
   * On success, after a first setup the host moves the user on to the recovery codes (Lightning gives that page a
   * sudo token); after "Setup another device" it reloads the page's data.
   */
  onConfirmMfa: FormAction<string>;
  /** Removes the authenticator app, once confirmed. On success the host reloads the page's data. */
  onDisableMfa: ModalAction;
  /** Removes the GitHub link, once confirmed. On success the host reloads the page's data. */
  onDisconnectGithub: ModalAction;
  onSetExperimentalFeatures: ChoiceAction<boolean>;
  /** Deletes the account with the email the user typed. The host moves the user on. */
  onDeleteAccount: ModalAction<[email: string]>;
  /** Closes the deletion modal: Cancel, Escape or the backdrop. */
  onCloseDelete: () => void;
}

/**
 * Inventory views `profile-account`, `profile-mfa`, `profile-github`,
 * `profile-experimental-features` and `profile-delete-account`
 * (profile_live/edit.html.heex): user info on the left, the cards on the
 * right. `deleting` opens the deletion modal over the page. Props only, so it
 * can run unchanged in Lightning; the replica's data lives in
 * ProfilePage.replica.tsx. Lightning's optional GDPR preferences card isn't
 * part of the page: an instance that configures it renders it beside the page.
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
