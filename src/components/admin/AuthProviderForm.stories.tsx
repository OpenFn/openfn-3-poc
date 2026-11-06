import type { Meta, StoryObj } from "@storybook/react";
import { userEvent, within } from "storybook/test";
import AuthProviderForm from "./AuthProviderForm";
import { authProvider, instanceUrl } from "@/mock-data/admin";
import { RequestError } from "@/utils/errors";

const resolve = async () => {};

const meta: Meta<typeof AuthProviderForm> = {
  title: "Admin/AuthProviderForm",
  component: AuthProviderForm,
  args: { provider: null, instanceUrl, onSave: resolve, onRemove: resolve },
};
export default meta;
type Story = StoryObj<typeof AuthProviderForm>;

const press = (name: string): NonNullable<Story["play"]> =>
  async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement.ownerDocument.body).getByRole("button", { name }));
  };

export const New: Story = {};
export const Existing: Story = { args: { provider: authProvider } };

/** Save pressed on a blank form: each field says it can't be blank, and focus goes to the first. */
export const BlankFields: Story = { play: press("Save") };

/** The server refuses the name's format and the discovery URL: each error under its field. */
export const ServerFieldErrors: Story = {
  args: {
    provider: authProvider,
    onSave: () =>
      Promise.reject(
        new RequestError("The request body is not valid.", {
          fieldErrors: {
            name: ["must be lower-case and only contain alphanumeric, dash and underscore characters"],
            discovery_url: ["could not connect to discovery endpoint"],
          },
        })
      ),
  },
  play: press("Save"),
};

/** Any other refusal shows above the buttons. */
export const SaveRefused: Story = {
  args: { provider: authProvider, onSave: () => Promise.reject(new Error("Couldn't reach Lightning.")) },
  play: press("Save"),
};

/** Save is still out: the button shows pending. */
export const SavePending: Story = { args: { provider: authProvider, onSave: () => new Promise(() => {}) }, play: press("Save") };

/** Remove asks first, naming the provider. */
export const ConfirmRemove: Story = { args: { provider: authProvider }, play: press("Remove") };

/** Remove is still out: the dialog's button shows pending. */
export const RemovePending: Story = {
  args: { provider: authProvider, onRemove: () => new Promise(() => {}) },
  play: async (context) => {
    await press("Remove")(context);
    await press("Remove provider")(context);
  },
};

/** The server refuses Remove: its words stay in the dialog. */
export const RemoveRefused: Story = {
  args: { provider: authProvider, onRemove: () => Promise.reject(new Error("Not found.")) },
  play: async (context) => {
    await press("Remove")(context);
    await press("Remove provider")(context);
  },
};
