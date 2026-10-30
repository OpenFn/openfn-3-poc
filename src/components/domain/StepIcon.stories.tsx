import type { Meta, StoryObj } from "@storybook/react";
import StepIcon from "./StepIcon";

const meta = { title: "Domain/StepIcon", component: StepIcon } satisfies Meta<typeof StepIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = { args: { reason: "success" } };
export const Fail: Story = { args: { reason: "fail" } };
export const Crash: Story = { args: { reason: "crash" } };
export const Pending: Story = { args: { reason: null } };
export const Cancel: Story = { args: { reason: "cancel" } };
export const Kill: Story = { args: { reason: "kill" } };
export const KillSecurityError: Story = { args: { reason: "kill", errorType: "SecurityError" } };
export const KillTimeoutError: Story = { args: { reason: "kill", errorType: "TimeoutError" } };
export const Exception: Story = { args: { reason: "exception" } };
export const Lost: Story = { args: { reason: "lost" } };
