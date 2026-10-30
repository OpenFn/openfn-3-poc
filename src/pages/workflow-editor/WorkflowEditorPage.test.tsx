import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { ToastProvider } from "../../components/primitives/Toast";
import { ReactRouterAdapter } from "../../routing/ReactRouterAdapter";
import { session } from "../../mock-data/users";
import SessionProvider from "../../session/SessionProvider";
import WorkflowEditorPage from "./WorkflowEditorPage";

const renderEditor = () =>
  render(
    <SessionProvider session={session}>
      <ToastProvider>
        <MemoryRouter initialEntries={["/projects/4adf2644-ed4e-4f97-a24c-ab35b3cb1efa/w/wf-openhie"]}>
          <ReactRouterAdapter>
            <Routes>
              <Route path="/projects/:projectId/w/:workflowId" element={<WorkflowEditorPage />} />
            </Routes>
          </ReactRouterAdapter>
        </MemoryRouter>
      </ToastProvider>
    </SessionProvider>
  );
const step = () => screen.getByRole("button", { name: /^Transform data to FHIR standard/ });

describe("WorkflowEditorPage", () => {
  it("moves focus into the inspector when a step is picked from the keyboard, and back to the step on Escape", async () => {
    renderEditor();
    step().focus();
    fireEvent.keyDown(step(), { key: "Enter" });
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Job Name" })));
    fireEvent.keyDown(document.activeElement!, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("textbox", { name: "Job Name" })).toBeNull());
    expect(document.activeElement).toBe(step());
  });

  it("leaves focus where it is when a step is clicked", async () => {
    renderEditor();
    fireEvent.click(step());
    const name = await screen.findByRole("textbox", { name: "Job Name" });
    expect(document.activeElement).not.toBe(name);
  });
});
