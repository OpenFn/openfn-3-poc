import type { ChannelRequestDetail } from "@/types/channels";
import Card from "@/components/primitives/Card";
import DateTime from "@/components/primitives/DateTime";
import { DetailItem, DetailList } from "@/components/primitives/DetailList";
import Heading from "@/components/primitives/Heading";
import Section from "@/components/primitives/Section";
import TextLink from "@/components/primitives/TextLink";
import Text from "@/components/primitives/Text";
import { MethodBadge, RequestPathDisplay, StatusCodeBadge } from "./ChannelRequestParts";
import { ChannelStatePill } from "@/components/domain/StatePill";
import { humanizeError } from "./channelErrors";
import { formatClientAuth, formatDestinationAuth, formatUs, shortUuid } from "@/utils/format";
import CopyButton from "@/components/primitives/CopyButton";
import { Row } from "@/components/primitives/Stack";

/**
 * The channel request page's summary card (channel_request_live/show.ex
 * `summary_card`): method, path, status code and state, the channel and
 * request id, then Client, Destination and Timing facts. The channel's name
 * and URL are the ones the request ran on, from its snapshot.
 */
export default function ChannelRequestSummary({ request, channelHref }: { request: ChannelRequestDetail; channelHref: string }) {
  return (
    <Card padding="lg">
      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2">
        <MethodBadge method={request.request?.method} />
        <RequestPathDisplay request={request.request} />
        <StatusCodeBadge status={request.response?.status} />
        <ChannelStatePill
          state={request.state}
          title={request.state === "timeout" && request.errorMessage ? humanizeError(request.errorMessage) : undefined}
        />
        {/* eslint-disable-next-line local/primitive-classname -- debt: margin (ml-auto) */}
        <Text as="div" variant="body-sm" className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1">
          <Row as="span" gap="sm">
            <Heading size="xs" as="span">
              Channel
            </Heading>
            <TextLink to={channelHref}>{request.snapshot.name}</TextLink>
          </Row>
          <Row as="span" gap="sm">
            <Heading size="xs" as="span">
              Request
            </Heading>
            <span className="font-mono text-strong">{shortUuid(request.requestId)}</span>
            <CopyButton value={request.requestId} label="Copy request ID" size="xs" />
          </Row>
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
        <Section variant="eyebrow" title="Client">
          <DetailList layout="grid" className="md:grid-cols-2">
            <DetailItem label="IP">{request.clientIdentity || "—"}</DetailItem>
            <DetailItem label="Auth">
              <span className="hero-shield-check mr-1 h-4 w-4 text-faint" />
              {formatClientAuth(request.clientAuth)}
            </DetailItem>
          </DetailList>
        </Section>
        <Section variant="eyebrow" title="Destination">
          <DetailList layout="grid" className="md:grid-cols-2">
            <DetailItem label="URL" variant="code">
              {request.snapshot.destinationUrl}
            </DetailItem>
            <DetailItem label="Auth">
              <span className="hero-key mr-1 h-4 w-4 text-faint" />
              {formatDestinationAuth(request.destinationCredential)}
            </DetailItem>
          </DetailList>
        </Section>
        <Section variant="eyebrow" title="Timing" className="md:col-span-2">
          <DetailList layout="grid" className="md:grid-cols-3">
            <DetailItem label="Started">
              <DateTime value={request.startedAt} />
            </DetailItem>
            <DetailItem label="Completed">
              <DateTime value={request.completedAt} />
            </DetailItem>
            <DetailItem label="Latency" variant="code">
              {request.timing?.latencyUs != null ? `${formatUs(request.timing.latencyUs)} ms` : "—"}
            </DetailItem>
          </DetailList>
        </Section>
      </div>
    </Card>
  );
}
