import { useParams } from "react-router-dom";
import { useDataclip } from "@/api/dataclips";
import { useCurrentProject, useProjectTree } from "@/api/projects";
import { projectLabel } from "@/components/shell/projectPickerItems";
import DataclipShowPage from "./DataclipShowPage";

/**
 * DataclipShowPage's query, under ProjectGate: one dataclip with its body
 * from the API. The API answers for any project the person may open, so a
 * dataclip from another project is Not Found here. It only passes data.
 */
export default function DataclipShowPageQuery() {
  const { projectId = "", dataclipId = "" } = useParams();
  const project = useCurrentProject(projectId);
  // The shell's picker already loads the tree, so the sandbox label costs no request.
  const { projects } = useProjectTree();
  const { status, dataclip } = useDataclip(dataclipId);
  const shown = dataclip?.projectId === project.id ? dataclip : undefined;

  return (
    <DataclipShowPage
      project={project}
      projectLabel={projectLabel(project, projects)}
      status={dataclip && !shown ? { state: "notFound" } : status}
      dataclip={shown?.detail ?? null}
      body={shown?.body}
      historyHref={`/projects/${project.id}/history`}
    />
  );
}
