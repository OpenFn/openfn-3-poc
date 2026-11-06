import { useEffect, useState } from "react";
import type { MergePreviewResult, MergeValues, SandboxRow } from "@/types/sandboxes";
import { errorMessage } from "@/utils/errors";
import { formatGracePeriod } from "@/utils/format";
import { useAction } from "@/utils/useAction";
import Alert from "@/components/primitives/Alert";
import FormModal from "@/components/primitives/FormModal";
import { Checkbox, Field, Select } from "@/components/primitives/Inputs";
import Pill from "@/components/primitives/Pill";
import Spinner from "@/components/primitives/Spinner";
import { Row, Stack } from "@/components/primitives/Stack";
import Text from "@/components/primitives/Text";

interface State {
  /** The latest preview that arrived. */
  preview: MergePreviewResult | null;
  /** The target picked, whose preview may still be on its way. */
  targetId: string;
  workflows: Set<string>;
  credentials: Set<string>;
}

const ids = (rows: { id: string }[]) => new Set(rows.map((r) => r.id));
const toggled = (set: Set<string>, id: string) => {
  const next = new Set(set);
  if (!next.delete(id)) next.add(id);
  return next;
};

/**
 * On a new preview, as Lightning's `select-merge-target`: ticks still listed
 * stay; a workflow newly listed is ticked unless it was deleted in the
 * sandbox, and a credential newly listed is ticked.
 */
function applyPreview(s: State, next: MergePreviewResult): State {
  const before = { workflows: ids(s.preview?.workflows ?? []), credentials: ids(s.preview?.credentials ?? []) };
  const after = { workflows: ids(next.workflows), credentials: ids(next.credentials) };
  return {
    ...s,
    preview: next,
    workflows: new Set([
      ...[...s.workflows].filter((id) => after.workflows.has(id)),
      ...next.workflows.filter((w) => !w.isDeleted && !before.workflows.has(w.id)).map((w) => w.id),
    ]),
    credentials: new Set([...after.credentials].filter((id) => s.credentials.has(id) || !before.credentials.has(id))),
  };
}

/**
 * Merge a sandbox (SandboxLive.Components.merge_modal, in openfn-ia-demo's
 * words): pick where into, tick the workflows and credentials to bring, with
 * a warning where the target changed a workflow too, and a reminder that the
 * sandbox is deleted afterwards. The preview comes from the host on open and
 * on every target change, and only the newest one counts.
 */
