import Header from "../../components/primitives/Header";
import { Centered, PageContent } from "../../components/primitives/PageContent";
import ProjectBreadcrumbs from "../../components/shell/ProjectBreadcrumbs";
import DataclipDetailsCard, { DataclipBodyCard } from "../../components/history/DataclipDetailsCard";
import JsonViewer from "../../components/history/JsonViewer";
import type { DataclipBody, DataclipDetail } from "../../types/history";
import type { CurrentProject } from "../../types/projects";
import { shortUuid } from "../../utils/format";

export interface DataclipShowPageProps {
  project: CurrentProject;
  projectLabel: string;
  dataclip: DataclipDetail;
  /** The body (pretty-printed text) or why it could not be loaded; undefined while the host fetches it. Never shown for a wiped dataclip. */
  body: DataclipBody | undefined;
}

/** Inventory view `dataclip-show` (DataclipLive.Show, dataclip_live/show.ex). */
export default function DataclipShowPage({ project, projectLabel, dataclip, body }: DataclipShowPageProps) {
  return (
    <PageContent
      header={
        <Header
          breadcrumbs={
            <ProjectBreadcrumbs
              project={project}
              label={projectLabel}
              current="Dataclip"
            />
          }
          title={`Dataclip ${shortUuid(dataclip.id)}`}
        />
      }
    >
      <Centered>
        <DataclipDetailsCard dataclip={dataclip} />
        <DataclipBodyCard wiped={dataclip.wipedAt !== null}>
          <JsonViewer body={body} />
        </DataclipBodyCard>
      </Centered>
    </PageContent>
  );
}
