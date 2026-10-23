import type { Meta, StoryObj } from "@storybook/react";
import { useState, type ComponentProps } from "react";
import { withRouter } from "../../stories/decorators";
import { workOrders } from "../../mock-data/history";
import { workOrderRow } from "../../mock-data/history-extra";
import WorkOrdersTable from "./WorkOrdersTable";

const meta = {
  title: "History/WorkOrdersTable",
  component: WorkOrdersTable,
  decorators: [withRouter],
} satisfies Meta<typeof WorkOrdersTable>;
export default meta;
type Story = StoryObj<typeof meta>;

const noop = () => {};
const rows = workOrders.map(workOrderRow);
const base = {
  rows,
  state: "ready" as const,
  page: { number: 1, size: 10, totalEntries: rows.length },
  sort: { key: "last_activity", direction: "desc" } as const,
  sortHref: () => "#",
  expandedId: null,
  selectedIds: [] as string[],
  onSelectionChange: noop,
  canRunWorkflow: true,
  dataStorageHref: "/projects/p/settings#data-storage",
  onBulkCancel: noop,
  onBulkRetry: noop,
  onBulkRetryFrom: noop,
  onExport: noop,
  onCancel: noop,
  onRetry: noop,
  onCancelRun: noop,
  onRetryStep: noop,
};

function Demo(args: ComponentProps<typeof WorkOrdersTable>) {
  const [ids, setIds] = useState<string[]>(args.selectedIds);
  return <WorkOrdersTable {...args} selectedIds={ids} onSelectionChange={setIds} />;
}

export const Default: Story = { args: base, render: (args) => <Demo {...args} /> };
export const WithSelection: Story = { args: { ...base, selectedIds: ["wo-1", "wo-2"] } };
export const Empty: Story = { args: { ...base, rows: [], page: { number: 1, size: 10, totalEntries: 0 } } };
export const Loading: Story = { args: { ...base, state: "loading" } };
export const Failed: Story = { args: { ...base, state: "error" } };
