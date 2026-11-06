/**
 * What each sandbox changed since it was made, which the fake server's merge
 * preview reads (it has no workflow store yet), and sandboxes page rows for
 * stories. The sandboxes themselves are projects (projects.ts).
 */
import type { MergePreviewResult, SandboxRow } from "@/types/sandboxes";
import { projects } from "./projects";

/** What a sandbox changed since it was made. */
interface MergeFixture {
  /** The sandbox's workflows: `changed` in it, `diverged` when its parent changed it too. */
  workflows: { id: string; name: string; changed?: boolean; diverged?: boolean }[];
  /** Parent workflows the sandbox deleted. */
  deletedNames: string[];
  /** Credentials only the sandbox has. */
  credentials: { id: string; name: string }[];
}

const openhie = projects[0]!;
const fhir = projects.find((p) => p.parentId === openhie.id)!;

export const mergeFixtures: Record<string, MergeFixture> = {
  [fhir.id]: {
    workflows: [
      { id: "wf-fhir-openhie", name: "OpenHIE Workflow", changed: true, diverged: true },
      { id: "wf-fhir-referrals", name: "Referral follow-ups" },
      { id: "wf-fhir-bundle", name: "FHIR bundle export" },
    ],
    deletedNames: ["Facility registry sync"],
    credentials: [{ id: "pc-fhir-sandbox", name: "FHIR sandbox server" }],
  },
};

const row = (p: { id: string; name: string; color: string | null }, extra: Partial<SandboxRow>): SandboxRow => ({
  id: p.id,
  name: p.name,
  description: null,
  color: p.color,
  parentId: openhie.id,
  parentName: openhie.name,
  scheduledDeletion: null,
  canEdit: true,
  canDelete: true,
  canMerge: true,
  canCancelDeletion: false,
  descendantCount: 0,
  holdsCurrent: false,
  mergeTargets: [{ id: openhie.id, name: openhie.name }],
  ...extra,
});

/** For stories: openhie-project's workspace as its owner sees it, the project first. */
export const storyWorkspace: SandboxRow[] = [
  row(openhie, { parentId: null, parentName: null, canEdit: false, canDelete: false, canMerge: false, descendantCount: 1, holdsCurrent: true, mergeTargets: [] }),
  row(fhir, { description: "Trying the FHIR R4 mappings before they go live." }),
  row(
    { id: "story-old-import-test", name: "old-import-test", color: "#5AA1F0" },
    { scheduledDeletion: "2026-12-01T00:00:00Z", canEdit: false, canDelete: false, canMerge: false, canCancelDeletion: true }
  ),
];

/** For stories: a merge preview with every badge. */
export const samplePreview: MergePreviewResult = {
  targetId: openhie.id,
  workflows: [
    { id: "wf-fhir-bundle", name: "FHIR bundle export", isDiverged: false, isDeleted: false },
    { id: "wf-registry", name: "Facility registry sync", isDiverged: false, isDeleted: true },
    { id: "wf-fhir-openhie", name: "OpenHIE Workflow", isDiverged: true, isDeleted: false },
  ],
  credentials: [{ id: "pc-fhir-sandbox", name: "FHIR sandbox server" }],
};
