import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";
import { Toast, ToastProvider, useToast } from "./Toast";

const meta: Meta<typeof Toast> = {
  title: "Primitives/Toast",
  component: Toast,
  args: { tone: "info", children: "Token created successfully", onClose: () => {} },
};
export default meta;
type Story = StoryObj<typeof Toast>;

export const Info: Story = {};
export const Danger: Story = { args: { tone: "danger", children: "Workflow could not be saved" } };

function Trigger() {
  const toast = useToast();
  return (
    <div className="flex gap-2">
      <Button onClick={() => toast("Project updated successfully")}>Show info</Button>
      <Button variant="secondary" onClick={() => toast("Something went wrong", "danger")}>
        Show error
      </Button>
    </div>
  );
}

/** Click a button: the toast shows bottom-centre and goes after 5 s. Point at it or tab into it to keep it; click it, its X or press Escape to close it. */
export const WithProvider: Story = {
  render: () => (
    <ToastProvider>
      <Trigger />
    </ToastProvider>
  ),
};
export const LongText: Story = { args: { tone: "danger", children: "Kenya MoH community health referrals to DHIS2 aggregate sync (sandbox) could not be saved: the workflow has unsaved changes in another tab" } };
