import type { Meta, StoryObj } from "@storybook/react";
import { BulkCancelModal, BulkRerunModal, ExportConfirmationModal, RerunFromJobModal } from "./HistoryModals";

const confirm = async () => {};
const selection = { selectedCount: 3, allSelected: false, pageNumber: 1, pages: 1, totalEntries: 3 };
const allOnPage = { selectedCount: 10, allSelected: true, pageNumber: 1, pages: 4, totalEntries: 37 };

const meta = {
  title: "History/HistoryModals",
  component: BulkRerunModal,
  args: { open: true, onClose: () => {}, selection, query: "for OpenHIE workflow", onConfirm: confirm },
} satisfies Meta<typeof BulkRerunModal>;
export default meta;
type Story = StoryObj<typeof meta>;

export const BulkRerun: Story = {};
export const BulkRerunAllMatching: Story = { args: { selection: allOnPage } };
export const BulkCancel: Story = { render: (args) => <BulkCancelModal {...args} /> };
export const BulkCancelAllMatching: Story = { args: { selection: allOnPage }, render: (args) => <BulkCancelModal {...args} /> };
/** Confirmed, waiting on the server. */
export const Pending: Story = { args: { onConfirm: () => new Promise<void>(() => {}) } };
/** Confirmed, and the server said no. */
export const Failed: Story = { args: { onConfirm: () => Promise.reject(new Error("Something went wrong. Please try again.")) } };
const jobs = [
  { id: "j1", name: "Fetch patients", retriableCount: 3 },
  { id: "j2", name: "Send to DHIS2", retriableCount: 1 },
  { id: "j3", name: "Notify", retriableCount: 0 },
];
export const RerunFromJob: Story = { render: (args) => <RerunFromJobModal {...args} jobs={jobs} /> };
export const RerunFromJobAllMatching: Story = {
  args: { selection: allOnPage },
  render: (args) => <RerunFromJobModal {...args} jobs={jobs} />,
};
export const ExportConfirmation: Story = {
  render: (args) => <ExportConfirmationModal open={args.open} onClose={args.onClose} count={5} onConfirm={confirm} />,
};
