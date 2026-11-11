/** Work orders on the pretend server (api/work-orders.md), read from the History fixtures. */
import { findDataclip, stepsOf, workOrdersIn } from "@/mock-data/history";
import { logsOf, runsOfWorkOrder } from "@/mock-data/history-extra";
import type { WorkOrder } from "@/mock-data/models/history";
import { badInclude, json, paged, problem, type Handler, type Problem } from "./answers";

const STATES = ["rejected", "pending", "running", "success", "failed", "crashed", "cancelled", "killed", "exception", "lost"];
const SEARCH_FIELDS = ["id", "dataclip_name", "body", "log"];
const SORTS = ["inserted_at", "last_activity"];
/** Invocation's `@workorders_count_limit`: a search counts no further. */
const SEARCH_LIMIT = 50;

// The fixtures keep the run-style states; the API sends work order states.
function stateOf(state: string) {
  if (state === "available") return "pending";
  if (state === "claimed" || state === "started") return "running";
  return state;
}

const isIso = (v: string) => !Number.isNaN(new Date(v).getTime());
const inRange = (iso: string, after: string | null, before: string | null) => (!after || iso >= after) && (!before || iso <= before);

function searched(wo: WorkOrder, term: string, fields: string[]) {
  const runs = runsOfWorkOrder(wo);
  const dataclip = findDataclip(wo.dataclipId);
  return fields.some((field) => {
    if (field === "id") return [wo.id, ...runs.flatMap((r) => [r.id, ...stepsOf(r).map((s) => s.id)])].some((id) => id.toLowerCase().includes(term));
    if (field === "dataclip_name") return (dataclip?.name ?? "").toLowerCase().includes(term);
    if (field === "body") return JSON.stringify(dataclip?.body ?? "").toLowerCase().includes(term);
    return runs.some((r) => logsOf(r).some((l) => l.message.toLowerCase().includes(term)));
  });
}

function resource(wo: WorkOrder, withRuns: boolean) {
  return {
    type: "work_orders",
    id: wo.id,
    attributes: {
      state: stateOf(wo.state),
      last_activity: wo.lastActivity,
      inserted_at: wo.insertedAt,
      updated_at: wo.lastActivity,
      // Planned scope.
      workflow_id: wo.workflowId,
      dataclip_id: wo.dataclipId,
      dataclip_wiped: !!findDataclip(wo.dataclipId)?.wiped,
    },
    // Planned scope: include=runs, newest first, each as GET /api/runs/:id would send it.
    ...(withRuns && {
      runs: runsOfWorkOrder(wo).map((r) => ({
        id: r.id,
        state: r.state,
        inserted_at: r.insertedAt,
        started_at: r.startedAt,
        finished_at: r.finishedAt,
        steps: stepsOf(r).map((s) => ({
          id: s.id,
          job_id: s.jobId,
          job_name: s.jobName,
          exit_reason: s.exitReason,
          error_type: s.errorType ?? null,
          inserted_at: s.insertedAt ?? s.startedAt,
          started_at: s.startedAt,
          finished_at: s.finishedAt,
          input_wiped: !!findDataclip(s.inputDataclipId)?.wiped,
        })),
      })),
    }),
    relationships: {},
    links: { self: `http://localhost:4000/api/work_orders/${wo.id}` },
  };
}

export const workOrderRoutes: Record<string, Handler> = {
  // Public. last_activity_*, search, search_fields, sort and include=runs are planned scope.
  "GET /api/projects/:project_id/work_orders": ({ project_id }, _body, query) => {
    const refused = badInclude(query, ["runs"]);
    if (refused) return refused;
    const errors: NonNullable<Problem["errors"]> = [];
    const list = (key: string) => (query.get(key) ?? "").split(",").filter(Boolean);
    const states = list("state");
    for (const s of states) if (!STATES.includes(s)) errors.push({ code: "invalid", detail: `${s} is not a work order state`, parameter: "state" });
    const fields = query.has("search_fields") ? list("search_fields") : SEARCH_FIELDS;
    for (const f of fields) if (!SEARCH_FIELDS.includes(f)) errors.push({ code: "invalid", detail: `${f} is not a search field`, parameter: "search_fields" });
    const dates = ["inserted_after", "inserted_before", "last_activity_after", "last_activity_before", "updated_after", "updated_before"];
    for (const d of dates) if (query.has(d) && !isIso(query.get(d)!)) errors.push({ code: "invalid", detail: "is not an ISO 8601 date", parameter: d });
    const sort = query.get("sort") ?? "-last_activity";
    const sortField = sort.replace(/^-/, "");
    if (!SORTS.includes(sortField)) errors.push({ code: "invalid", detail: `${sortField} is not a sort field`, parameter: "sort" });
    if (errors.length) return problem({ status: 400, code: "invalid_parameter", errors });

    const iso = (key: string) => (query.get(key) ? new Date(query.get(key)!).toISOString() : null);
    const term = (query.get("search") ?? "").toLowerCase();
    const workflowId = query.get("workflow_id");
    const ids = list("id");
    const field = sortField === "inserted_at" ? "insertedAt" : "lastActivity";
    const all = workOrdersIn(project_id!)
      .filter(
        (wo) =>
          (!workflowId || wo.workflowId === workflowId) &&
          (!ids.length || ids.includes(wo.id)) &&
          (!states.length || states.includes(stateOf(wo.state))) &&
          inRange(wo.insertedAt, iso("inserted_after"), iso("inserted_before")) &&
          inRange(wo.lastActivity, iso("last_activity_after"), iso("last_activity_before")) &&
          (!term || searched(wo, term, fields))
      )
      .sort((a, b) => (sort.startsWith("-") ? -1 : 1) * a[field].localeCompare(b[field]));
    // A search counts at most 50 matches, and meta says when it stopped.
    const counted = term ? all.slice(0, SEARCH_LIMIT) : all;
    const withRuns = list("include").includes("runs");
    const page = paged(`/api/projects/${project_id}/work_orders`, counted.map((wo) => resource(wo, withRuns)), query);
    return json(200, { ...page, meta: { total_entries: counted.length, ...(term && all.length > SEARCH_LIMIT && { search_limit_reached: true }) } });
  },
};
