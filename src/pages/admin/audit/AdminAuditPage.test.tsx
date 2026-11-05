import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderPage } from "@/test/renderPage";
import type { AuditEvent } from "@/types/admin";
import AdminAuditPage from "./AdminAuditPage";

const event: AuditEvent = {
  id: "audit-1",
  event: "snapshot_created",
  itemType: "workflow",
  itemId: "11111111-2222-3333-4444-555555555555",
  actorId: "66666666-7777-8888-9999-000000000000",
  actorLabel: "Amy Admin",
  actorIdentifier: "amy@example.com",
  insertedAt: "2026-10-14T18:36:12Z",
  changes: { before: null, after: null },
};

describe("AdminAuditPage", () => {
  it("renders the events it is given and links to the next page", () => {
    renderPage(AdminAuditPage, { events: [event], page: { number: 1, size: 10, totalPages: 2 }, status: { state: "ready" } }, []);

    expect(screen.getByText("Amy Admin")).toBeTruthy();
    expect(screen.getByRole("link", { name: "2" }).getAttribute("href")).toMatch(/\?page=2$/);
  });

  it("says No results found, with no table, when there are no events", () => {
    renderPage(AdminAuditPage, { events: [], page: { number: 1, size: 10, totalPages: 1 }, status: { state: "ready" } }, []);

    expect(screen.getByText("No results found")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });
});
