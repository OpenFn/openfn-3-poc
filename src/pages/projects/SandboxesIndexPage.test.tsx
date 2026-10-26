import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "../../components/Toast";
import { RouterProvider, type Router } from "../../routing/router";
import type { MergePreviewResult, MergeWorkflowRow, SandboxForm, SandboxRow } from "../../types/sandboxes";
import { RequestError } from "../../utils/errors";
import { formatUtcDate } from "../../utils/format";
import SandboxesIndexPage, { type SandboxesIndexPageProps } from "./SandboxesIndexPage";

const row = (id: string, name: string, more: Partial<SandboxRow> = {}): SandboxRow => ({
  id,
  name,
  color: "#5AA1F0",
  env: null,
  scheduledDeletion: null,
  workflowsHref: `/projects/${id}/w`,
  editHref: `/projects/p1/sandboxes/${id}/edit`,
  canEdit: true,
  canDelete: true,
  canMerge: true,
  canCancelDeletion: false,
  restoreBlockedReason: null,
  activeDescendantCount: 0,
  ...more,
});

const root = row("p1", "openhie-project", { editHref: null });
const live = row("s1", "fhir-mapping", { env: "staging", activeDescendantCount: 2 });
const gone = row("s2", "old-import", {
  scheduledDeletion: "2026-10-21T00:00:00Z",
  canEdit: false,
  canDelete: false,
  canMerge: false,
  canCancelDeletion: true,
});

function renderPage(props: Partial<SandboxesIndexPageProps> = {}) {
  const router: Router = { navigate: vi.fn(), useHref: (to) => to, useLocation: () => ({ pathname: "/projects/p1/sandboxes", search: "", hash: "" }) };
  const handlers = {
    onCloseForm: vi.fn(),
    onCreateSandbox: vi.fn().mockResolvedValue(undefined),
    onUpdateSandbox: vi.fn().mockResolvedValue(undefined),
    onDeleteSandbox: vi.fn().mockResolvedValue(undefined),
    onCancelDeletion: vi.fn().mockResolvedValue(undefined),
    onPreviewMerge: vi.fn(),
    onMergeSandbox: vi.fn().mockResolvedValue(undefined),
  };
  render(
    <RouterProvider value={router}>
      <ToastProvider>
        <SandboxesIndexPage
          project={{ id: "p1", parentId: null, color: null }}
          projectLabel="openhie-project"
          root={root}
          rootIsSandbox={false}
          sandboxes={[live, gone]}
          newHref="/projects/p1/sandboxes/new"
          createBlockedReason={null}
          gracePeriodDays={7}
          form={null}
          {...handlers}
          {...props}
        />
      </ToastProvider>
    </RouterProvider>
  );
  return { ...handlers, navigate: router.navigate as ReturnType<typeof vi.fn> };
}

const card = (id: string) => document.getElementById(`sandbox-card-${id}`)!;
const action = (kind: string, id: string) => document.querySelector(`#${kind}-sandbox-${id} button`) as HTMLButtonElement;
const deferred = () => {
  let resolve: () => void = () => {};
  let reject: (e: Error) => void = () => {};
  const promise = new Promise<void>((res, rej) => ((resolve = res), (reject = rej)));
  return { promise, resolve, reject };
};

