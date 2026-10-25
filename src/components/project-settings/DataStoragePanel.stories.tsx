import type { Meta, StoryObj } from "@storybook/react";
import DataStoragePanel from "./DataStoragePanel";
import { dataRetentionPeriods } from "../../mock-data/project-settings";
import type { DataStorageSettings } from "../../types/project-settings";
import { withGrayPanel } from "../../stories/decorators";

const unset: DataStorageSettings = {
  historyRetentionPeriod: null,
  dataclipRetentionPeriod: null,
  retentionPolicy: "retain_all",
  periods: dataRetentionPeriods,
  limitMessage: null,
  canEdit: true,
};

const meta: Meta<typeof DataStoragePanel> = {
  title: "Project settings/DataStoragePanel",
  component: DataStoragePanel,
  decorators: [withGrayPanel],
  args: { dataStorage: unset, sandbox: false, onSave: async () => {} },
};
export default meta;
type Story = StoryObj<typeof DataStoragePanel>;

export const Unset: Story = {};
export const Configured: Story = {
  args: { dataStorage: { ...unset, historyRetentionPeriod: 90, dataclipRetentionPeriod: 30 } },
};
export const ZeroPersistence: Story = {
  args: { dataStorage: { ...unset, historyRetentionPeriod: 30, retentionPolicy: "erase_all" } },
};
/** The plan caps retention: one period, and Lightning's upgrade note beside it. */
export const PlanLimited: Story = {
  args: { dataStorage: { ...unset, historyRetentionPeriod: 7, periods: [7], limitMessage: "Upgrade your plan for longer retention." } },
};
export const ReadOnly: Story = { args: { dataStorage: { ...unset, canEdit: false } } };
