// eslint-disable-next-line no-restricted-imports -- wiring: reads the project id ProjectGate matched.
import { useParams } from "react-router-dom";
import { useProject } from "@/api/projects";

/** The project, for a route under ProjectGate (STANDARDS pattern 11). */
export function useCurrentProject() {
  const { projectId = "" } = useParams();
  const { project } = useProject(projectId);
  if (!project) throw new Error("useCurrentProject is for routes under ProjectGate, which loads the project first");
  return project;
}
