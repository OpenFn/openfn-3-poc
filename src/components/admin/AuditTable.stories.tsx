import type { Meta, StoryObj } from "@storybook/react";
import AuditTable from "./AuditTable";
import { auditEvents, auditPageSize } from "../../mock-data/admin";

const meta: Meta<typeof AuditTable> = {
  title: "Admin/AuditTable",
  component: AuditTable,
  args: {
    events: auditEvents.slice(0, auditPageSize),
    page: { number: 1, size: auditPageSize, totalEntries: auditEvents.length },
  },
};
export default meta;
type Story = StoryObj<typeof AuditTable>;

export const FirstPage: Story = {};
export const LastPage: Story = {
  args: { events: auditEvents.slice(auditPageSize), page: { number: 2, size: auditPageSize, totalEntries: auditEvents.length } },
};
export const Empty: Story = { args: { events: [], page: { number: 1, size: auditPageSize, totalEntries: 0 } } };
/** A long actor email and item type, to check they truncate rather than overflow. */
export const LongValues: Story = {
  args: {
    events: auditEvents
      .slice(0, auditPageSize)
      .map((e, i) =>
        i === 0
          ? {
              ...e,
              actorIdentifier: "amelia.oluwaseun-van-der-westhuizen.health-informatics@ministry-of-health.example.org",
              itemType: "Lightning.Workflows.WebhookAuthMethodProjectCredentialAssociation",
            }
          : e
      ),
  },
};
