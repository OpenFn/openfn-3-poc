import type { ReactNode } from "react";
import Alert from "../Alert";
import Button from "../Button";
import Card from "../Card";
import Heading from "../Heading";
import { Radio, Select } from "../Inputs";
import SectionHeader from "../SectionHeader";
import TextLink from "../TextLink";
import SandboxSettingsBanner from "./SandboxSettingsBanner";
import type { DataStorageSettings, DataStorageValues } from "../../types/project-settings";
import type { RetentionPolicy } from "../../types/projects";
import { cn } from "../../utils/cn";
import { errorMessage } from "../../utils/errors";
import { useForm } from "../../utils/useForm";

interface Props {
  dataStorage: DataStorageSettings;
  sandbox: boolean;
  /** Saves the form. Rejects with field errors or a message, which the form shows. */
  onSave: (values: DataStorageValues) => Promise<void>;
}

const policies: [RetentionPolicy, string][] = [
  ["retain_all", "Retain all input/output data"],
  ["erase_all", "Never retain input/output data (zero-persistence)"],
];

/** The selects hold a period as a string, "" for none. */
const toForm = (v: DataStorageValues) => ({
  historyRetentionPeriod: v.historyRetentionPeriod === null ? "" : String(v.historyRetentionPeriod),
  dataclipRetentionPeriod: v.dataclipRetentionPeriod === null ? "" : String(v.dataclipRetentionPeriod),
  retentionPolicy: v.retentionPolicy,
});
const toPeriod = (v: string) => (v === "" ? null : Number(v));

/** One setting: its name, an explanation, then the control. `dimmed` fades the text when it doesn't apply. */
function Setting({ title, dimmed = false, description, children }: { title: string; dimmed?: boolean; description: ReactNode; children: ReactNode }) {
  return (
    <div className={cn("space-y-3 text-sm", dimmed && "text-faint")}>
      <div>
        <Heading as="h4" size="sm" className={cn(dimmed && "text-faint")}>
          {title}
        </Heading>
        <p className="mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}

/**
 * The Data Storage tab (`#data-storage`, settings.html.heex:862-1053):
 * history retention, the input/output storage policy, and the dataclip
 * retention period. Cancel puts back the saved values.
 */
export default function DataStoragePanel({ dataStorage, sandbox, onSave }: Props) {
  const { periods, limitMessage, canEdit } = dataStorage;
  const form = useForm({
    initial: toForm(dataStorage),
    validate: ({ historyRetentionPeriod, dataclipRetentionPeriod }) => ({
      dataclipRetentionPeriod:
        historyRetentionPeriod !== "" && dataclipRetentionPeriod !== "" && Number(dataclipRetentionPeriod) > Number(historyRetentionPeriod)
          ? ["dataclip retention period must be less or equal to the history retention period"]
          : [],
    }),
  });
  const options = periods.map((d) => [`${d} Days`, String(d)] as [string, string]);
  const eraseAll = form.values.retentionPolicy === "erase_all";
  const noHistory = form.values.historyRetentionPeriod === "";

  return (
    <>
      <SectionHeader
        title="Data storage"
        subtitle="View or modify data storage settings for this project."
        permissionsSection={canEdit ? undefined : "data storage settings."}
      />
      {sandbox && <SandboxSettingsBanner variant="local" />}
      <Card>
        <form
          id="retention-settings-form"
          className="space-y-6"
          onSubmit={form.submit((v) =>
            onSave({
              historyRetentionPeriod: toPeriod(v.historyRetentionPeriod),
              dataclipRetentionPeriod: toPeriod(v.dataclipRetentionPeriod),
              retentionPolicy: v.retentionPolicy,
            })
          )}
        >
          <Setting
            title="History Retention Period"
            description={
              <>
                Select how long your run history is stored in OpenFn before being removed from the servers.
                <TextLink href="https://docs.openfn.org/documentation/manage-projects/retention-periods" external className="ml-1">
                  Learn more
                </TextLink>
                <br /> This includes all Work Orders, Runs, and Logs.
              </>
            }
          >
            <Select
              id="project_history_retention_period"
              aria-label="History Retention Period"
              prompt="Select Period"
              options={options}
              disabled={!canEdit || periods.length === 1}
              className="w-fit"
              hint={limitMessage ?? undefined}
              {...form.fieldProps("historyRetentionPeriod")}
            />
          </Setting>
          <hr className="border-strong" />
          <Setting
            title="Input/Output Data Storage Policy"
            description={
              <>
                The input and output data associated with workflow runs and channel requests is useful for debugging.
                However it can contain sensitive PII. Should OpenFn store this data?
                <TextLink href="https://docs.openfn.org/documentation/manage-projects/io-data-storage" external className="ml-1">
                  Learn more
                </TextLink>
              </>
            }
          >
            <div className="space-y-2">
              {policies.map(([value, text]) => (
                <Radio
                  key={value}
                  id={value}
                  name="retention_policy"
                  value={value}
                  label={text}
                  disabled={!canEdit}
                  checked={form.values.retentionPolicy === value}
                  onChange={() => {
                    form.set("retentionPolicy", value);
                    // settings.ex `validate`: zero-persistence keeps no input/output data, so no period either.
                    if (value === "erase_all") form.set("dataclipRetentionPeriod", "");
                  }}
                />
              ))}
            </div>
            {form.values.retentionPolicy !== "retain_all" && (
              <Alert tone="warning" header="Heads Up!">
                <p>
                  When enabled, you will no longer be able to retry workflow runs, and channel request/response
                  payloads will not be stored.
                </p>
              </Alert>
            )}
          </Setting>
          <hr className="border-strong" />
          <Setting
            title="Input/Output Data Retention Period"
            dimmed={noHistory || eraseAll}
            description="Select how long input/output data is stored. Once input/output data is removed for a given run, you will no longer be able to retry that run."
          >
            <Select
              id="project_dataclip_retention_period"
              aria-label="Input/Output Data Retention Period"
              prompt="Select Period"
              options={options}
              disabled={!canEdit || noHistory || eraseAll}
              className="w-fit"
              {...form.fieldProps("dataclipRetentionPeriod")}
            />
          </Setting>
          {form.error && <Alert tone="danger">{errorMessage(form.error)}</Alert>}
          <div className="flex gap-1">
            <Button variant="secondary" disabled={!canEdit} onClick={() => form.reset()}>
              Cancel
            </Button>
            <Button id="input-output-retention-period-submit-btn" type="submit" disabled={!canEdit} pending={form.pending}>
              Save
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
