import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../components/primitives/Toast";
import { session } from "../../mock-data/users";
import { RouterProvider, type Router } from "../../routing/router";
import SessionProvider from "../../session/SessionProvider";
import ProfilePageReplica from "./ProfilePage.replica";

describe("ProfilePageReplica", () => {
  it("compares the new email exactly for 'has not changed', and any case for 'has already been taken'", async () => {
    const router: Router = { navigate: vi.fn(), useHref: (to) => to, useLocation: () => ({ pathname: "/profile", search: "", hash: "" }) };
    render(
      <SessionProvider session={session}>
        <RouterProvider value={router}>
          <ToastProvider>
            <MemoryRouter initialEntries={["/profile"]}>
              <Routes>
                <Route path="/profile" element={<ProfilePageReplica />} />
              </Routes>
            </MemoryRouter>
          </ToastProvider>
        </RouterProvider>
      </SessionProvider>
    );
    const email = within(document.getElementById("email-form")!);
    fireEvent.change(email.getByLabelText(/New email address/), { target: { value: session.user.email.toUpperCase() } });
    fireEvent.change(email.getByLabelText(/Enter password to confirm/), { target: { value: "hunter2hunter2" } });
    fireEvent.submit(document.getElementById("email-form")!);
    expect(await email.findByText("has already been taken", {}, { timeout: 2000 })).toBeTruthy();
    expect(screen.queryByText("has not changed")).toBeNull();
  });
});
