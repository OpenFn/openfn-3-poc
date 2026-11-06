import type { Meta, StoryObj } from "@storybook/react";
import ListSearch from "./ListSearch";

const meta: Meta<typeof ListSearch> = {
  title: "Admin/ListSearch",
  component: ListSearch,
  args: { value: "", placeholder: "Filter projects", onSearch: () => {} },
};
export default meta;
type Story = StoryObj<typeof ListSearch>;

export const Empty: Story = {};
/** Loaded with a search from the URL. */
export const WithSearch: Story = { args: { value: "malaria" } };
