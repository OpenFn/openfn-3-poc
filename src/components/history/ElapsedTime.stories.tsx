import type { Meta, StoryObj } from "@storybook/react";
import ElapsedTime from "./ElapsedTime";

const meta = { title: "History/ElapsedTime", component: ElapsedTime } satisfies Meta<typeof ElapsedTime>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Finished: Story = { args: { startedAt: "2026-10-14T09:12:00Z", finishedAt: "2026-10-14T09:12:04Z" } };
export const Running: Story = { args: { startedAt: new Date().toISOString(), finishedAt: null } };
export const NotStarted: Story = { args: { startedAt: null, finishedAt: null } };
