import SectionHeader from "../primitives/SectionHeader";
import HistoryExportsTable from "./HistoryExportsTable";
import SandboxSettingsBanner from "./SandboxSettingsBanner";
import type { HistoryExportRow } from "../../types/project-settings";

/** The History Exports tab (`#history-exports`, settings.html.heex:1055-1103). */
export default function HistoryExportsPanel({ exports, sandbox }: { exports: HistoryExportRow[]; sandbox: boolean }) {
  return (
    <>
      <SectionHeader
        title="History exports"
        subtitle="View export status and download work order history for this project."
      />
      {sandbox && <SandboxSettingsBanner scope="local" />}
      <HistoryExportsTable exports={exports} />
    </>
  );
}
