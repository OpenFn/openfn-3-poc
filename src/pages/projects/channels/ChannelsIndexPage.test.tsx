import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { isDisabled } from "@/test/disabled";
import { renderPage } from "@/test/renderPage";
import { pickOption } from "@/test/select";
import { tooltipOf } from "@/test/tooltip";
import type { ChannelRow } from "@/types/channels";
import { RequestError } from "@/utils/errors";
import ChannelsIndexPage, { type ChannelsIndexPageProps } from "./ChannelsIndexPage";

const lab: ChannelRow = {
  id: "c1",
  name: "lab-results",
  enabled: true,
  destinationUrl: "https://destination.example.com/data",
  proxyUrl: "https://lightning.example.com/channels/c1",
  requestCount: 2,
  lastActivityAt: "2025-03-05T14:30:00Z",
  clientAuthMethodIds: ["wam1"],
  destinationCredentialId: "cred1",
  lockVersion: 3,
};
const idle: ChannelRow = { ...lab, id: "c2", name: "idle", enabled: false, requestCount: 0, lastActivityAt: null, clientAuthMethodIds: [], destinationCredentialId: null };

type Data = Omit<ChannelsIndexPageProps, "onClose" | "onCreate" | "onUpdate" | "onDelete">;
const render = (data: Partial<Data> = {}) =>
  renderPage(
    ChannelsIndexPage,
    {
      project: { id: "p1", parentId: null, color: null },
      projectLabel: "Malawi HIV",
      channels: [idle, lab],
      canCreateChannel: true,
      canEditChannel: true,
      canDeleteChannel: true,
      createHref: "/projects/p1/channels/new",
      editHref: (id) => `/projects/p1/channels/${id}/edit`,
      logsHref: (id) => `/logs/${id}`,
      credentialsSettingsHref: "/projects/p1/settings#credentials",
      webhookSecuritySettingsHref: "/projects/p1/settings#webhook_security",
      creating: false,
      editingId: null,
      credentialOptions: [["My API Key", "cred1"]],
      authMethodOptions: [["API Key Auth", "wam1"]],
      ...data,
    },
    ["onClose", "onCreate", "onUpdate", "onDelete"]
  );

const rowOf = (name: string) => screen.getByText(name).closest("tr")!;
const dialog = () => screen.getByRole("dialog");
const credentialPicker = () => within(dialog()).getByRole("button", { name: /^Destination credential/ });

