import type { Meta, StoryObj } from "@storybook/react";
import { DetailItem, DetailList } from "./DetailList";
import Pill from "./Pill";

const meta: Meta = { title: "Primitives/DetailList" };
export default meta;
type Story = StoryObj;

export const Rows: Story = {
  render: () => (
    <DetailList className="w-80">
      <DetailItem label="Work Order" mono>
        8a1f3c2e
      </DetailItem>
      <DetailItem label="Status">
        <Pill tone="success">Success</Pill>
      </DetailItem>
      <DetailItem label="Duration">4 s</DetailItem>
    </DetailList>
  ),
};

export const Small: Story = {
  render: () => (
    <DetailList size="sm" className="w-80">
      <DetailItem label="content-type" mono>
        application/json
      </DetailItem>
      <DetailItem label="user-agent" mono>
        CommCareHQ
      </DetailItem>
    </DetailList>
  ),
};

export const Grid: Story = {
  render: () => (
    <DetailList layout="grid">
      <DetailItem label="Channel Name">openhie-gateway</DetailItem>
      <DetailItem label="Destination URL" mono>
        https://hie.example.org/fhir
      </DetailItem>
      <DetailItem label="Method">POST</DetailItem>
      <DetailItem label="Status">200</DetailItem>
    </DetailList>
  ),
};

/** Long ids and URLs wrap inside their column instead of pushing past it. */
export const LongValues: Story = {
  render: () => (
    <div className="w-96 space-y-6">
      <DetailList>
        <DetailItem label="Run" mono>
          962b650f-8c1e-4d2a-9f3b-7a6e5d4c3b2a
        </DetailItem>
        <DetailItem label="Webhook URL" mono>
          https://app.openfn.org/i/3f1c2b7a-9d4e-4c8b-a1f0-6e2d5b9c8a7f
        </DetailItem>
      </DetailList>
      <DetailList layout="grid">
        <DetailItem label="Destination URL" mono>
          https://commcare.example.org/a/kenya-moh/api/v0.5/referrals
        </DetailItem>
      </DetailList>
    </div>
  ),
};

export const EmptyValue: Story = {
  render: () => (
    <DetailList className="w-80">
      <DetailItem label="Started" />
      <DetailItem label="Duration">4 s</DetailItem>
    </DetailList>
  ),
};
