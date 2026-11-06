import { Navigate, useParams } from "react-router-dom";
import { useChannelRequest, useChannels } from "@/api/channels";
import { combinedStatus } from "@/api/client";
import { useCurrentProject, useProjectAdminEmails, useProjectPermissions, useProjectTree } from "@/api/projects";
import { projectLabel } from "@/components/shell/projectPickerItems";
import { useCurrentUser } from "@/session/session";
import ChannelRequestShowPage from "./ChannelRequestShowPage";

/**
 * ChannelRequestShowPage's query, under ProjectGate: one channel request from
 * the API, beside the project's channels. The API answers for any project the
 * person may open, so a request whose channel isn't in this project's list is
 * Not Found here, and that list's version says whether the config changed.
 * Without experimental features it goes to History, as Lightning does.
 */
export default function ChannelRequestShowPageQuery() {
  const { projectId = "", requestId = "" } = useParams();
  const project = useCurrentProject(projectId);
  const can = useProjectPermissions(project.id);
  // The shell's picker already loads the tree, so the sandbox label costs no request.
  const { projects } = useProjectTree();
  const adminContacts = useProjectAdminEmails(project.id);
  const user = useCurrentUser();
  const { status: requestStatus, channelRequest } = useChannelRequest(requestId);
  const { status: channelsStatus, channels } = useChannels(project.id);
  const status = combinedStatus(requestStatus, channelsStatus);
  const channel = channels.find((c) => c.id === channelRequest?.channelId);
  const base = `/projects/${project.id}`;

  if (!user.experimentalFeatures) return <Navigate to={`${base}/history`} replace />;

  return (
    <ChannelRequestShowPage
      project={project}
      projectLabel={projectLabel(project, projects)}
      status={status.state === "ready" && !channel ? { state: "notFound" } : status}
      request={channel ? (channelRequest ?? null) : null}
      // The page reads these two only beside the request, which shows only once its channel is listed.
      channelLockVersion={channel?.lockVersion ?? 0}
      channelHref={`${base}/channels/${channel?.id ?? ""}/edit`}
      canEditDataRetention={can("edit_data_retention")}
      adminContacts={adminContacts}
      historyHref={`${base}/history`}
      channelLogsHref={`${base}/history/channels`}
    />
  );
}
