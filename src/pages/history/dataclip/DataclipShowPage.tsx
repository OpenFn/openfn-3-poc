import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import Header from "@/components/primitives/Header";
import { Centered, PageContent } from "@/components/primitives/PageContent";
import EmptyState from "@/components/primitives/EmptyState";
import { Stack } from "@/components/primitives/Stack";
import ProjectBreadcrumbs from "@/components/shell/ProjectBreadcrumbs";
import DataclipDetailsCard, { DataclipBodyCard } from "@/components/history/DataclipDetailsCard";
import JsonViewer from "@/components/history/JsonViewer";
import type { DataclipBody, DataclipDetail } from "@/types/history";
import type { CurrentProject } from "@/types/projects";
import type { ResourceStatus } from "@/types/resource";
import { shortUuid } from "@/utils/format";

/** What the query passes in. Nothing on the page writes, and everyone on the project may read all of it. */
export interface DataclipShowPageProps {
  /** The project ProjectGate loaded, for the breadcrumb's picker. */
  project: CurrentProject;
  /** The picker's label, "parent/child" for a sandbox. */
  projectLabel: string;
  /** Where loading the dataclip stands. Left out, it's ready. */
  status?: ResourceStatus;
  /** The dataclip's details; null until it loads, or when it can't be shown. */
  dataclip: DataclipDetail | null;
  /** The pretty-printed body; undefined until it loads, and for a wiped dataclip. */
  body: DataclipBody | undefined;
  /** The project's History, the breadcrumb's way back. */
  historyHref: string;
}

/** Inventory view `dataclip-show` (DataclipLive.Show, dataclip_live/show.ex). */
export default function DataclipShowPage({ project, projectLabel, status = { state: "ready" }, dataclip, body, historyHref }: DataclipShowPageProps) {
  return (
    <PageContent
      header={
        <Header
          breadcrumbs={<ProjectBreadcrumbs project={project} label={projectLabel} items={[["History", historyHref]]} current="Dataclip" />}
          title={dataclip ? `Dataclip ${shortUuid(dataclip.id)}` : "Dataclip"}
        />
      }
    >
      <Centered>
        <AsyncBoundary status={status}>
          {dataclip && (
            <Stack gap="lg">
              <DataclipDetailsCard dataclip={dataclip} />
              <DataclipBodyCard>
                {dataclip.wipedAt !== null ? (
                  <EmptyState
                    variant="plain"
                    fill
                    icon="hero-eye-slash"
                    title="No data available"
                    message="This dataclip's data has been wiped in accordance with the project's data retention policy."
                  />
                ) : (
                  <JsonViewer body={body} ariaLabel="Dataclip body" />
                )}
              </DataclipBodyCard>
            </Stack>
          )}
        </AsyncBoundary>
      </Centered>
    </PageContent>
  );
}
