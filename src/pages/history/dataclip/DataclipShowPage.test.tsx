import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import type { DataclipDetail } from "@/types/history";
import DataclipShowPage, { type DataclipShowPageProps } from "./DataclipShowPage";

const ID = "9a8b7c6d-3333-4a4a-8b8b-0123456789ab";
const dataclip: DataclipDetail = { id: ID, name: null, type: "http_request", insertedAt: "2026-10-14T09:30:00Z", updatedAt: "2026-10-14T09:31:00Z", wipedAt: null };

function render(props: Partial<DataclipShowPageProps> = {}) {
  renderPage(
    DataclipShowPage,
    {
      project: { id: "p1", parentId: null, color: null },
      projectLabel: "Malawi HIV",
      dataclip,
      body: { text: '{\n  "x": 1\n}' },
      historyHref: "/projects/p1/history",
      ...props,
    },
    []
  );
}

describe("DataclipShowPage", () => {
  it("shows the dataclip's details and its body", () => {
    render();
    expect(screen.getByRole("heading", { level: 1, name: "Dataclip 9a8b7c6d" })).toBeTruthy();
    expect(screen.getByText(ID)).toBeTruthy();
    expect(screen.getByText("http_request")).toBeTruthy();
    expect(screen.queryByText("Wiped")).toBeNull();
    expect(screen.getByText(/"x"/)).toBeTruthy();
  });

  it("shows when the dataclip was wiped, and no body", () => {
    render({ dataclip: { ...dataclip, type: "step_result", wipedAt: "2026-10-20T00:00:00Z" }, body: undefined });
    expect(screen.getByText("Wiped")).toBeTruthy();
    expect(screen.getByText("No data available")).toBeTruthy();
  });

  it.each(["loading", "forbidden"] as const)("keeps the breadcrumbs and says only 'Dataclip' while %s", (state) => {
    render({ status: { state }, dataclip: null, body: undefined });
    expect(screen.getByRole("heading", { level: 1, name: "Dataclip" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "History" }).getAttribute("href")).toBe("/projects/p1/history");
    expect(screen.queryByText("Dataclip details")).toBeNull();
  });
});
