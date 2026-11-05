import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_PASSWORD, resetFakeApi } from "@/api/testing";
import { session } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import SessionProvider from "@/session/SessionProvider";
import AuthConfirmAccessPageQuery from "./AuthConfirmAccessPage.query";

const wait = { timeout: 3000 };

function renderRoute() {
  render(
    <SessionProvider session={session}>
      <ApiProvider retry={false}>
        <MemoryRouter initialEntries={["/auth/confirm_access"]}>
          <ReactRouterAdapter>
            <Routes>
              <Route path="/auth/confirm_access" element={<AuthConfirmAccessPageQuery />} />
              <Route path="/profile" element={<p>Profile</p>} />
            </Routes>
          </ReactRouterAdapter>
        </MemoryRouter>
      </ApiProvider>
    </SessionProvider>
  );
}

const confirm = (password: string) => {
  fireEvent.change(document.getElementById("user_password")!, { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
};
const steppedUp = () => request<{ data: { stepped_up_until: string | null } }>("GET", "/api/session").then((r) => r.data.stepped_up_until !== null);

describe("AuthConfirmAccessPageQuery", () => {
  beforeEach(() => {
    resetFakeApi();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("steps the session up with the password, then goes back to the profile", async () => {
    renderRoute();
    confirm(FAKE_PASSWORD);
    expect(await screen.findByText("Profile", {}, wait)).toBeTruthy();
    expect(await steppedUp()).toBe(true);
  });

  it("shows the server's refusal for a wrong password and stays", async () => {
    renderRoute();
    confirm("wrong");
    expect(await screen.findByText("The email, password or code is not valid.", {}, wait)).toBeTruthy();
    expect(await steppedUp()).toBe(false);
  });
});
