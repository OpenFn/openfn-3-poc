import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";
import SearchInput from "./SearchInput";
import TableTitle from "./TableTitle";

const meta: Meta<typeof TableTitle> = {
  title: "Primitives/TableTitle",
  component: TableTitle,
  args: { title: "Projects", count: 2 },
};
export default meta;
type Story = StoryObj<typeof TableTitle>;

export const WithCount: Story = {};
export const NoCount: Story = { args: { title: "Sandboxes", count: undefined } };
export const WithActions: Story = {
  args: {
    title: "Workflows",
    count: 3,
    children: (
      <>
        <SearchInput value="" onChange={() => {}} className="w-96" />
        <Button>Create new workflow</Button>
      </>
    ),
  },
};
export const LongTitle: Story = { args: { title: "Workflows in Kenya MoH community health referrals to DHIS2 aggregate sync (sandbox)", count: 12 } };
