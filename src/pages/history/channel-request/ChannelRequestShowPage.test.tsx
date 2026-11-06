import { cleanup, fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderPage } from "@/test/renderPage";
import { tooltipOf } from "@/test/tooltip";
import type { ChannelRequestDetail } from "@/types/channels";
import ChannelRequestShowPage, { type ChannelRequestShowPageProps } from "./ChannelRequestShowPage";

type Timing = NonNullable<ChannelRequestDetail["timing"]>;
const noTiming: Timing = { latencyUs: null, queueUs: null, connectUs: null, requestSendUs: null, ttfbUs: null, responseDurationUs: null };
const sent: NonNullable<ChannelRequestDetail["request"]> = {
  method: "POST",
  path: "/api/v1/data",
  queryString: "format=json",
  headers: [
    ["content-type", "application/json"],
    ["authorization", "[REDACTED]"],
  ],
  body: '{"key":"value"}',
  bodySize: 15,
};
const answered: NonNullable<ChannelRequestDetail["response"]> = {
  status: 200,
  headers: [["content-type", "application/json"]],
  body: '{"status":"ok"}',
  bodySize: 15,
};

const request = (overrides: Partial<ChannelRequestDetail> = {}): ChannelRequestDetail => ({
  id: "0b9e7c5a-3d1f-4e2b-8a6c-9f0d2e4b6a81",
  requestId: "4f1c9a8e-2b6d-4e1f-9c3a-7d5e8b2a1f60",
  channelId: "c1",
  state: "success",
  startedAt: "2026-04-10T10:00:00.000000Z",
  completedAt: "2026-04-10T10:00:00.350000Z",
  clientIdentity: "192.168.1.1",
  clientAuth: { type: "api", methodId: "m1", methodName: "Prod API key" },
  destinationCredential: { id: "cred-1", name: "Destination API" },
  snapshot: { name: "orders-proxy", destinationUrl: "https://snapshot.example.com/api", lockVersion: 3 },
  request: sent,
  response: answered,
  errorMessage: null,
  errorCategory: null,
  timing: { ...noTiming, latencyUs: 350_000 },
  wiped: false,
  ...overrides,
});
const failed = (errorMessage: string, errorCategory: ChannelRequestDetail["errorCategory"], timing: Partial<Timing> | null = {}) =>
  request({ state: "error", response: null, errorMessage, errorCategory, timing: timing && { ...noTiming, ...timing } });
const timed = (timing: Partial<Timing>) => request({ timing: { ...noTiming, ...timing } });

function render(props: Partial<ChannelRequestShowPageProps> = {}) {
  renderPage(
    ChannelRequestShowPage,
    {
      project: { id: "p1", parentId: null, color: null },
      projectLabel: "Malawi HIV",
      request: request(),
      channelLockVersion: 3,
      canEditDataRetention: false,
      adminContacts: [],
      historyHref: "/projects/p1/history",
      channelLogsHref: "/projects/p1/history/channels",
      channelHref: "/projects/p1/channels/c1/edit",
      ...props,
    },
    []
  );
}

/** The tooltip on each timing bar, left to right. */
async function titles() {
  const bars = Array.from(document.querySelectorAll("#timing-section .h-7 > div"));
  const tips: (string | null)[] = [];
  for (const bar of bars) tips.push(await tooltipOf(bar));
  return tips;
}
const section = (id: string) => document.getElementById(id);
const again = (props: Partial<ChannelRequestShowPageProps>) => {
  cleanup();
  render(props);
};

