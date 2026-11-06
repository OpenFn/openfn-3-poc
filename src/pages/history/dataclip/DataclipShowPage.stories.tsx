import type { Meta, StoryObj } from "@storybook/react";
import DataclipShowPage from "./DataclipShowPage";
import { dataclips } from "@/mock-data/history";
import { projects } from "@/mock-data/projects";
import type { DataclipDetail } from "@/types/history";
import { withCanvas, withRouter } from "@/stories/decorators";

const project = projects[0]!;
const dataclip: DataclipDetail = {
  id: "dc-7f3a91",
  name: null,
  type: "http_request",
  insertedAt: "2026-10-14T09:12:00Z",
  updatedAt: "2026-10-14T09:12:00Z",
  wipedAt: null,
};

const meta: Meta<typeof DataclipShowPage> = {
  title: "Pages/History/DataclipShowPage",
  component: DataclipShowPage,
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    project,
    projectLabel: project.name,
    dataclip,
    body: { text: JSON.stringify(dataclips[0]!.body, null, 2) },
    historyHref: `/projects/${project.id}/history`,
  },
};
export default meta;
type Story = StoryObj<typeof DataclipShowPage>;

export const Default: Story = {};
export const Named: Story = { args: { dataclip: { ...dataclip, id: "dc-saved-1", name: "Sample registration", type: "saved_input" } } };
export const Wiped: Story = {
  args: { dataclip: { ...dataclip, type: "step_result", wipedAt: "2026-10-20T00:00:00Z" }, body: undefined },
};
export const Loading: Story = { args: { status: { state: "loading" }, dataclip: null, body: undefined } };
export const LoadFailed: Story = {
  args: { status: { state: "error", message: "Something went wrong in Lightning." }, dataclip: null, body: undefined },
};
export const NoAccess: Story = { args: { status: { state: "forbidden" }, dataclip: null, body: undefined } };
export const NotFound: Story = { args: { status: { state: "notFound" }, dataclip: null, body: undefined } };
