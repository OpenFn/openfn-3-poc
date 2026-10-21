import { Link, useRouter } from "../../routing/router";
import type { Run, Step } from "../../types/history";
import { cn } from "../../utils/cn";
import StepIcon from "./StepIcon";
import { formatElapsed } from "../../utils/format";
import { clonedStepMessage, inspectStepPath, isClonedStep } from "./runHelpers";
import Tooltip from "../Tooltip";

/**
 * The run page's step list (run_live/components.ex `step_list` +
 * `step_item`): each step links to `?step=`, the selected one gets a
 * primary right border and bold text.
 */
export default function RunStepList({
  run,
  steps,
  selectedStepId,
  projectId,
  workflowId,
}: {
  run: Run;
  steps: Step[];
  selectedStepId: string | null;
  projectId: string;
  workflowId: string;
}) {
  const { navigate } = useRouter();
  return (
    <ul role="list" className="-mb-8 flex-1">
      {steps.map((step) => {
        const selected = step.id === selectedStepId;
        const isClone = isClonedStep(step, run);
        return (
          <li key={step.id} data-step-id={step.id} className="p-2">
            <Link
              to={`?step=${step.id}`}
              className={cn(
                "flex items-center gap-3 border-r-4 text-sm",
                selected ? "border-primary-500 font-semibold" : "border-transparent hover:border-gray-300"
              )}
            >
              <StepIcon reason={step.exitReason} />
              <span className={cn("flex min-w-0 flex-1 items-center gap-1 pr-1.5", isClone && "opacity-50")}>
                {isClone && (
                  <Tooltip content={clonedStepMessage}>
                    <span role="img" aria-label={clonedStepMessage} className="hero-paper-clip-mini mr-1 h-3 w-3" />
                  </Tooltip>
                )}
                {step.jobName}
                {/* A link inside the step's link in Lightning; a span here so the DOM stays valid. */}
                <Tooltip content="Inspect Step">
                  <span
                    role="link"
                    aria-label="Inspect Step"
                    className="hero-document-magnifying-glass-mini ml-1 h-5 w-5 cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(inspectStepPath(projectId, workflowId, run, step));
                    }}
                  />
                </Tooltip>
                <span className="grow whitespace-nowrap text-right text-gray-500">
                  {formatElapsed(step.startedAt, step.finishedAt)}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