describe("ChannelsIndexPage", () => {
  it("lists the channels with their destination, proxy URL, requests and last activity, each linking to its logs", () => {
    render();
    expect(screen.getByRole("heading", { name: "Channels (2)" })).toBeTruthy();
    expect(screen.getByText("Reads, writes and events on other systems, each with its own endpoint.")).toBeTruthy();
    const row = rowOf("lab-results");
    expect(row.textContent).toContain("https://destination.example.com/data");
    expect(row.textContent).toContain("lightning.example.com/channels/c1");
    expect(within(row).getByRole("link", { name: "2" }).getAttribute("href")).toBe("/logs/c1");
    expect(within(rowOf("idle")).getByRole("link", { name: "Never" }).getAttribute("href")).toBe("/logs/c2");
    expect(screen.getByRole("link", { name: "New channel" }).getAttribute("href")).toBe("/projects/p1/channels/new");
    expect(within(row).getByRole("link", { name: "Edit lab-results" }).getAttribute("href")).toBe("/projects/p1/channels/c1/edit");
  });

  it("with no channels, New channel stays in the header and the empty state is words only", () => {
    render({ channels: [] });
    expect(screen.getByText("No channels yet.")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: /New channel/ })).toHaveLength(1);
  });

  it("switches a channel on at once with only `enabled` changed, and says nothing when it saves", async () => {
    const host = render();
    const toggle = within(rowOf("idle")).getByRole("switch", { name: "idle" });
    fireEvent.click(toggle);
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(host.calls("onUpdate")).toEqual([[idle, { enabled: true }]]);
    // A second press before the first has saved would send a stale version, so it is ignored.
    fireEvent.click(toggle);
    expect(host.calls("onUpdate")).toHaveLength(1);
    await host.resolve("onUpdate");
    host.sendProps({ channels: [{ ...idle, enabled: true, lockVersion: 4 }, lab] });
    expect(toggle.getAttribute("aria-checked")).toBe("true");
    expect(screen.queryByText(/updated/)).toBeNull();
  });

  it("puts a switch back and shows the server's message when the save is refused", async () => {
    const host = render();
    const toggle = within(rowOf("idle")).getByRole("switch", { name: "idle" });
    fireEvent.click(toggle);
    await host.reject("onUpdate", new RequestError("Someone else changed this channel since you loaded it. Load it again and retry."));
    expect(toggle.getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("alert").textContent).toContain("Someone else changed this channel since you loaded it. Load it again and retry.");
  });

  it("is read-only for a viewer: New channel off with the reason, Enabled in words, no Edit or Delete", async () => {
    render({ canCreateChannel: false, canEditChannel: false, canDeleteChannel: false });
    expect(screen.queryByRole("link", { name: "New channel" })).toBeNull();
    const create = screen.getByRole("button", { name: "New channel" });
    expect(isDisabled(create)).toBe(true);
    expect(await tooltipOf(create)).toBe("You are not authorized to perform this action.");
    expect(screen.queryAllByRole("switch")).toHaveLength(0);
    expect(rowOf("lab-results").textContent).toContain("Enabled");
    expect(rowOf("idle").textContent).toContain("Disabled");
    expect(screen.queryByRole("link", { name: /^Edit/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Delete/ })).toBeNull();
  });

  it("deletes after asking, then says so; a refusal keeps the dialog open with the message", async () => {
    const host = render();
    fireEvent.click(within(rowOf("idle")).getByRole("button", { name: "Delete idle" }));
    expect(within(dialog()).getByRole("heading", { name: "Delete idle?" })).toBeTruthy();
    expect(dialog().textContent).toContain(
      "Requests to it stop being forwarded straight away, and its address stops working. Workflows that call it will fail at that step. Its request history is deleted too."
    );
    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete channel" }));
    await waitFor(() => expect(host.calls("onDelete")).toEqual([["c2"]]));
    await host.reject("onDelete", new RequestError("A request arrived while the channel was being deleted. Try again."));
    expect(within(dialog()).getByText("A request arrived while the channel was being deleted. Try again.")).toBeTruthy();

    fireEvent.click(within(dialog()).getByRole("button", { name: "Delete channel" }));
    await waitFor(() => expect(host.calls("onDelete")).toHaveLength(2));
    await host.resolve("onDelete");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(screen.getByText("Channel deleted.")).toBeTruthy();
    // Its row and Delete are gone, so focus goes to New channel.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("link", { name: "New channel" })));
  });

  it("closes the delete dialog when the channel is deleted elsewhere", () => {
    const host = render();
    fireEvent.click(within(rowOf("idle")).getByRole("button", { name: "Delete idle" }));
    expect(dialog()).toBeTruthy();
    host.sendProps({ channels: [lab] });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("shows the new channel form with its options, its links to project settings, and the open-channel warning", async () => {
    render({ creating: true });
    expect(within(dialog()).getByRole("heading", { name: "New channel" })).toBeTruthy();
    expect(screen.getByPlaceholderText("https://")).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Add new" }).map((a) => [a.getAttribute("href"), a.getAttribute("target")])).toEqual([
      ["/projects/p1/settings#credentials", "_blank"],
      ["/projects/p1/settings#webhook_security", "_blank"],
    ]);
    expect(screen.getByText("With none, anyone who has the proxy URL can use this channel.").getAttribute("aria-live")).toBe("polite");
    fireEvent.click(screen.getByLabelText("API Key Auth"));
    expect(dialog().textContent).not.toContain("With none, anyone");
    expect(credentialPicker().textContent).toBe("None");
    await act(async () => {
      fireEvent.click(credentialPicker());
    });
    expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["None", "My API Key"]);
  });

  it("while the options load, the form waits inside the modal and Create channel is off", () => {
    render({ creating: true, credentialOptions: [], authMethodOptions: [], optionsStatus: { state: "loading" } });
    expect(within(dialog()).getByRole("status", { name: "Loading" })).toBeTruthy();
    expect(within(dialog()).queryByLabelText("Name")).toBeNull();
    expect(isDisabled(within(dialog()).getByRole("button", { name: "Create channel" }))).toBe(true);
  });

  it("shows a failure to load the options inside the modal, with the list still behind it", () => {
    render({ creating: true, credentialOptions: [], authMethodOptions: [], optionsStatus: { state: "error", message: "Couldn't reach Lightning." } });
    expect(within(dialog()).getByText("Couldn't reach Lightning.")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
  });

  it("keeps Create channel enabled, and pressing it on a blank form asks for a name and a destination without saving", async () => {
    const host = render({ creating: true });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Create channel" }));
    expect(await within(dialog()).findAllByText("can't be blank")).toHaveLength(2);
    expect(host.calls("onCreate")).toEqual([]);
  });

  it("creates a channel with what was entered, waits for the save, then closes and says so", async () => {
    const host = render({ creating: true });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "new-channel" } });
    fireEvent.change(screen.getByLabelText("Destination URL"), { target: { value: "https://example.com/destination" } });
    await pickOption(credentialPicker(), "My API Key");
    fireEvent.click(screen.getByLabelText("API Key Auth"));
    fireEvent.click(within(dialog()).getByRole("button", { name: "Create channel" }));

    await waitFor(() =>
      expect(host.calls("onCreate")).toEqual([
        [{ name: "new-channel", destination_url: "https://example.com/destination", enabled: true, destination_credential_id: "cred1", client_auth_method_ids: ["wam1"] }],
      ])
    );
    expect(host.calls("onClose")).toEqual([]);
    await host.resolve("onCreate");
    expect(host.calls("onClose")).toHaveLength(1);
    expect(screen.getByText("Created new-channel.")).toBeTruthy();
  });

  it("keeps the form open with a refused auth method under Client credentials", async () => {
    const host = render({ creating: true });
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "new-channel" } });
    fireEvent.change(screen.getByLabelText("Destination URL"), { target: { value: "https://example.com" } });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Create channel" }));
    await waitFor(() => expect(host.calls("onCreate")).toHaveLength(1));
    await host.reject(
      "onCreate",
      new RequestError("The request body is not valid.", { fieldErrors: { client_auth_method_ids: ["is not one of this project's webhook auth methods"] } })
    );
    const error = within(dialog()).getByText("is not one of this project's webhook auth methods");
    expect(within(dialog()).getByRole("group", { name: "Client credentials" }).getAttribute("aria-describedby")).toContain(error.id);
    expect(within(dialog()).queryByText("The request body is not valid.")).toBeNull();
    expect(host.calls("onClose")).toEqual([]);
  });

  it("edits a channel from its listed values, sends them back, then closes and says so", async () => {
    const host = render({ editingId: "c1" });
    expect(within(dialog()).getByRole("heading", { name: "Edit lab-results" })).toBeTruthy();
    expect(dialog().textContent).toContain("lightning.example.com/channels/c1");
    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("lab-results");
    expect(credentialPicker().textContent).toBe("My API Key");
    expect((screen.getByLabelText("API Key Auth") as HTMLInputElement).checked).toBe(true);
    fireEvent.click(screen.getByLabelText("Enabled"));
    // The list reloads with someone else's save while the form is open; the edit still carries the version it started from.
    host.sendProps({ channels: [idle, { ...lab, destinationUrl: "https://elsewhere.example.com", lockVersion: 4 }] });
    fireEvent.click(within(dialog()).getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(host.calls("onUpdate")).toEqual([
        [lab, { name: "lab-results", destination_url: lab.destinationUrl, enabled: false, destination_credential_id: "cred1", client_auth_method_ids: ["wam1"] }],
      ])
    );
    await host.resolve("onUpdate");
    expect(host.calls("onClose")).toHaveLength(1);
    expect(screen.getByText("Channel updated successfully.")).toBeTruthy();
  });

  it("opens no form for an edit id that isn't listed", () => {
    render({ editingId: "gone" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
