import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { AuditEvent } from "../../types/admin";
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
  it("renders the events it is given and asks for another page", () => {
    const onPage = vi.fn();
    render(<AdminAuditPage events={[event]} pageNumber={1} pageSize={10} totalEntries={14} onPage={onPage} />);

    expect(screen.getByText("Amy Admin")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(onPage).toHaveBeenCalledWith(2);
  });
});
