import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { useChannelSaves, useChannels } from "@/api/channels";
import { combinedStatus } from "@/api/client";
import { useProjectCredentialOptions } from "@/api/credentials";
import { useCurrentProject, useProjectPermissions, useProjectTree } from "@/api/projects";
import { useWebhookAuthMethodOptions } from "@/api/webhookAuthMethods";
import { projectLabel } from "@/components/shell/projectPickerItems";
import ChannelsIndexPage from "./ChannelsIndexPage";

/**
 * ChannelsIndexPage's query, under ProjectGate: the project's channels from
 * the API, permissions from the project's planned `permissions`, and the
 * form's options, loaded only while /channels/new or /channels/:id/edit has
 * it open. A form the person may not open, or a channel this project doesn't
 * have, goes back to the list once the list has loaded. Closing replaces the
 * URL, so Back doesn't reopen the form.
 */
export default function ChannelsIndexPageQuery() {
  const { projectId = "", channelId } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const project = useCurrentProject(projectId);
  const can = useProjectPermissions(project.id);
  const { projects } = useProjectTree();
  const list = useChannels(project.id);
  const saves = useChannelSaves(project.id);

  const isNew = pathname.endsWith("/new");
  const creating = isNew && can("create_channel");
  const editRoute = channelId !== undefined && can("update_channel");
  const editing = editRoute ? (list.channels.find((c) => c.id === channelId) ?? null) : null;
  const loadOptions = creating || editRoute;
  const credentials = useProjectCredentialOptions(project.id, loadOptions);
  const authMethods = useWebhookAuthMethodOptions(project.id, loadOptions);
  const formRoute = isNew || channelId !== undefined;
  const leave = formRoute && list.status.state === "ready" && !creating && !editing;

  const base = `/projects/${project.id}`;
  const listHref = `${base}/channels`;

  return (
    <>
      {leave && <Navigate to={listHref} replace />}
      <ChannelsIndexPage
        project={project}
        projectLabel={projectLabel(project, projects)}
        status={list.status}
        channels={list.channels}
        canCreateChannel={can("create_channel")}
        canEditChannel={can("update_channel")}
        canDeleteChannel={can("delete_channel")}
        createHref={`${listHref}/new`}
        editHref={(id) => `${listHref}/${id}/edit`}
        logsHref={(id) => `${base}/history/channels?filters[channel_id]=${id}`}
        credentialsSettingsHref={`${base}/settings#credentials`}
        webhookSecuritySettingsHref={`${base}/settings#webhook_security`}
        creating={creating}
        editing={editing}
        credentialOptions={credentials.options}
        authMethodOptions={authMethods.options}
        optionsStatus={combinedStatus(credentials.status, authMethods.status)}
        onClose={() => navigate(listHref, { replace: true })}
        onCreate={saves.create}
        onUpdate={saves.update}
        onDelete={saves.remove}
      />
    </>
  );
}
