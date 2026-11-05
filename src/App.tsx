import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/shell/AppShell.query";
import ProjectGate from "./components/shell/ProjectGate.query";
import SessionGate from "./components/shell/SessionGate.query";
import LogOut from "./components/shell/LogOut.query";

import AuthLoginPage from "./pages/auth/login/AuthLoginPage.query";
import AuthRegisterPage from "./pages/auth/AuthRegisterPage";
import AuthResetPasswordPage from "./pages/auth/AuthResetPasswordPage";
import AuthTwoFactorPage from "./pages/auth/two-factor/AuthTwoFactorPage.query";
import AuthConfirmAccountPage from "./pages/auth/AuthConfirmAccountPage";
import AuthConfirmationRequiredPage from "./pages/auth/AuthConfirmationRequiredPage.replica";
import AuthConfirmAccessPage from "./pages/auth/confirm-access/AuthConfirmAccessPage.query";
import FirstSetupPage from "./pages/auth/FirstSetupPage.replica";

import ProjectsDashboardPage from "./pages/projects/dashboard/ProjectsDashboardPage.query";
import MfaRequiredPage from "./pages/projects/MfaRequiredPage";
import WorkflowsIndexPage from "./pages/projects/workflows/WorkflowsIndexPage.query";
import WorkflowHealthPage from "./pages/projects/WorkflowHealthPage.replica";
import SandboxesIndexPage from "./pages/projects/SandboxesIndexPage.replica";
import ChannelsIndexPage from "./pages/projects/ChannelsIndexPage.replica";
import WorkflowEditorPage from "./pages/workflow-editor/WorkflowEditorPage";

import HistoryWorkOrdersPage from "./pages/history/HistoryWorkOrdersPage.replica";
import HistoryChannelLogsPage from "./pages/history/HistoryChannelLogsPage.replica";
import ChannelRequestShowPage from "./pages/history/ChannelRequestShowPage.replica";
import RunShowPage from "./pages/history/RunShowPage.replica";
import DataclipShowPage from "./pages/history/DataclipShowPage.replica";

import ProjectSettingsPage from "./pages/project-settings/ProjectSettingsPage.replica";

import CredentialsIndexPage from "./pages/profile/CredentialsIndexPage.replica";
import ProfilePage from "./pages/profile/ProfilePage.replica";
import TokensPage from "./pages/profile/tokens/TokensPage.query";
import BackupCodesPage from "./pages/profile/BackupCodesPage.replica";

import AdminUsersPage from "./pages/admin/AdminUsersPage.replica";
import AdminUserEditPage from "./pages/admin/AdminUserEditPage.replica";
import AdminProjectsPage from "./pages/admin/AdminProjectsPage.replica";
import AdminAuditPage from "./pages/admin/AdminAuditPage.replica";
import AdminMaintenancePage from "./pages/admin/AdminMaintenancePage.replica";
import AdminAuthProvidersPage from "./pages/admin/AdminAuthProvidersPage.replica";
import AdminCollectionsPage from "./pages/admin/AdminCollectionsPage.replica";
import AdminLiveDashboardPage from "./pages/admin/AdminLiveDashboardPage";

/**
 * Every route mirrors a Lightning URL (lib/lightning_web/router.ex) so the
 * demo lines up 1:1 with the audit in OpenFn/lightning `annotations/`.
 * The comment on each route is its INVENTORY.md id.
 */