describe("SandboxesIndexPage", () => {
  it("shows the root with 'main' and 'active', live sandboxes, then the scheduled section", () => {
    renderPage();
    expect(document.getElementById("env-badge-p1")!.textContent).toBe("main");
    expect(document.getElementById("active-badge-p1")).toBeTruthy();
    expect(document.getElementById("env-badge-s1")!.textContent).toBe("staging");
    expect(document.getElementById("active-badge-s1")).toBeNull();
    const section = document.getElementById("scheduled-for-deletion-section")!;
    expect(within(section).getByText("old-import")).toBeTruthy();
    expect(within(section).getByRole("button", { name: "Restore" })).toBeTruthy();
    expect(within(section).queryByText("fhir-mapping")).toBeNull();
  });

  it("gives a root that isn't a sandbox no actions, and a sandbox root its actions", () => {
    renderPage();
    for (const kind of ["branch-rewire", "edit", "delete"]) expect(action(kind, "p1")).toBeNull();
    renderPage({ rootIsSandbox: true, root: row("p9", "a-sandbox-root") });
    for (const kind of ["branch-rewire", "edit", "delete"]) expect(action(kind, "p9")).toBeTruthy();
    expect(document.getElementById("env-badge-p9")).toBeNull();
  });

  it("opens a live sandbox's workflows when its card is clicked, or on Enter or Space", () => {
    const { navigate } = renderPage();
    const open = within(card("s1")).getByRole("button", { name: /fhir-mapping/ });
    fireEvent.click(open);
    expect(navigate).toHaveBeenLastCalledWith("/projects/s1/w");
    navigate.mockClear();
    fireEvent.keyDown(open, { key: "Enter" });
    fireEvent.keyDown(open, { key: " " });
    expect(navigate).toHaveBeenCalledTimes(2);
    fireEvent.keyDown(open, { key: "a" });
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it("doesn't open a scheduled sandbox's card", () => {
    const { navigate } = renderPage();
    fireEvent.click(within(card("s2")).getByText("old-import"));
    expect(navigate).not.toHaveBeenCalled();
  });

  it("goes to the create route", () => {
    const { navigate } = renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Create Sandbox" }));
    expect(navigate).toHaveBeenCalledWith("/projects/p1/sandboxes/new");
  });

  it("greys Create with the host's reason, and shows it in place of the empty state's link", () => {
    renderPage({ sandboxes: [], createBlockedReason: "Maximum sandbox nesting depth reached (2 levels deep)" });
    const create = document.getElementById("create-sandbox-button") as HTMLButtonElement;
    expect(create.disabled).toBe(true);
    expect(create.getAttribute("aria-description")).toBe("Maximum sandbox nesting depth reached (2 levels deep)");
    expect(screen.getByText("No sandboxes found")).toBeTruthy();
    expect(screen.getByText("Maximum sandbox nesting depth reached (2 levels deep)", { selector: "p" })).toBeTruthy();
    expect(screen.queryByRole("link", { name: "Create your first sandbox" })).toBeNull();
  });

  it("links the empty state to the create route", () => {
    renderPage({ sandboxes: [] });
    expect(screen.getByRole("link", { name: "Create your first sandbox" }).getAttribute("href")).toBe("/projects/p1/sandboxes/new");
  });

  it("goes to a sandbox's edit route, and greys the buttons the viewer can't use", () => {
    const { navigate } = renderPage({ sandboxes: [live, row("s3", "locked", { canEdit: false, canDelete: false, canMerge: false })] });
    fireEvent.click(action("edit", "s1"));
    expect(navigate).toHaveBeenCalledWith("/projects/p1/sandboxes/s1/edit");
    expect(action("edit", "s3").disabled).toBe(true);
    expect(action("edit", "s3").getAttribute("aria-label")).toBe("You are not authorized to edit this sandbox");
    expect(action("delete", "s3").disabled).toBe(true);
    expect(action("branch-rewire", "s3").disabled).toBe(true);
  });

  describe("delete", () => {
    it("says what goes with the sandbox and enables Delete only once the name is typed", () => {
      const { onDeleteSandbox } = renderPage();
      fireEvent.click(action("delete", "s1"));
      const dialog = screen.getByRole("dialog");
      expect(dialog.textContent).toContain("Its 2 child sandboxes will also be deleted.");
      expect(dialog.textContent).toContain("retained for 7 days");
      expect(dialog.textContent).not.toContain("You are currently viewing this project");
      const submit = within(dialog).getByRole("button", { name: "Delete sandbox" }) as HTMLButtonElement;
      expect(submit.disabled).toBe(true);
      fireEvent.change(screen.getByLabelText(/Sandbox name/), { target: { value: "fhir-mappin" } });
      expect(submit.disabled).toBe(true);
      fireEvent.submit(document.getElementById("confirm-delete-sandbox-form")!);
      expect(onDeleteSandbox).not.toHaveBeenCalled();
      fireEvent.change(screen.getByLabelText(/Sandbox name/), { target: { value: "fhir-mapping" } });
      // The disabled button sits in a tooltip wrapper, so it's a new element once enabled.
      expect((within(dialog).getByRole("button", { name: "Delete sandbox" }) as HTMLButtonElement).disabled).toBe(false);
    });

    it("sends the typed name and closes once the host has scheduled it", async () => {
      const { onDeleteSandbox } = renderPage();
      fireEvent.click(action("delete", "s1"));
      fireEvent.change(screen.getByLabelText(/Sandbox name/), { target: { value: "fhir-mapping" } });
      fireEvent.submit(document.getElementById("confirm-delete-sandbox-form")!);
      expect(onDeleteSandbox).toHaveBeenCalledWith("s1", "fhir-mapping");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("stays open with the host's refusal", async () => {
      renderPage({ onDeleteSandbox: vi.fn().mockRejectedValue(new RequestError("You don't have permission to delete this sandbox")) });
      fireEvent.click(action("delete", "s1"));
      fireEvent.change(screen.getByLabelText(/Sandbox name/), { target: { value: "fhir-mapping" } });
      fireEvent.submit(document.getElementById("confirm-delete-sandbox-form")!);
      expect(await screen.findByText("You don't have permission to delete this sandbox")).toBeTruthy();
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    it("warns when the viewer is inside the sandbox, and names the root", () => {
      renderPage({ project: { id: "s1", parentId: "p1", color: "#5AA1F0" } });
      fireEvent.click(action("delete", "s1"));
      expect(screen.getByRole("dialog").textContent).toContain("After deletion, you'll be redirected to openhie-project.");
    });

    it("says 'the configured grace period' when the host has no number", () => {
      renderPage({ gracePeriodDays: null, sandboxes: [row("s1", "fhir-mapping", { activeDescendantCount: 1 })] });
      fireEvent.click(action("delete", "s1"));
      const text = screen.getByRole("dialog").textContent;
      expect(text).toContain("retained for the configured grace period before");
      expect(text).toContain("Its child sandbox will also be deleted.");
    });

    it("closes if the host's list no longer has the sandbox", () => {
      const props = {
        onCloseForm: vi.fn(),
        onCreateSandbox: vi.fn(),
        onUpdateSandbox: vi.fn(),
        onDeleteSandbox: vi.fn(),
        onCancelDeletion: vi.fn(),
        onPreviewMerge: vi.fn(),
        onMergeSandbox: vi.fn(),
        project: { id: "p1", parentId: null, color: null },
        projectLabel: "openhie-project",
        root,
        rootIsSandbox: false,
        newHref: "/projects/p1/sandboxes/new",
        createBlockedReason: null,
        gracePeriodDays: 7,
        form: null,
      };
      const { rerender } = render(<SandboxesIndexPage {...props} sandboxes={[live]} />);
      fireEvent.click(action("delete", "s1"));
      expect(screen.getByRole("dialog")).toBeTruthy();
      rerender(<SandboxesIndexPage {...props} sandboxes={[]} />);
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });

  describe("restore", () => {
    it("spins only the sandbox being restored, and holds its button while the request is out", () => {
      const pending = deferred();
      const onCancelDeletion = vi.fn(() => pending.promise);
      const other = { ...gone, id: "s4", name: "other-old" };
      renderPage({ sandboxes: [live, gone, other], onCancelDeletion });
      fireEvent.click(action("cancel-deletion", "s2"));
      fireEvent.click(action("cancel-deletion", "s2"));
      expect(onCancelDeletion).toHaveBeenCalledTimes(1);
      expect(onCancelDeletion).toHaveBeenCalledWith("s2");
      expect(action("cancel-deletion", "s2").getAttribute("aria-busy")).toBe("true");
      expect(action("cancel-deletion", "s4").getAttribute("aria-busy")).toBeNull();
    });

    it("says a purge date less than a day past is today, as Lightning truncates the day count", () => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date("2026-10-21T12:00:00Z"));
      try {
        renderPage({ sandboxes: [live, gone] });
        expect(document.querySelector("#sandbox-card-s2 [aria-disabled]")!.getAttribute("aria-description")).toBe(
          "Scheduled for deletion on " + formatUtcDate(gone.scheduledDeletion!) + " (today). Cancel the deletion to restore it."
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it("restores a second sandbox while the first is still out", () => {
      const onCancelDeletion = vi.fn(() => deferred().promise);
      const other = { ...gone, id: "s4", name: "other-old" };
      renderPage({ sandboxes: [live, gone, other], onCancelDeletion });
      fireEvent.click(action("cancel-deletion", "s2"));
      fireEvent.click(action("cancel-deletion", "s4"));
      expect(onCancelDeletion.mock.calls).toEqual([["s2"], ["s4"]]);
      expect(action("cancel-deletion", "s2").getAttribute("aria-busy")).toBe("true");
      expect(action("cancel-deletion", "s4").getAttribute("aria-busy")).toBe("true");
    });

    it("toasts the host's refusal and stops spinning", async () => {
      renderPage({ onCancelDeletion: vi.fn().mockRejectedValue(new RequestError("You have reached your sandbox limit")) });
      fireEvent.click(action("cancel-deletion", "s2"));
      expect(await screen.findByText("You have reached your sandbox limit")).toBeTruthy();
      expect(action("cancel-deletion", "s2").getAttribute("aria-busy")).toBeNull();
    });

    it("greys Restore with the plan's reason, or 'not authorized'", () => {
      renderPage({
        sandboxes: [
          { ...gone, restoreBlockedReason: "Upgrade to restore more sandboxes" },
          { ...gone, id: "s5", name: "not-mine", canCancelDeletion: false },
        ],
      });
      expect(action("cancel-deletion", "s2").disabled).toBe(true);
      expect(action("cancel-deletion", "s2").getAttribute("aria-description")).toBe("Upgrade to restore more sandboxes");
      expect(action("cancel-deletion", "s5").disabled).toBe(true);
      expect(action("cancel-deletion", "s5").getAttribute("aria-description")).toBe("You are not authorized to cancel deletion of this sandbox");
    });
  });

  describe("merge", () => {
    const wf = (id: string, name: string, more: Partial<MergeWorkflowRow> = {}): MergeWorkflowRow => ({
      id,
      name,
      isChanged: false,
      isDiverged: false,
      isNew: false,
      isDeleted: false,
      ...more,
    });
    const preview = (more: Partial<MergePreviewResult> = {}): MergePreviewResult => ({
      targets: [
        { id: "p1", name: "openhie-project" },
        { id: "s3", name: "other-sandbox" },
      ],
      targetId: "p1",
      workflows: [
        wf("w1", "Changed one", { isChanged: true, isDiverged: true }),
        wf("w2", "Same one"),
        wf("w3", "Brand new", { isChanged: true, isNew: true }),
        wf("t1", "Gone in sandbox", { isDeleted: true }),
      ],
      credentials: [{ id: "c1", name: "Sandbox creds" }],
      collectionsToAdd: ["cache-a", "cache-b"],
      ...more,
    });
    const tick = (name: string) => screen.getByLabelText(new RegExp(name)) as HTMLInputElement;
    const ticked = () =>
      Array.from(screen.getByRole("dialog").querySelectorAll<HTMLInputElement>("li input"))
        .filter((i) => i.checked)
        .map((i) => i.closest("label")!.textContent);
    const submit = () => document.getElementById("merge-sandbox-submit") as HTMLButtonElement;
    const openMerge = async (props: Partial<SandboxesIndexPageProps> = {}) => {
      const onPreviewMerge = props.onPreviewMerge ?? vi.fn().mockResolvedValue(preview());
      const handlers = renderPage({ ...props, onPreviewMerge });
      fireEvent.click(action("branch-rewire", "s1"));
      await screen.findByText("Workflows to merge");
      return { ...handlers, onPreviewMerge };
    };

    it("asks for the default target and ticks what Lightning ticks: changed workflows, every credential and collection", async () => {
      const { onPreviewMerge } = await openMerge();
      expect(onPreviewMerge).toHaveBeenCalledWith("s1", null);
      expect(ticked()).toEqual(["Changed oneChangedDiverged", "Brand newNew", "Sandbox creds", "cache-a", "cache-b"]);
      expect(tick("Gone in sandbox").closest("label")!.textContent).toContain("Deleted in sandbox");
      expect((document.getElementById("merge-target-select") as HTMLSelectElement).value).toBe("p1");
      const text = screen.getByRole("dialog").textContent;
      expect(text).toContain("overwrite their counterparts in openhie-project.");
      expect(text).toContain("2 of 4 selected");
      expect(text).toContain("restored from the sandbox list for 7 days");
      expect(text).toContain("Its 2 child sandboxes will also be deleted.");
    });

    it("sends the target, the ticked workflows and credentials, and the unticked collections, then closes", async () => {
      const { onMergeSandbox } = await openMerge();
      fireEvent.click(tick("Gone in sandbox"));
      fireEvent.click(tick("Brand new"));
      fireEvent.click(tick("cache-b"));
      fireEvent.click(tick("Sandbox creds"));
      fireEvent.submit(document.getElementById("merge-sandbox-form")!);
      expect(onMergeSandbox).toHaveBeenCalledWith("s1", {
        targetId: "p1",
        workflowIds: ["w1"],
        deletedWorkflowIds: ["t1"],
        credentialIds: [],
        skippedCollectionNames: ["cache-b"],
      });
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    });

    it("disables Merge with no workflow ticked, and select-all ticks and clears them", async () => {
      const { onMergeSandbox } = await openMerge();
      const all = document.getElementById("merge-select-all-workflows") as HTMLInputElement;
      expect(all.indeterminate).toBe(true);
      fireEvent.click(all);
      expect(ticked().filter((t) => !["Sandbox creds", "cache-a", "cache-b"].includes(t!))).toHaveLength(4);
      fireEvent.click(all);
      expect(all.checked).toBe(false);
      expect(submit().disabled).toBe(true);
      expect(submit().getAttribute("aria-description")).toBe("No workflows selected");
      fireEvent.submit(document.getElementById("merge-sandbox-form")!);
      expect(onMergeSandbox).not.toHaveBeenCalled();
    });

    it("on a new target keeps ticks still listed, ticks new changed workflows and new credentials, and ticks every collection again", async () => {
      const next = preview({
        targetId: "s3",
        workflows: [wf("w1", "Changed one", { isChanged: true }), wf("w2", "Same one"), wf("w4", "Other new", { isChanged: true, isNew: true })],
        credentials: [
          { id: "c1", name: "Sandbox creds" },
          { id: "c2", name: "More creds" },
        ],
        collectionsToAdd: ["cache-a", "cache-b"],
      });
      const onPreviewMerge = vi.fn().mockResolvedValueOnce(preview()).mockResolvedValueOnce(next);
      await openMerge({ onPreviewMerge });
      fireEvent.click(tick("Changed one"));
      fireEvent.click(tick("Same one"));
      fireEvent.click(tick("Sandbox creds"));
      fireEvent.click(tick("cache-a"));
      fireEvent.change(document.getElementById("merge-target-select")!, { target: { value: "s3" } });
      expect(onPreviewMerge).toHaveBeenLastCalledWith("s1", "s3");
      await screen.findByText("Other new");
      expect(ticked()).toEqual(["Same one", "Other newNew", "More creds", "cache-a", "cache-b"]);
      expect(screen.getByRole("dialog").textContent).toContain("counterparts in other-sandbox.");
    });

    it("uses only the latest preview, and holds Merge until it arrives", async () => {
      let resolveSlow: (p: MergePreviewResult) => void = () => {};
      const onPreviewMerge = vi
        .fn()
        .mockResolvedValueOnce(preview())
        .mockReturnValueOnce(new Promise<MergePreviewResult>((res) => (resolveSlow = res)))
        .mockResolvedValueOnce(preview({ targetId: "p1" }));
      await openMerge({ onPreviewMerge });
      const select = document.getElementById("merge-target-select")!;
      fireEvent.change(select, { target: { value: "s3" } });
      expect(submit().disabled).toBe(true);
      fireEvent.change(select, { target: { value: "p1" } });
      await waitFor(() => expect(submit().disabled).toBe(false));
      resolveSlow(preview({ targetId: "s3", workflows: [wf("w9", "Stale one", { isChanged: true })] }));
      await new Promise((r) => setTimeout(r, 0));
      expect(screen.queryByText("Stale one")).toBeNull();
      expect((select as HTMLSelectElement).value).toBe("p1");
    });

    it("drops a stale preview that fails after a newer one arrived", async () => {
      let rejectSlow: (e: Error) => void = () => {};
      const onPreviewMerge = vi
        .fn()
        .mockResolvedValueOnce(preview())
        .mockReturnValueOnce(new Promise<MergePreviewResult>((_, rej) => (rejectSlow = rej)))
        .mockResolvedValueOnce(preview());
      await openMerge({ onPreviewMerge });
      const select = document.getElementById("merge-target-select")!;
      fireEvent.change(select, { target: { value: "s3" } });
      fireEvent.change(select, { target: { value: "p1" } });
      await waitFor(() => expect(submit().disabled).toBe(false));
      rejectSlow(new RequestError("Target project not found"));
      await new Promise((r) => setTimeout(r, 0));
      expect(document.getElementById("merge-preview-error")).toBeNull();
      expect(submit().disabled).toBe(false);
    });

    it("keeps collection ticks when the answer is for the same target as the last one", async () => {
      const onPreviewMerge = vi
        .fn()
        .mockResolvedValueOnce(preview())
        .mockReturnValueOnce(new Promise<MergePreviewResult>(() => {}))
        .mockResolvedValueOnce(preview());
      await openMerge({ onPreviewMerge });
      fireEvent.click(tick("cache-a"));
      const select = document.getElementById("merge-target-select")!;
      fireEvent.change(select, { target: { value: "s3" } });
      fireEvent.change(select, { target: { value: "p1" } });
      await waitFor(() => expect(submit().disabled).toBe(false));
      expect(tick("cache-a").checked).toBe(false);
      expect(tick("cache-b").checked).toBe(true);
    });

    it("prompts for a target when the preview has no default, so picking the first one asks for its preview", async () => {
      const onPreviewMerge = vi.fn().mockResolvedValueOnce(preview({ targetId: null })).mockResolvedValueOnce(preview());
      await openMerge({ onPreviewMerge });
      const select = document.getElementById("merge-target-select") as HTMLSelectElement;
      expect(select.value).toBe("");
      expect(select.selectedOptions[0]?.textContent).toBe("Select a project");
      expect(submit().getAttribute("aria-description")).toBe("No project to merge into");
      fireEvent.change(select, { target: { value: "p1" } });
      expect(onPreviewMerge).toHaveBeenLastCalledWith("s1", "p1");
      await waitFor(() => expect(submit().disabled).toBe(false));
      expect(select.value).toBe("p1");
      expect(screen.getByRole("dialog").textContent).toContain("counterparts in openhie-project.");
    });

    it("names the select's target and the row's child count while a preview loads", async () => {
      const slow = new Promise<MergePreviewResult>(() => {});
      const onPreviewMerge = vi.fn().mockReturnValueOnce(slow);
      renderPage({ onPreviewMerge });
      fireEvent.click(action("branch-rewire", "s1"));
      let text = screen.getByRole("dialog").textContent;
      expect(text).not.toContain("MAIN");
      expect(text).toContain("Its 2 child sandboxes will also be deleted.");

      onPreviewMerge.mockReset().mockResolvedValueOnce(preview()).mockReturnValueOnce(slow);
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
      fireEvent.click(action("branch-rewire", "s1"));
      await screen.findByText("Workflows to merge");
      fireEvent.change(document.getElementById("merge-target-select")!, { target: { value: "s3" } });
      text = screen.getByRole("dialog").textContent;
      expect(text).toContain("counterparts in other-sandbox.");
    });

    it("shows a failed first preview and holds Merge", async () => {
      renderPage({ onPreviewMerge: vi.fn().mockRejectedValue(new RequestError("Sandbox not found")) });
      fireEvent.click(action("branch-rewire", "s1"));
      expect(await screen.findByText("Sandbox not found")).toBeTruthy();
      expect(submit().disabled).toBe(true);
      expect(submit().getAttribute("aria-description")).toBe("The merge preview didn't load");
    });

    it("closes if the host's list no longer has the sandbox", async () => {
      const props = {
        onCloseForm: vi.fn(),
        onCreateSandbox: vi.fn(),
        onUpdateSandbox: vi.fn(),
        onDeleteSandbox: vi.fn(),
        onCancelDeletion: vi.fn(),
        onPreviewMerge: vi.fn().mockResolvedValue(preview()),
        onMergeSandbox: vi.fn(),
        project: { id: "p1", parentId: null, color: null },
        projectLabel: "openhie-project",
        root,
        rootIsSandbox: false,
        newHref: "/projects/p1/sandboxes/new",
        createBlockedReason: null,
        gracePeriodDays: 7,
        form: null,
      };
      const { rerender } = render(<SandboxesIndexPage {...props} sandboxes={[live]} />);
      fireEvent.click(action("branch-rewire", "s1"));
      await screen.findByText("Workflows to merge");
      rerender(<SandboxesIndexPage {...props} sandboxes={[]} />);
      expect(screen.queryByRole("dialog")).toBeNull();
    });

    it("shows a failed preview in the modal and puts the target back", async () => {
      const onPreviewMerge = vi.fn().mockResolvedValueOnce(preview()).mockRejectedValueOnce(new RequestError("Target project not found"));
      await openMerge({ onPreviewMerge });
      fireEvent.change(document.getElementById("merge-target-select")!, { target: { value: "s3" } });
      expect(await screen.findByText("Target project not found")).toBeTruthy();
      expect((document.getElementById("merge-target-select") as HTMLSelectElement).value).toBe("p1");
      expect(submit().disabled).toBe(false);
    });

    it("disables Merge when there's no project to merge into", async () => {
      await openMerge({ onPreviewMerge: vi.fn().mockResolvedValue(preview({ targets: [], targetId: null })) });
      expect(screen.getByRole("dialog").textContent).toContain("counterparts in MAIN.");
      expect(submit().disabled).toBe(true);
      expect(submit().getAttribute("aria-description")).toBe("No project to merge into");
    });

    it("stays open with the host's refusal", async () => {
      await openMerge({ onMergeSandbox: vi.fn().mockRejectedValue(new RequestError("You are not authorized to merge into this project")) });
      fireEvent.submit(document.getElementById("merge-sandbox-form")!);
      expect(await screen.findByText("You are not authorized to merge into this project")).toBeTruthy();
      expect(screen.getByRole("dialog")).toBeTruthy();
    });
  });

  describe("form", () => {
    const newForm: SandboxForm = { mode: "new", parentName: "openhie-project", parentIsSandbox: false, initialColor: "#E33D63" };
    const editForm: SandboxForm = { mode: "edit", sandboxId: "s1", initial: { rawName: "fhir-mapping", color: "#5AA1F0" } };
    const nameField = () => screen.getByLabelText(/Name/).closest('[data-ui="form-group"]')!.textContent;

    it("creates under the parent with the typed name and the host's colour", () => {
      const { onCreateSandbox } = renderPage({ form: newForm });
      const dialog = screen.getByRole("dialog");
      expect(dialog.textContent).toContain("This sandbox will be created under the openhie-project project.");
      expect(dialog.textContent).toMatch(/Your sandbox will be named\s*my-sandbox\./);
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "My Test" } });
      expect(dialog.textContent).toMatch(/Your sandbox will be named\s*my-test\./);
      expect(dialog.textContent).not.toContain("my-sandbox");
      fireEvent.submit(document.getElementById("sandbox-form")!);
      expect(onCreateSandbox).toHaveBeenCalledWith({ rawName: "My Test", color: "#E33D63" });
    });

    it("lets Create be pressed with a blank name, and says it can't be blank on the field", async () => {
      const { onCreateSandbox } = renderPage({ form: newForm });
      const submit = within(screen.getByRole("dialog")).getByRole("button", { name: "Create sandbox" }) as HTMLButtonElement;
      expect(submit.disabled).toBe(false);
      fireEvent.submit(document.getElementById("sandbox-form")!);
      await waitFor(() => expect(nameField()).toContain("can't be blank"));
      expect(onCreateSandbox).not.toHaveBeenCalled();
    });

    it("leaves a sandbox with no colour without one, unless a swatch is picked", () => {
      const { onUpdateSandbox } = renderPage({ form: { ...editForm, initial: { rawName: "fhir-mapping", color: null } } });
      expect(screen.getAllByRole("radio").some((r) => (r as HTMLInputElement).checked)).toBe(false);
      fireEvent.submit(document.getElementById("sandbox-form")!);
      expect(onUpdateSandbox).toHaveBeenCalledWith("s1", { rawName: "fhir-mapping", color: null });
    });

    it("says 'sandbox' when the parent is one", () => {
      renderPage({ form: { ...newForm, parentName: "fhir-mapping", parentIsSandbox: true } });
      expect(screen.getByRole("dialog").textContent).toContain("created under the fhir-mapping sandbox.");
    });

    it("shows the host's name refusal on the field and keeps the form open", async () => {
      const onCreateSandbox = vi
        .fn()
        .mockRejectedValue(new RequestError("Sandbox name already exists", { fieldErrors: { rawName: ["Sandbox name already exists"] } }));
      renderPage({ form: newForm, onCreateSandbox });
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "fhir-mapping" } });
      fireEvent.submit(document.getElementById("sandbox-form")!);
      await waitFor(() => expect(nameField()).toContain("Sandbox name already exists"));
      expect(screen.getByRole("dialog")).toBeTruthy();
    });

    it("shows the host's name refusal on edit on the field", async () => {
      const onUpdateSandbox = vi
        .fn()
        .mockRejectedValue(new RequestError("Sandbox name already exists", { fieldErrors: { rawName: ["Sandbox name already exists"] } }));
      renderPage({ form: editForm, onUpdateSandbox });
      fireEvent.submit(document.getElementById("sandbox-form")!);
      await waitFor(() => expect(nameField()).toContain("Sandbox name already exists"));
    });

    it("shows any other refusal above the form", async () => {
      renderPage({ form: newForm, onCreateSandbox: vi.fn().mockRejectedValue(new RequestError("Something went wrong while creating the sandbox.")) });
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "x" } });
      fireEvent.submit(document.getElementById("sandbox-form")!);
      expect(await screen.findByText("Something went wrong while creating the sandbox.")).toBeTruthy();
    });

    it("edits with the stored values and saves the changed colour under the sandbox's id", () => {
      const { onUpdateSandbox, onCreateSandbox } = renderPage({ form: editForm });
      expect((screen.getByLabelText(/Name/) as HTMLInputElement).value).toBe("fhir-mapping");
      fireEvent.click(screen.getByRole("radio", { name: /#E33D63/i }));
      fireEvent.submit(document.getElementById("sandbox-form")!);
      expect(onUpdateSandbox).toHaveBeenCalledWith("s1", { rawName: "fhir-mapping", color: "#E33D63" });
      expect(onCreateSandbox).not.toHaveBeenCalled();
    });

    it("says a blank name can't be blank on Save, and doesn't send it", async () => {
      const { onUpdateSandbox } = renderPage({ form: editForm });
      fireEvent.change(screen.getByLabelText(/Name/), { target: { value: "  " } });
      fireEvent.submit(document.getElementById("sandbox-form")!);
      await waitFor(() => expect(nameField()).toContain("can't be blank"));
      expect(onUpdateSandbox).not.toHaveBeenCalled();
    });

    it("closes through the host", () => {
      const { onCloseForm } = renderPage({ form: editForm });
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
      expect(onCloseForm).toHaveBeenCalled();
    });
  });
});
