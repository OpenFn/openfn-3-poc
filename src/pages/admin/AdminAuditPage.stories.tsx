import type { Meta, StoryObj } from "@storybook/react";
import AdminAuditPage from "./AdminAuditPage";
import { auditEvents, auditPageSize } from "../../mock-data/admin";
import { withCanvas, withRouter } from "../../stories/decorators";

const meta: Meta<typeof AdminAuditPage> = {
  title: "Pages/Admin/AdminAuditPage",
  component: AdminAuditPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    events: auditEvents.slice(0, auditPageSize),
    pageNumber: 1,
    pageSize: auditPageSize,
    totalEntries: auditEvents.length,
    onPage: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof AdminAuditPage>;

export const FirstPage: Story = {};
export const SecondPage: Story = { args: { events: auditEvents.slice(auditPageSize), pageNumber: 2 } };
export const Empty: Story = { args: { events: [], totalEntries: 0 } };
