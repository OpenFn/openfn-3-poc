import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApiProvider from "@/api/ApiProvider";
import { stepUp } from "@/api/session";
import { FAKE_PASSWORD, failNext, resetFakeApi } from "@/api/testing";
import { ToastProvider } from "@/components/primitives/Toast";
import { ReactRouterAdapter } from "@/routing/ReactRouterAdapter";
import BackupCodesPageQuery from "./BackupCodesPage.query";

const wait = { timeout: 3000 };

function renderRoute() {
  render(
    <ApiProvider retry={false}>
      <ToastProvider>
        <MemoryRouter>
          <ReactRouterAdapter>
            <BackupCodesPageQuery />
          </ReactRouterAdapter>
        </MemoryRouter>
      </ToastProvider>
    </ApiProvider>
  );
}

const regenerate = () => fireEvent.click(screen.getByRole("button", { name: "Generate new backup codes" }));

async function confirmPassword(password: string) {
  fireEvent.change(await screen.findByLabelText(/Password/, {}, wait), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
}

describe("BackupCodesPageQuery", () => {
  beforeEach(() => {
    resetFakeApi();
    // The fake server waits 300ms before each answer; Testing Library moves the fake clock on while it waits.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.stubGlobal("jest", { advanceTimersByTime: vi.advanceTimersByTime.bind(vi) });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("loads the codes after stepping up", async () => {
    await stepUp({ password: FAKE_PASSWORD });
    renderRoute();
    expect(await screen.findByText("demo00001", {}, wait)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("asks for the password when the server holds the codes back, then shows them", async () => {
    renderRoute();
    await confirmPassword(FAKE_PASSWORD);
    expect(await screen.findByText("demo00001", {}, wait)).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the codes on screen once the step-up has run out", async () => {
    await stepUp({ password: FAKE_PASSWORD });
    renderRoute();
    await screen.findByText("demo00001", {}, wait);
    vi.advanceTimersByTime(5 * 60_000 + 1);
    fireEvent.focus(window);
    fireEvent(window, new Event("online"));
    await vi.advanceTimersByTimeAsync(1000);
    expect(screen.getByText("demo00001")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("keeps the popup open and shows no codes when the password is wrong", async () => {
    renderRoute();
    await confirmPassword("not-the-password");
    expect(await screen.findByText("The email, password or code is not valid.", {}, wait)).toBeTruthy();
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByText("demo00001")).toBeNull();
  });

  it("regenerate shows the new codes", async () => {
    await stepUp({ password: FAKE_PASSWORD });
    renderRoute();
    await screen.findByText("demo00001", {}, wait);
    regenerate();
    expect(await screen.findByText("New Backup Codes Generated!", {}, wait)).toBeTruthy();
    expect(screen.queryByText(/^demo/)).toBeNull();
    expect(screen.getAllByText(/^\w{9}$/)).toHaveLength(10);
  });

  it("once the step-up has run out, regenerate asks for the password again, then regenerates", async () => {
    await stepUp({ password: FAKE_PASSWORD });
    renderRoute();
    await screen.findByText("demo00001", {}, wait);
    vi.advanceTimersByTime(5 * 60_000 + 1);
    regenerate();
    await confirmPassword(FAKE_PASSWORD);
    expect(await screen.findByText("New Backup Codes Generated!", {}, wait)).toBeTruthy();
    expect(screen.getAllByText(/^\w{9}$/)).toHaveLength(10);
  });

  it("never says new codes were made when they could not be loaded", async () => {
    await stepUp({ password: FAKE_PASSWORD });
    renderRoute();
    await screen.findByText("demo00001", {}, wait);
    failNext("GET /api/me/mfa", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    regenerate();
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
    expect(screen.queryByText("New Backup Codes Generated!")).toBeNull();
  });

  it("a refused regenerate shows its error and keeps the codes", async () => {
    await stepUp({ password: FAKE_PASSWORD });
    failNext("POST /api/me/mfa/backup_codes", { status: 500, code: "internal", detail: "Something went wrong in Lightning." });
    renderRoute();
    await screen.findByText("demo00001", {}, wait);
    regenerate();
    expect(await screen.findByText("Something went wrong in Lightning.", {}, wait)).toBeTruthy();
    expect(screen.getByText("demo00001")).toBeTruthy();
  });
});
