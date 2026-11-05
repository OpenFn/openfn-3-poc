import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { stepUp } from "@/api/session";
import { ToastProvider } from "@/components/primitives/Toast";
import { session } from "@/mock-data/users";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import SessionProvider from "@/session/SessionProvider";
import TokensPageRoute from "./TokensPage.route";

const wait = { timeout: 3000 };

function renderRoute() {
  render(
    <SessionProvider session={session}>
      <ApiProvider retry={false}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/profile/tokens"]}>
            <ReactRouterAdapter>
              <Routes>
                <Route path="/profile/tokens" element={<TokensPageRoute />} />
                <Route path="/profile/tokens/:tokenId/delete" element={<TokensPageRoute />} />
              </Routes>
            </ReactRouterAdapter>
          </MemoryRouter>
        </ToastProvider>
      </ApiProvider>
    </SessionProvider>
  );
}

const rows = async () => within(await screen.findByRole("table", {}, wait)).getAllByRole("row").length;
// The list reloads after a save; wait for the new row count.
const rowsBecome = (count: number) =>
  waitFor(() => expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(count), wait);
const generate = () => fireEvent.click(screen.getByRole("button", { name: "Generate New Token" }));
const newToken = async () => (await screen.findByRole("textbox", { name: "New token" }, wait)) as HTMLInputElement;

async function confirmPassword(password: string) {
  fireEvent.change(await screen.findByLabelText(/Password/, {}, wait), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
}

describe("TokensPageRoute", () => {
  beforeEach(() => {
    resetFakeApi();
    // The fake server waits 300ms before each answer. With fake timers and a `jest`
    // global, Testing Library moves the clock on while it waits, so those waits are instant.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("loads the list from the server", async () => {
    renderRoute();
    expect(await rows()).toBe(3);
  });

  it("after stepping up, Generate shows the new token once and the list reloads with it", async () => {
    await stepUp({ password: FAKE_PASSWORD });
    renderRoute();
    const before = await rows();
    generate();
    const secret = await newToken();
    expect(secret.value).toMatch(/^demo\.fake-token-not-real\./);
    await rowsBecome(before + 1);
    expect(screen.getByText("..." + secret.value.slice(-10))).toBeTruthy();
  });

  it("not stepped up, Generate asks for the password in a popup, then generates the token", async () => {
    renderRoute();
    const before = await rows();
    generate();
    await confirmPassword(FAKE_PASSWORD);
    expect((await newToken()).value).toMatch(/^demo\.fake-token-not-real\./);
    await rowsBecome(before + 1);
  });

  it("keeps the password popup open and generates nothing when the password is wrong", async () => {
    renderRoute();
    await rows();
    generate();
    await confirmPassword("not-the-password");
    expect(await screen.findByText("The email, password or code is not valid.", {}, wait)).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "New token" })).toBeNull();
  });

  it("asks before deleting, then the list reloads without the token", async () => {
    renderRoute();
    const before = await rows();
    fireEvent.click(screen.getAllByRole("link", { name: "Delete token" })[0]!);
    fireEvent.click(await screen.findByRole("button", { name: "Yes" }, wait));
    expect(await screen.findByText("Token deleted successfully", {}, wait)).toBeTruthy();
    await rowsBecome(before - 1);
  });

  it("shows the server's message in the table's place when the list fails to load", async () => {
    failNext("GET /api/me/tokens", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderRoute();
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
  });
});