describe("ChannelRequestShowPage", () => {
  it("shows the summary from the config the request ran on, headers with secrets redacted, and both bodies", () => {
    render();
    expect(screen.getByText("POST")).toBeTruthy();
    expect(screen.getByText("/api/v1/data")).toBeTruthy();
    expect(screen.getByText("?format=json")).toBeTruthy();
    // Once in the summary, once on the Response section.
    expect(screen.getAllByText("200")).toHaveLength(2);
    expect(screen.getByText("Success")).toBeTruthy();
    expect(screen.getByRole("link", { name: "orders-proxy" }).getAttribute("href")).toBe("/projects/p1/channels/c1/edit");
    expect(screen.getByText("192.168.1.1")).toBeTruthy();
    expect(screen.getByText("Prod API key (API key)")).toBeTruthy();
    expect(screen.getByText("Destination API")).toBeTruthy();
    expect(screen.getByText("https://snapshot.example.com/api")).toBeTruthy();
    // The summary's latency, and the timing bar's end.
    expect(screen.getAllByText("350 ms")).toHaveLength(2);
    // The request id clients see, beside "Request" (the page title has it too).
    expect(screen.getByText("4f1c9a8e")).toBeTruthy();
    const writeText = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    fireEvent.click(screen.getByRole("button", { name: "Copy request ID" }));
    expect(writeText).toHaveBeenCalledWith("4f1c9a8e-2b6d-4e1f-9c3a-7d5e8b2a1f60");

    const redacted = screen.getByText("[REDACTED]");
    expect(redacted.className).toContain("italic");
    expect(section("request-section")!.textContent).toContain('{"key":"value"}');
    expect(section("response-section")!.textContent).toContain('{"status":"ok"}');
    expect(screen.getAllByText("JSON").length).toBe(2);
  });

  it("names the breadcrumb trail, and the page with the request id's first eight characters", () => {
    render();
    expect(screen.getByRole("link", { name: "History" }).getAttribute("href")).toBe("/projects/p1/history");
    expect(screen.getByRole("link", { name: "Channels" }).getAttribute("href")).toBe("/projects/p1/history/channels");
    expect(screen.getByRole("heading", { level: 1, name: "Channel request 4f1c9a8e" })).toBeTruthy();
  });

  it.each(["loading", "forbidden", "notFound"] as const)("keeps the breadcrumbs and says only 'Channel request' while %s", (state) => {
    render({ status: { state }, request: null });
    expect(screen.getByRole("heading", { level: 1, name: "Channel request" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Channels" })).toBeTruthy();
    expect(section("context-section")).toBeNull();
  });

  it("explains a transport error and shows its code, with one timing bar", async () => {
    render({ request: failed("econnrefused", "transport", { latencyUs: 100_000 }) });
    expect(screen.getByText("No response received")).toBeTruthy();
    expect(screen.getByText("Connection refused — the destination server is not accepting connections on this port")).toBeTruthy();
    expect(screen.getByText("econnrefused")).toBeTruthy();
    expect(await titles()).toContain("Total: 100 ms");
  });

  it("shows an error the server doesn't categorise as no response, with its code and the timing", async () => {
    render({ request: failed("tls_alert", null, { latencyUs: 80_000 }) });
    expect(screen.getByText("No response received")).toBeTruthy();
    expect(within(section("response-section")!).getAllByText("tls_alert")).toHaveLength(1);
    expect(await titles()).toContain("Total: 80 ms");
  });

  it("shows a timed-out request as one thirty-second bar", async () => {
    render({ request: request({ state: "timeout", response: null, errorMessage: "response_timeout", errorCategory: "transport", timing: { ...noTiming, latencyUs: 30_000_000 } }) });
    expect(await titles()).toEqual(["Total: 30000 ms"]);
    expect(section("timing-section")!.textContent).toContain("30.0s");
    expect(screen.getByText("Timeout")).toBeTruthy();
  });

  it("shows the start and, when there is none yet, a dash for the completion", () => {
    render({ request: request({ completedAt: null }) });
    expect(screen.getAllByText("--")).toHaveLength(1);
    again({});
    expect(screen.queryByText("--")).toBeNull();
  });

  it("says a truncated body is a preview, in bytes", () => {
    render({ request: request({ request: { ...sent, body: "é".repeat(100), bodySize: 10_240 } }) });
    expect(section("request-section")!.textContent).toContain("Preview: 200 B of 10.0 KB");
  });

  it("explains a credential error and hides the timing section", () => {
    render({ request: failed("credential_missing_auth_fields", "credential", null) });
    expect(screen.getByText("Request not sent — credential error")).toBeTruthy();
    expect(screen.getByText("The configured credential is missing required authentication fields")).toBeTruthy();
    expect(screen.getByText("credential_missing_auth_fields")).toBeTruthy();
    expect(section("timing-section")).toBeNull();
  });

  it("draws every phase with the proxy overhead and the TTFB marker", async () => {
    render({ request: timed({ queueUs: 2_000, connectUs: 15_000, requestSendUs: 5_000, ttfbUs: 180_000, responseDurationUs: 65_000, latencyUs: 260_000 }) });
    expect(await titles()).toEqual(["Queue: 2 ms", "Connect: 15 ms", "Send: 5 ms", "Processing: 158 ms", "Recv: 65 ms"]);
    expect(section("timing-section")!.textContent).toContain("TTFB: 180 ms");
    expect(section("timing-section")!.textContent).toContain("Proxy overhead");
    expect(section("timing-section")!.textContent).toContain("0 ms");
    expect(section("timing-section")!.textContent).toContain("260 ms");
  });

  it("leaves out a zero connect, and computes processing from a missing queue and connect", async () => {
    render({ request: timed({ queueUs: 1_000, connectUs: 0, requestSendUs: 4_000, ttfbUs: 120_000, responseDurationUs: 30_000, latencyUs: 155_000 }) });
    expect(await titles()).toEqual(["Queue: 1 ms", "Send: 4 ms", "Processing: 115 ms", "Recv: 30 ms"]);

    again({ request: timed({ requestSendUs: 10_000, ttfbUs: 200_000, responseDurationUs: 50_000, latencyUs: 260_000 }) });
    expect(await titles()).toContain("Processing: 190 ms");
  });

  it("degrades to TTFB and download, then to one total bar", async () => {
    render({ request: timed({ ttfbUs: 280_000, latencyUs: 350_000 }) });
    expect(await titles()).toEqual(["TTFB: 280 ms", "Download: 70 ms"]);
    expect(section("timing-section")!.textContent).not.toContain("Proxy overhead");

    again({ request: timed({ latencyUs: 420_000 }) });
    expect(await titles()).toEqual(["Total: 420 ms"]);
    expect(section("timing-section")!.textContent).toContain("420 ms");
  });

  it("positions the TTFB marker on the phases' own scale, not the latency", () => {
    const marker = () => document.querySelector<HTMLElement>("#timing-section .bg-inverse")!.style.left;
    render({ request: timed({ queueUs: 10_000, connectUs: 20_000, requestSendUs: 5_000, ttfbUs: 100_000, responseDurationUs: 100_000, latencyUs: 250_000 }) });
    expect(marker()).toBe("50%");

    again({ request: timed({ queueUs: 10_000, connectUs: 20_000, requestSendUs: 5_000, ttfbUs: 100_000, responseDurationUs: 0, latencyUs: 150_000 }) });
    expect(marker()).toBe("100%");
  });

  it("shows the snapshot the request ran on, folded away, and flags a config that changed since", () => {
    render();
    const openContext = () => fireEvent.click(within(section("context-section")!).getByRole("button", { name: "Context" }));
    openContext();
    const context = section("context-section")!;
    for (const label of ["Destination URL", "Channel name", "Config version"]) expect(within(context).getByText(label)).toBeTruthy();
    expect(within(context).getByText("https://snapshot.example.com/api")).toBeTruthy();
    expect(within(context).queryByText("Config changed")).toBeNull();

    again({ channelLockVersion: 4 });
    openContext();
    expect(within(section("context-section")!).getByText("Config changed")).toBeTruthy();
  });

  it("says when a body was not captured, hides the body when there was none, and shows metadata only for binary content", () => {
    render({ request: request({ request: { ...sent, body: null, bodySize: 2048 } }) });
    expect(within(section("request-section")!).getByText(/Body not captured/)).toBeTruthy();

    again({ request: request({ request: { ...sent, body: null, bodySize: null } }) });
    expect(within(section("request-section")!).queryByText(/Body not captured/)).toBeNull();
    expect(within(section("request-section")!).queryByText("Body")).toBeNull();

    again({ request: request({ response: { status: 200, headers: [["content-type", "application/octet-stream"]], body: null, bodySize: 4096 } }) });
    const response = section("response-section")!;
    expect(response.textContent).toContain("application/octet-stream");
    expect(response.textContent).toContain("4.0 KB");
    expect(response.querySelector("pre")).toBeNull();
  });

  it("names a deleted auth method and credential, and says None for an open channel with no credential", () => {
    render({ request: request({ clientAuth: { type: "api", methodId: "m1", methodName: null }, destinationCredential: { id: "cred-1", name: null } }) });
    expect(screen.getByText("(deleted) (API key)")).toBeTruthy();
    expect(screen.getByText("(deleted)")).toBeTruthy();

    again({ request: request({ clientAuth: { type: null, methodId: null, methodName: null }, destinationCredential: null }) });
    expect(screen.getAllByText("None")).toHaveLength(2);
  });

  it("replaces the request and response with the wiped notice, pointing admins at the policy", () => {
    render({ request: request({ wiped: true, clientIdentity: null, request: { ...sent, path: null, headers: null, body: null } }), canEditDataRetention: true });
    expect(screen.getByRole("heading", { name: "No Request/Response Data here!" })).toBeTruthy();
    expect(screen.getByText("Request/Response data for this channel request has not been retained in accordance with your project's data storage policy.")).toBeTruthy();
    expect(screen.getByText(/for future requests/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "this policy" }).getAttribute("href")).toBe("/projects/p1/settings#data-storage");
    expect(document.body.textContent).not.toContain("rerun this work order");
    expect(section("request-section")).toBeNull();
    expect(section("response-section")).toBeNull();
  });

  it("tells others whom to contact about a wiped request, naming the admins", async () => {
    render({ request: request({ wiped: true }), canEditDataRetention: false, adminContacts: ["admin@example.com"] });
    expect(screen.getByText(/Contact one of your/)).toBeTruthy();
    expect(await tooltipOf(screen.getByText("project admins"))).toBe("admin@example.com");
    expect(document.body.textContent).not.toContain("for future requests");
    expect(screen.queryByRole("link", { name: "this policy" })).toBeNull();
  });
});
