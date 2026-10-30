import type { Meta, StoryObj } from "@storybook/react";
import AdaptorDisplay from "./AdaptorDisplay";
import { withWhitePanel } from "../../stories/decorators";

const meta: Meta<typeof AdaptorDisplay> = {
  title: "Workflow/AdaptorDisplay",
  component: AdaptorDisplay,
  decorators: [withWhitePanel("w-96")],
  args: { adaptor: "@openfn/language-http@latest", onEdit: () => {}, onChangeAdaptor: () => {} },
};
export default meta;
type Story = StoryObj<typeof AdaptorDisplay>;

export const Http: Story = {};
export const WithCredential: Story = { args: { adaptor: "@openfn/language-dhis2@latest", credentialName: "DHIS2 play" } };
export const NeedsCredential: Story = { args: { adaptor: "@openfn/language-googlesheets@latest" } };
export const ReadOnly: Story = { args: { isReadOnly: true } };
export const LongCredentialName: Story = {
  args: { adaptor: "@openfn/language-dhis2@latest", credentialName: "DHIS2 national production instance (read-only service account)" },
};
