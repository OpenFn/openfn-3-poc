import type { Meta, StoryObj } from "@storybook/react";
import { Route, Routes } from "react-router-dom";
import { expect, userEvent, within } from "storybook/test";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "../../../api/client";
import { stepUp } from "../../../api/session";
import { ToastProvider } from "../../../components/primitives/Toast";
import { withCanvas, withRouterAt } from "../../../stories/decorators";
import TokensPageRoute from "./TokensPage.route";

// The real route on the fake server, through the API client and TanStack Query: what the app runs.
const meta: Meta<typeof TokensPageRoute> = {
  title: "Pages/Profile/TokensPage/On the fake server",
  component: TokensPageRoute,
  decorators: [withCanvas("h-screen"), withRouterAt("/profile/tokens")],
  parameters: { layout: "fullscreen" },
  beforeEach: () => resetFakeApi(),
  render: () => (
    <ToastProvider>
      <Routes>
        <Route path="/profile/tokens" element={<TokensPageRoute />} />
        <Route path="/profile/tokens/:tokenId/delete" element={<TokensPageRoute />} />
      </Routes>
    </ToastProvider>
  ),
};
export default meta;
type Story = StoryObj<typeof TokensPageRoute>;

const rows = async (canvasElement: HTMLElement) => {
  const table = await within(canvasElement).findByRole("table");
  return within(table).getAllByRole("row").length;
};
const generate = (canvasElement: HTMLElement) =>
  userEvent.click(within(canvasElement).getByRole("button", { name: "Generate New Token" }));

/** The list loads from GET /api/me/tokens. */
export const List: Story = {
  play: async ({ canvasElement }) => {
    await expect(await rows(canvasElement)).toBe(3);
  },
};

/** Stepped up in the last five minutes, Generate shows the new token once and the list reloads with it. */
export const GenerateAfterSteppingUp: Story = {
  beforeEach: async () => void (await stepUp({ password: FAKE_PASSWORD })),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = await rows(canvasElement);
    await generate(canvasElement);
    const secret = (await canvas.findByRole("textbox", { name: "New token" })) as HTMLInputElement;
    await expect(secret.value).toMatch(/^demo\.fake-token-not-real\./);
    await expect(await rows(canvasElement)).toBe(before + 1);
    await expect(canvas.getByText("..." + secret.value.slice(-10))).toBeVisible();
  },
};

/** Not stepped up, Lightning refuses with step_up_required. Until the password pop-up is wired, the page toasts it. */
export const StepUpRequired: Story = {
  play: async ({ canvasElement }) => {
    await rows(canvasElement);
    await generate(canvasElement);
    const toast = await within(canvasElement.ownerDocument.body).findByRole("alert");
    await expect(toast).toHaveTextContent("Enter your password or an MFA code again to do this.");
  },
};

/** Delete asks first, then the list reloads without the token. */
export const Delete: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = await rows(canvasElement);
    await userEvent.click(canvas.getAllByRole("link", { name: "Delete token" })[0]!);
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(await body.findByRole("button", { name: "Yes" }));
    await expect(await body.findByText("Token deleted successfully")).toBeVisible();
    await expect(await rows(canvasElement)).toBe(before - 1);
  },
};

/** GET /api/me/tokens fails: the server's message takes the table's place. */
export const LoadFailed: Story = {
  beforeEach: () => failNext("GET /api/me/tokens", { status: 500, code: "internal", detail: "Something went wrong in Lightning." }),
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Something went wrong in Lightning.")).toBeVisible();
  },
};
