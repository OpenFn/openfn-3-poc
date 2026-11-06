import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { authMessages } from "@/constants";
import { RequestError } from "@/utils/errors";
import AuthConfirmationRequiredPage, { type ResendResult } from "./AuthConfirmationRequiredPage";

function renderPage(onResend: () => Promise<ResendResult> = vi.fn().mockResolvedValue({ status: "sent" })) {
  render(<AuthConfirmationRequiredPage onResend={onResend} />);
  return onResend;
}

const resend = () => screen.getByRole("button", { name: "Resend confirmation email" });
const sent = "We have sent a new confirmation link to your email address.";

describe("AuthConfirmationRequiredPage", () => {
  it("explains the block and offers a resend and Log out", () => {
    renderPage();
    expect(screen.getByRole("heading", { level: 1, name: "Confirm your email address" })).toBeTruthy();
    expect(screen.getByText(/blocked pending email confirmation/).textContent).toContain("your email address");
    expect(screen.getByRole("link", { name: "Log out" }).getAttribute("href")).toBe("/users/log_out");
  });

  it("says a new link was sent, and stays enabled for another", async () => {
    const onResend = renderPage();
    fireEvent.click(resend());
    expect(await screen.findByText(sent)).toBeTruthy();
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(resend().hasAttribute("disabled")).toBe(false);
    expect(resend().getAttribute("aria-disabled")).toBeNull();
  });

  it("shows the host's throttle message in place of the sent one, then a failure in its place", async () => {
    const onResend = vi
      .fn()
      .mockResolvedValueOnce({ status: "sent" })
      .mockResolvedValueOnce({ status: "throttled", message: authMessages.resendThrottled })
      .mockResolvedValueOnce({ status: "failed" });
    renderPage(onResend);
    fireEvent.click(resend());
    await screen.findByText(sent);
    fireEvent.click(resend());
    expect(await screen.findByText(authMessages.resendThrottled)).toBeTruthy();
    expect(screen.queryByText(sent)).toBeNull();
    fireEvent.click(resend());
    expect(await screen.findByText(authMessages.resendFailed)).toBeTruthy();
    expect(screen.queryByText(authMessages.resendThrottled)).toBeNull();
  });

  it("tells a request that never answered apart from one the host could not send", async () => {
    renderPage(vi.fn().mockRejectedValue(new RequestError("Connection lost. Please try again.")));
    fireEvent.click(resend());
    expect(await screen.findByText("Connection lost. Please try again.")).toBeTruthy();
    expect(screen.queryByText(authMessages.resendFailed)).toBeNull();
  });
});
