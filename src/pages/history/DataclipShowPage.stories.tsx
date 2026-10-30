import type { Meta, StoryObj } from "@storybook/react";
import DataclipShowPage from "./DataclipShowPage";
import { dataclips } from "../../mock-data/history";
import { projects } from "../../mock-data/projects";
import type { DataclipDetail } from "../../types/history";
import { withCanvas, withRouter } from "../../stories/decorators";

const project = projects[0]!;
const dataclip: DataclipDetail = {
  id: "7f3a91c2-4d8e-4b1a-9c6f-2e5d8a1b3c4d",
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
  args: { project, projectLabel: project.name, dataclip, body: { text: JSON.stringify(dataclips[0]!.body, null, 2) } },
};
export default meta;
type Story = StoryObj<typeof DataclipShowPage>;

export const Default: Story = {};
export const Loading: Story = { args: { body: undefined } };
export const LoadFailed: Story = { args: { body: { error: "Failed to load content" } } };
export const Wiped: Story = {
  args: { dataclip: { ...dataclip, type: "step_result", wipedAt: "2026-10-20T00:00:00Z" }, body: undefined },
};
