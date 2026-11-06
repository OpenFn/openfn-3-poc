import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import Disclosure from "@/components/primitives/Disclosure";
import { DetailItem, DetailList } from "@/components/primitives/DetailList";
import Header from "@/components/primitives/Header";
import { Centered, PageContent } from "@/components/primitives/PageContent";
import Pill from "@/components/primitives/Pill";
import { Row, Stack } from "@/components/primitives/Stack";
import ProjectBreadcrumbs from "@/components/shell/ProjectBreadcrumbs";
import {
  BodyViewer,
  HeadersList,
  ResponseEmpty,
  SectionSizeBadge,
  StatusCodeBadge,
} from "@/components/history/ChannelRequestParts";
import ChannelRequestSummary from "@/components/history/ChannelRequestSummary";
import ChannelTiming from "@/components/history/ChannelTiming";
import WipedDataViewer from "@/components/history/WipedDataViewer";
import type { ChannelRequestDetail } from "@/types/channels";
import type { CurrentProject } from "@/types/projects";
import type { ResourceStatus } from "@/types/resource";
import { shortUuid } from "@/utils/format";

const sizeNote = (size: number | null | undefined) => (size ? <SectionSizeBadge size={size} /> : null);

/** What the query passes in. Nothing on the page writes. */
export interface ChannelRequestShowPageProps {
  /** The project ProjectGate loaded, for the breadcrumb's picker. */
  project: CurrentProject;
  /** The picker's label, "parent/child" for a sandbox. */
  projectLabel: string;
  /** Where loading the request stands, Not Found when it isn't this project's. Left out, it's ready. */
  status?: ResourceStatus;
  /** The request; null until it loads, or when it can't be shown. */
  request: ChannelRequestDetail | null;
  /** The channel's version now, so Context can say the config changed since the request ran. */
  channelLockVersion: number;
  /** Whether the wiped notice links to the retention policy, or names the admins to ask. */
  canEditDataRetention: boolean;
  /** The project's owner and admin emails, for the wiped notice. */
  adminContacts: string[];
  /** The project's History, the breadcrumb's first step. */
  historyHref: string;
  /** History's Channel logs, the breadcrumb's second step. */
  channelLogsHref: string;
  /** The channel's edit form, which the summary's channel name opens. */
  channelHref: string;
}

/**
 * Inventory view `channel-request-show` (ChannelRequestLive.Show): what one
 * request through a channel sent and got back, how long it took, and the
 * config it ran on.
 */
export default function ChannelRequestShowPage({
  project,
  projectLabel,
  status = { state: "ready" },
  request,
  channelLockVersion,
  canEditDataRetention,
  adminContacts,
  historyHref,
  channelLogsHref,
  channelHref,
}: ChannelRequestShowPageProps) {
  const sent = request?.request;
  const response = request?.response;
  const showRequestBody = sent && (sent.body != null || sent.bodySize != null);
  const showResponseBody = response && (response.body != null || response.bodySize != null);

  const header = (
    <Header
      breadcrumbs={
        <ProjectBreadcrumbs
          project={project}
          label={projectLabel}
          items={[
            ["History", historyHref],
            ["Channels", channelLogsHref],
          ]}
          current="Channel request"
        />
      }
      title={request ? `Channel request ${shortUuid(request.requestId)}` : "Channel request"}
    />
  );

  return (
    <PageContent header={header}>
      <Centered>
        <AsyncBoundary status={status}>
          {request && (
            <Stack>
              <ChannelRequestSummary request={request} channelHref={channelHref} />

              {request.errorCategory !== "credential" && <ChannelTiming timing={request.timing} />}

              {request.wiped ? (
                <WipedDataViewer
                  dataLabel="request_response"
                  projectId={project.id}
                  canEditDataRetention={canEditDataRetention}
                  adminContacts={adminContacts}
                />
              ) : (
                <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
                  <Disclosure variant="card" id="request-section" title="Request" padding="none" titleRight={sizeNote(sent?.bodySize)}>
                    {sent?.headers && (
                      <Disclosure variant="section" title="Headers">
                        <HeadersList headers={sent.headers} />
                      </Disclosure>
                    )}
                    {showRequestBody && (
                      <Disclosure variant="section" title="Body" titleRight={sizeNote(sent.bodySize)}>
                        <BodyViewer preview={sent.body} size={sent.bodySize} headers={sent.headers} />
                      </Disclosure>
                    )}
                  </Disclosure>

                  <Disclosure
                    variant="card"
                    id="response-section"
                    title="Response"
                    padding="none"
                    titleRight={
                      <>
                        {response && <StatusCodeBadge status={response.status} />}
                        {sizeNote(response?.bodySize)}
                      </>
                    }
                  >
                    {request.errorMessage ? (
                      // An error the server doesn't categorise reads as no response, like a transport error.
                      <ResponseEmpty type={request.errorCategory ?? "transport"} errorCode={request.errorMessage} />
                    ) : (
                      <>
                        {response?.headers && (
                          <Disclosure variant="section" title="Headers">
                            <HeadersList headers={response.headers} />
                          </Disclosure>
                        )}
                        {showResponseBody && (
                          <Disclosure variant="section" title="Body" titleRight={sizeNote(response.bodySize)}>
                            <BodyViewer preview={response.body} size={response.bodySize} headers={response.headers} />
                          </Disclosure>
                        )}
                      </>
                    )}
                  </Disclosure>
                </div>
              )}

              <Disclosure variant="card" id="context-section" title="Context" defaultOpen={false}>
                <DetailList layout="grid" className="md:grid-cols-3">
                  <DetailItem label="Destination URL" variant="code">
                    {request.snapshot.destinationUrl}
                  </DetailItem>
                  <DetailItem label="Channel name">{request.snapshot.name}</DetailItem>
                  <DetailItem label="Config version">
                    <Row as="span">
                      {request.snapshot.lockVersion}
                      {request.snapshot.lockVersion !== channelLockVersion && <Pill tone="warning">Config changed</Pill>}
                    </Row>
                  </DetailItem>
                </DetailList>
              </Disclosure>
            </Stack>
          )}
        </AsyncBoundary>
      </Centered>
    </PageContent>
  );
}
