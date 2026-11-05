import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { request } from "@/api/client";
import { FAKE_BACKUP_CODE, FAKE_PASSWORD, resetFakeApi } from "@/api/testing";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import AuthTwoFactorPageQuery from "./AuthTwoFactorPage.query";

const wait = { timeout: 3000 };

function Where() {
  const { pathname } = useLocation();
  return <p>At {pathname}</p>;
}

function renderAt(path: string) {
  render(
    <ApiProvider retry={false}>
      <MemoryRouter initialEntries={[path]}>
        <ReactRouterAdapter>
          <Routes>
            <Route path="/users/two-factor" element={<AuthTwoFactorPageQuery />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </ReactRouterAdapter>
      </MemoryRouter>
    </ApiProvider>
  );
}

const verify = async (label: RegExp, code: string) => {
  fireEvent.change(await screen.findByRole("textbox", { name: label }, wait), { target: { value: code } });
  fireEvent.click(screen.getByRole("button", { name: "Verify" }));
};

describe("AuthTwoFactorPageQuery", () => {
  beforeEach(async () => {
    resetFakeApi();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
    // Signed out, then the password for an account with MFA: the session waits for the code.
    await request("DELETE", "/api/session");
    await request("POST", "/api/session", { email: "super@openfn.org", password: FAKE_PASSWORD }).catch(() => undefined);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("refuses a wrong code in Lightning's words", async () => {
    renderAt("/users/two-factor");
    await verify(/Authentication Code/, "000000");
    expect(await screen.findByText("Invalid two-factor authentication code", {}, wait)).toBeTruthy();
  });

  it("takes a backup code and goes to return_to", async () => {
    renderAt("/users/two-factor?authentication_type=backup_code&return_to=%2Fprofile");
    await verify(/Backup Code/, FAKE_BACKUP_CODE);
    expect(await screen.findByText("At /profile", {}, wait)).toBeTruthy();
  });

  it("takes each backup code only once", async () => {
    await request("POST", "/api/session", { backup_code: FAKE_BACKUP_CODE });
    await request("DELETE", "/api/session");
    await request("POST", "/api/session", { email: "super@openfn.org", password: FAKE_PASSWORD }).catch(() => undefined);
    renderAt("/users/two-factor?authentication_type=backup_code");
    await verify(/Backup Code/, FAKE_BACKUP_CODE);
    expect(await screen.findByText("Invalid two-factor authentication code", {}, wait)).toBeTruthy();
  });

  it("keeps return_to on the link to the other method", async () => {
    renderAt("/users/two-factor?return_to=%2Fprofile");
    const link = await screen.findByRole("link", { name: "Use your backup code" }, wait);
    expect(link.getAttribute("href")).toContain("return_to=%2Fprofile");
  });
});
