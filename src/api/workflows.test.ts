import { beforeEach, describe, expect, it } from "vitest";
import { listAll, request } from "./client";
import { resetFakeApi } from "./testing";
import type { ApiWorkflow } from "./workflows";

const PROJECT = "4adf2644-ed4e-4f97-a24c-ab35b3cb1efa";
const refusal = (promise: Promise<unknown>) => promise.then(() => null, (error: unknown) => error);

describe("GET /api/projects/:id/workflows, on the fake server", () => {
  beforeEach(() => resetFakeApi());

  it("sorts as asked, newest latest run first with -last_work_order_updated_at", async () => {
    const byName = await listAll<ApiWorkflow>(`/api/projects/${PROJECT}/workflows?sort=name`, "workflows");
    const names = byName.map((w) => w.name);
    expect(names.length).toBeGreaterThan(1);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));

    const byRun = await listAll<ApiWorkflow>(`/api/projects/${PROJECT}/workflows?include=stats&sort=-last_work_order_updated_at`, "workflows");
    const runs = byRun.map((w) => w.stats!.last_work_order?.updated_at).filter(Boolean);
    expect(runs).toEqual([...runs].sort().reverse());
  });

  it("refuses an unknown sort with 400, and a project you can't open with 403", async () => {
    expect(await refusal(request("GET", `/api/projects/${PROJECT}/workflows?sort=enabled`))).toMatchObject({ status: 400, code: "invalid_parameter" });
    expect(await refusal(request("GET", `/api/projects/nope/workflows`))).toMatchObject({ status: 403, code: "forbidden" });
  });
});
