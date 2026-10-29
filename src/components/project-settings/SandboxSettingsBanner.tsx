import Alert, { type AlertTone } from "../Alert";
import TextLink from "../TextLink";
import type { ParentProjectRef } from "../../types/project-settings";

type Scope = "local" | "editable" | "inherited";

interface Props {
  /**
   * local: settings only apply to the sandbox; editable: they sync to the
   * parent on merge; inherited: they come from the parent and are read-only.
   */
  scope: Scope;
  parent?: ParentProjectRef | null | undefined;
}

const alertTones: Record<Scope, AlertTone> = { local: "info", editable: "success", inherited: "warning" };

/** Lightning's `sandbox_settings_banner` (components/sandbox_settings_banner.ex). */
export default function SandboxSettingsBanner({ scope, parent }: Props) {
  return (
    <Alert tone={alertTones[scope]}>
      {scope === "local" &&
        "Changes you make here only apply to this sandbox and do not sync to the parent project on merge."}
      {scope === "editable" && "Changes you make here will sync to the parent project on merge."}
      {scope === "inherited" && (
        <>
          These settings are inherited from the parent project{" "}
          {parent && (
            <>
              (<TextLink to={parent.settingsHref}>{parent.name}</TextLink>){" "}
            </>
          )}
          and cannot be changed here.
        </>
      )}
    </Alert>
  );
}
