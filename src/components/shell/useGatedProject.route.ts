// eslint-disable-next-line no-restricted-imports -- wiring: reads the project id ProjectGate matched.
import { useParams } from "react-router-dom";
import { useLoadedProject } from "@/api/projects";

/**
 * The project, for a route under ProjectGate. Never check whether it exists:
 * the gate already showed Not Found or No Access instead of the route.
 */
export function useGatedProject() {
  const { projectId = "" } = useParams();
  return useLoadedProject(projectId);
}