export default function App() {
  return (
    <Routes>
      {/* Auth and onboarding: no side menu. */}
      <Route path="/users/log_in" element={<AuthLoginPage />} /> {/* auth-login */}
      <Route path="/users/log_out" element={<LogOut />} />
      <Route path="/users/register" element={<AuthRegisterPage />} /> {/* auth-register */}
      <Route path="/users/reset_password" element={<AuthResetPasswordPage />} /> {/* auth-reset-password */}
      <Route path="/users/reset_password/:token" element={<AuthResetPasswordPage />} />
      <Route path="/users/two-factor" element={<AuthTwoFactorPage />} /> {/* auth-two-factor */}
      <Route path="/users/confirm" element={<AuthConfirmAccountPage />} /> {/* auth-confirm-account */}
      <Route path="/users/confirm/:token" element={<AuthConfirmAccountPage />} />
      <Route path="/users/confirm-required" element={<AuthConfirmationRequiredPage />} /> {/* auth-confirmation-required */}
      <Route path="/first_setup" element={<FirstSetupPage />} /> {/* first-setup */}

      {/* Everything below needs someone signed in: SessionGate loads them, or sends the person to log in. */}
      <Route element={<SessionGate />}>
        <Route path="/auth/confirm_access" element={<AuthConfirmAccessPage />} /> {/* auth-confirm-access */}

        {/* Phoenix LiveDashboard is a full page of its own, outside Lightning's layout. */}
        <Route path="/dashboard" element={<AdminLiveDashboardPage />} /> {/* admin-live-dashboard */}

        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/projects" replace />} />
          <Route path="/projects" element={<ProjectsDashboardPage />} /> {/* projects-dashboard */}
          <Route path="/mfa_required" element={<MfaRequiredPage />} /> {/* mfa-required */}

          {/* shared-project-scope: ProjectGate loads the project once, then the page renders. */}
          <Route path="/projects/:projectId" element={<ProjectGate />}>
            <Route index element={<Navigate to="w" replace />} />
            <Route path="w" element={<WorkflowsIndexPage />} /> {/* workflows-index */}
            {/* workflow-editor-*: canvas, new, inspectors, IDE, manual run, run viewer, AI, versions */}
            <Route path="w/new" element={<WorkflowEditorPage />} />
            <Route path="w/:workflowId" element={<WorkflowEditorPage />} />
            <Route path="w/:workflowId/health" element={<WorkflowHealthPage />} /> {/* workflow-health */}
            <Route path="sandboxes" element={<SandboxesIndexPage />} /> {/* sandboxes-index */}
            <Route path="sandboxes/new" element={<SandboxesIndexPage />} />
            <Route path="sandboxes/:sandboxId/edit" element={<SandboxesIndexPage />} />
            <Route path="channels" element={<ChannelsIndexPage />} /> {/* channels-index */}
            <Route path="channels/new" element={<ChannelsIndexPage />} />
            <Route path="channels/:channelId/edit" element={<ChannelsIndexPage />} />

            <Route path="history" element={<HistoryWorkOrdersPage />} /> {/* history-work-orders */}
            <Route path="history/channels" element={<HistoryChannelLogsPage />} /> {/* history-channel-logs */}
            <Route path="history/channels/:requestId" element={<ChannelRequestShowPage />} /> {/* channel-request-show */}
            <Route path="runs/:runId" element={<RunShowPage />} /> {/* run-show */}
            <Route path="dataclips/:dataclipId/show" element={<DataclipShowPage />} /> {/* dataclip-show */}

            {/* project-settings-*: one page, panels picked by the URL hash. */}
            <Route path="settings" element={<ProjectSettingsPage />} />
            <Route path="settings/delete" element={<ProjectSettingsPage />} />
          </Route>

          <Route path="/credentials" element={<CredentialsIndexPage />} /> {/* credentials-index */}
          <Route path="/profile" element={<ProfilePage />} /> {/* profile-* */}
          <Route path="/profile/:userId/delete" element={<ProfilePage />} /> {/* profile-delete-account */}
          <Route path="/profile/tokens" element={<TokensPage />} /> {/* profile-tokens */}
          <Route path="/profile/tokens/:tokenId/delete" element={<TokensPage />} />
          <Route path="/profile/auth/backup_codes" element={<BackupCodesPage />} /> {/* profile-backup-codes */}

          {/* Admin (superuser) */}
          <Route path="/settings" element={<Navigate to="/settings/projects" replace />} />
          <Route path="/settings/users" element={<AdminUsersPage />} /> {/* admin-users */}
          <Route path="/settings/users/:userId/delete" element={<AdminUsersPage />} />
          <Route path="/settings/users/new" element={<AdminUserEditPage />} /> {/* admin-user-edit */}
          <Route path="/settings/users/:userId" element={<AdminUserEditPage />} />
          <Route path="/settings/projects" element={<AdminProjectsPage />} /> {/* admin-projects */}
          <Route path="/settings/projects/new" element={<AdminProjectsPage />} />
          <Route path="/settings/projects/:projectId" element={<AdminProjectsPage />} />
          <Route path="/settings/projects/:projectId/delete" element={<AdminProjectsPage />} />
          <Route path="/settings/audit" element={<AdminAuditPage />} /> {/* admin-audit */}
          <Route path="/settings/maintenance" element={<AdminMaintenancePage />} /> {/* admin-maintenance */}
          <Route path="/settings/authentication" element={<AdminAuthProvidersPage />} /> {/* admin-auth-providers */}
          <Route path="/settings/authentication/new" element={<AdminAuthProvidersPage />} />
          <Route path="/settings/collections" element={<AdminCollectionsPage />} /> {/* admin-collections */}

          <Route path="*" element={<Navigate to="/projects" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
