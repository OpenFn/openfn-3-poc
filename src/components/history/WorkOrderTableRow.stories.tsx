import type { Meta, StoryObj } from "@storybook/react";
import { withRouter } from "../../stories/decorators";
import { Table, Th, Tr } from "../primitives/Table";
import { findWorkOrder } from "../../mock-data/history";
import { workOrderRow } from "../../mock-data/history-extra";
import WorkOrderTableRow from "./WorkOrderTableRow";

const meta = {
  title: "History/WorkOrderTableRow",
  component: WorkOrderTableRow,
  decorators: [
    withRouter,
    (Story) => (
      <Table
        header={
          <Tr>
            <Th>
              <span className="sr-only">Select</span>
            </Th>
            <Th>ID</Th>
            <Th>Workflow</Th>
            <Th>Input</Th>
            <Th>Created</Th>
            <Th>Last Activity</Th>
            <Th align="right">Duration</Th>
            <Th align="right">Status</Th>
            <Th align="right">Runs</Th>
          </Tr>
        }
      >
        {Story()}
      </Table>
    ),
  ],
} satisfies Meta<typeof WorkOrderTableRow>;
export default meta;
type Story = StoryObj<typeof meta>;

const row = (id: string) => workOrderRow(findWorkOrder(id)!);
const noop = () => {};
const base = { selected: false, onSelect: noop, canRunWorkflow: true, dataStorageHref: null, onCancel: noop, onRetry: noop, onCancelRun: noop, onRetryStep: noop };

export const Collapsed: Story = { args: { ...base, workOrder: row("wo-1") } };
export const Expanded: Story = { args: { ...base, workOrder: row("wo-1"), defaultExpanded: true } };
export const TwoRunsExpanded: Story = { args: { ...base, workOrder: row("wo-2"), defaultExpanded: true } };
export const Selected: Story = { args: { ...base, workOrder: row("wo-4"), selected: true } };
export const Rejected: Story = { args: { ...base, workOrder: row("wo-5") } };
export const Pending: Story = { args: { ...base, workOrder: { ...row("wo-1"), state: "pending" } } };
