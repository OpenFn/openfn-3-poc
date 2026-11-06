/** The planned `permissions` on GET /api/projects/:id (api/projects.md): what the caller may do in a project, from the same rules as src/permissions.ts. */
import { permissionsFor, type Permissions } from "@/permissions";
import type { Project, ProjectAction } from "@/types/projects";
import { currentUser } from "./session";

const PERMISSIONS: Record<ProjectAction, keyof Permissions> = {
  access_project: "canAccessProject",
  delete_project: "canDeleteProject",
  edit_project: "canEditProject",
  edit_data_retention: "canEditDataRetention",
  edit_run_settings: "canEditRunSettings",
  add_project_user: "canAddProjectUser",
  remove_project_user: "canRemoveProjectUser",
  write_webhook_auth_method: "canWriteWebhookAuthMethod",
  write_github_connection: "canInstallGithub",
  create_workflow: "canCreateWorkflow",
  edit_workflow: "canEditWorkflow",
  delete_workflow: "canDeleteWorkflow",
  run_workflow: "canRunWorkflow",
  create_project_credential: "canCreateProjectCredential",
  initiate_github_sync: "canInitiateGithubSync",
  create_channel: "canCreateChannel",
  update_channel: "canEditChannel",
  delete_channel: "canDeleteChannel",
  edit_failure_alerts: "canEditFailureAlerts",
  edit_digest_alerts: "canEditDigestAlerts",
  create_keychain_credential: "canCreateKeychainCredential",
  manage_collection: "canCreateCollection",
  provision_sandbox: "canCreateSandbox",
};
export const permissionsIn = (p: Project) => {
  const can = permissionsFor(p, currentUser());
  return Object.fromEntries(Object.entries(PERMISSIONS).map(([name, flag]) => [name, can[flag]]));
};