export default function MergeSandboxModal({
  sandbox,
  gracePeriodDays,
  onPreview,
  onClose,
  onMerge,
}: {
  sandbox: SandboxRow;
  gracePeriodDays: number;
  onPreview: (targetId: string) => Promise<MergePreviewResult>;
  onClose: () => void;
  onMerge: (values: MergeValues) => Promise<void>;
}) {
  const targets = sandbox.mergeTargets;
  const [s, setS] = useState<State>({
    preview: null,
    // The parent when it's listed; the workspace's top project is always live, so there's always one.
    targetId: targets[0]!.id,
    workflows: new Set(),
    credentials: new Set(),
  });
  const previewing = useAction(onPreview, {
    onSuccess: (next) => setS((cur) => applyPreview(cur, next)),
    latest: true,
  });
  const ask = (targetId: string) => {
    setS((cur) => ({ ...cur, targetId }));
    void previewing.run(targetId);
  };
  useEffect(() => {
    void previewing.run(s.targetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on open, for the default target
  }, []);

  // Only the picked target's preview: none while the next one loads or after it failed.
  const error = previewing.error && errorMessage(previewing.error);
  const loading = !error && s.preview?.targetId !== s.targetId;
  const preview = loading || error ? null : s.preview;
  // A target that has gone since (deleted elsewhere) has no name; the server refuses the merge.
  const target = targets.find((t) => t.id === s.targetId)?.name ?? "";
  const diverged = (preview?.workflows ?? []).filter((w) => w.isDiverged && s.workflows.has(w.id));
  const blockedReason = loading
    ? "Loading the merge preview"
    : !preview
      ? "The merge preview didn't load"
      : s.workflows.size === 0
        ? "No workflows selected"
        : null;

  return (
    <FormModal
      open
      title={`Merge ${sandbox.name}`}
      formId="merge-sandbox-form"
      submitId="merge-sandbox-submit"
      submitLabel={`Merge into ${target}`}
      submitDisabled={blockedReason !== null}
      submitTooltip={blockedReason ?? undefined}
      onClose={onClose}
      onSubmit={() =>
        onMerge({
          targetId: preview!.targetId,
          workflowIds: preview!.workflows.filter((w) => !w.isDeleted && s.workflows.has(w.id)).map((w) => w.id),
          deletedWorkflowIds: preview!.workflows.filter((w) => w.isDeleted && s.workflows.has(w.id)).map((w) => w.id),
          credentialIds: preview!.credentials.filter((c) => s.credentials.has(c.id)).map((c) => c.id),
        })
      }
    >
      <Stack gap="lg">
        <Select
          id="merge-target-select"
          label="Merge into"
          options={targets.map((t) => ({ label: t.name, value: t.id }))}
          value={s.targetId}
          onChange={(e) => ask(e.target.value)}
        />

        {error && (
          <Alert tone="danger" id="merge-preview-error">
            {error}
          </Alert>
        )}

        {loading && <Spinner size="md" label="Loading the merge preview" />}
        {/* Mounted throughout, so a new target's workflows are read out when they arrive. */}
        <div aria-live="polite">
          {preview && (
            <Field group label="Workflows">
              <Stack gap="sm">
                {preview.workflows.length === 0 ? (
                  <Text tone="muted">No workflow has changed in this sandbox.</Text>
                ) : (
                  preview.workflows.map((w) => (
                    <Checkbox
                      key={w.id}
                      // The badges are in the label, so they're read with the checkbox.
                      label={
                        <Row as="span" gap="sm">
                          <span>{w.name}</span>
                          {w.isDiverged && <Pill tone="warning">Changed in {target} too</Pill>}
                          {w.isDeleted && <Pill tone="danger">Deleted in sandbox</Pill>}
                        </Row>
                      }
                      checked={s.workflows.has(w.id)}
                      onChange={() => setS((cur) => ({ ...cur, workflows: toggled(cur.workflows, w.id) }))}
                    />
                  ))
                )}
              </Stack>
            </Field>
          )}
        </div>
        {diverged.length > 0 && (
          <Alert tone="warning" header={`${target} has changed since this sandbox was made`}>
            Merging replaces {diverged.map((w) => w.name).join(", ")} in {target} with this sandbox's version, and the changes made in{" "}
            {target} are lost.
          </Alert>
        )}
        {preview && preview.credentials.length > 0 && (
          <Field group label="Credentials only in this sandbox">
            <Stack gap="sm">
              {preview.credentials.map((c) => (
                <Checkbox
                  key={c.id}
                  label={c.name}
                  hint={`Bring it into ${target} so the merged workflows can use it.`}
                  checked={s.credentials.has(c.id)}
                  onChange={() => setS((cur) => ({ ...cur, credentials: toggled(cur.credentials, c.id) }))}
                />
              ))}
            </Stack>
          </Field>
        )}

        <Alert tone="warning" id="merge-deletion-warning" header="This sandbox will be deleted after merging">
          It can be restored from the sandbox list for {formatGracePeriod(gracePeriodDays)}, then permanently removed.
          {sandbox.descendantCount === 1 && " Its child sandbox will also be deleted."}
          {sandbox.descendantCount > 1 && ` Its ${sandbox.descendantCount} child sandboxes will also be deleted.`}
        </Alert>
      </Stack>
    </FormModal>
  );
}
