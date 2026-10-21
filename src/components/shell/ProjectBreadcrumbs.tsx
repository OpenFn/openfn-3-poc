import type { ReactNode } from "react";
import type { Project } from "../../types/projects";
import { Breadcrumb, BreadcrumbPicker, Breadcrumbs } from "../Breadcrumbs";
import PickerButton from "./PickerButton";
import { projectLabel } from "./projectPickerItems";
// eslint-disable-next-line no-restricted-imports -- wiring: a sandbox's ancestors, for the "parent/child" picker label.
import { projects } from "../../mock-data/projects";

interface Props {
  project: Pick<Project, "id" | "parentId" | "color"> & Partial<Pick<Project, "name">>;
  /** The picker's label ("parent/child" for a sandbox). The host supplies it; the replica derives it from the fixtures. */
  label?: string | undefined;
  /** Crumbs between the project and the page, e.g. [["History", "/projects/x/history"]]. */
  items?: [label: string, to: string][];
  /** The current page's crumb (not a link). */
  current?: ReactNode;
}

/** Breadcrumbs for a project page: the project picker, then the trail. */
export default function ProjectBreadcrumbs({ project, label, items = [], current }: Props) {
  return (
    <Breadcrumbs>
      <BreadcrumbPicker>
        <PickerButton
          label={label ?? projectLabel(projects.find((p) => p.id === project.id) ?? (project as Project), projects)}
          isSandbox={project.parentId !== null}
          color={project.color}
        />
      </BreadcrumbPicker>
      {items.map(([label, to]) => (
        <Breadcrumb key={to} to={to}>
          {label}
        </Breadcrumb>
      ))}
      {current && <Breadcrumb>{current}</Breadcrumb>}
    </Breadcrumbs>
  );
}
