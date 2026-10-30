import Header from "../../components/primitives/Header";
import { Centered, PageContent } from "../../components/primitives/PageContent";
import { EmptyState } from "../../components/primitives/Table";
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
              current={
                <>
                  Dataclip
                  <span className="pl-2 font-light">{shortUuid(dataclip.id)}</span>
                </>
              }
            />
          }
        />
      }
    >
      <Centered className="space-y-6">
        <DataclipDetailsCard dataclip={dataclip} />
        <DataclipBodyCard>
          {dataclip.wipedAt !== null ? (
            <div className="flex h-full items-center">
              <EmptyState
                variant="plain"
                icon="hero-eye-slash"
                title="No Data Available"
                message="This dataclip's data has been wiped in accordance with the project's data retention policy."
              />
            </div>
          ) : (
            <JsonViewer body={body} />
          )}
        </DataclipBodyCard>
      </Centered>
    </PageContent>
  );
}
