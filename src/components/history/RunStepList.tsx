import { Link, useRouter } from "../../routing/router";
import type { Run, Step } from "../../types/history";
import { cn } from "../../utils/cn";
import ElapsedTime from "./ElapsedTime";
import StepIcon from "./StepIcon";
import { clonedStepMessage, inspectStepPath, isClonedStep } from "./runHelpers";

/**
 * The run page's step list (run_live/components.ex `step_list` +
 * `step_item`): each step links to `?step=`, the selected one gets a
 * primary right border and bold text. Elapsed times tick while a step runs.
 */
export default function RunStepList<S extends Omit<Step, "runId">>({
  run,
  steps,
  selectedStepId,
  projectId,
  workflowId,
  inspectPath,
}: {
  run: Pick<Run, "id" | "insertedAt">;
  steps: S[];
  selectedStepId: string | null;
  projectId: string;
  workflowId: string;
  /** Where "Inspect Step" goes; defaults to the editor on this run and job. */
  inspectPath?: (step: S) => string;
}) {
  const { navigate } = useRouter();
  const inspect = inspectPath ?? ((step: S) => inspectStepPath(projectId, workflowId, run, step));
  return (
    <ul role="list" className="-mb-8 flex-1">
      {steps.map((step) => {
        const selected = step.id === selectedStepId;
        const isClone = isClonedStep(step, run);
        const open = (e: { preventDefault(): void; stopPropagation(): void }) => {
          e.preventDefault();
          e.stopPropagation();
          navigate(inspect(step));
        };
        return (
          <li key={step.id} data-step-id={step.id} className="p-2">
            <Link
              to={`?step=${step.id}`}
              className={cn(
                "flex items-center gap-3 border-r-4 text-sm",
                selected ? "border-primary-500 font-semibold" : "border-transparent hover:border-gray-300"
              )}
            >
              <StepIcon reason={step.exitReason} errorType={step.errorType ?? null} />
              <span className={cn("flex min-w-0 flex-1 items-center gap-1 pr-1.5", isClone && "opacity-50")}>
                {isClone && (
                  <span role="img" aria-label={clonedStepMessage} title={clonedStepMessage} className="hero-paper-clip-mini mr-1 h-3 w-3" />
                )}
                {step.jobName}
                {/* A link inside the step's link in Lightning; a focusable span here so the DOM stays valid. */}
                <span
                  role="link"
                  tabIndex={0}
                  aria-label="Inspect Step"
                  className="hero-document-magnifying-glass-mini ml-1 h-5 w-5 cursor-pointer"
                  title="Inspect Step"
                  onClick={open}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") open(e);
                  }}
                />
                <span className="grow whitespace-nowrap text-right text-gray-500">
                  <ElapsedTime startedAt={step.startedAt} finishedAt={step.finishedAt} />
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
