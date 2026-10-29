import Card from "../Card";
import SectionHeader from "../SectionHeader";
import { useToast } from "../Toast";
import Toggle from "../Toggle";
import SandboxSettingsBanner from "./SandboxSettingsBanner";
import type { ParentProjectRef, SecuritySettings } from "../../types/project-settings";
import { errorMessage } from "../../utils/errors";
import { useChosenValue } from "../../utils/useChosenValue";

interface Props {
  security: SecuritySettings;
  /** Set for a sandbox: MFA is inherited from the parent and read-only. */
  parent: ParentProjectRef | null;
  /** Switches "Require MFA?". The switch shows the choice at once, and goes back if this rejects. */
  onSetRequiresMfa: (on: boolean) => Promise<void>;
}

/** The Security tab (`#security`, settings.html.heex:681-756): the "Require MFA?" switch. */
export default function SecurityPanel({ security, parent, onSetRequiresMfa }: Props) {
  const { requiresMfa, canEditProject, canRequireMfa } = security;
  const sandbox = parent !== null;
  const toast = useToast();
  const mfa = useChosenValue(requiresMfa, onSetRequiresMfa, (e) => toast(errorMessage(e), "danger"));
  return (
    <>
      <SectionHeader
        title="Project security"
        subtitle="View and manage security settings for this project."
        permissionsSection={canEditProject || sandbox ? undefined : "multi-factor authentication settings."}
      />
      {sandbox && <SandboxSettingsBanner variant="inherited" parent={parent} />}
      <Card
        title={<span id="mfa-label">Multi-Factor Authentication</span>}
        description={
          <span id="mfa-description">
            Requiring multi-factor authentication (MFA) adds an additional layer of security by requiring users to
            enable MFA on their accounts before they are allowed access this project.
          </span>
        }
      >
        <Toggle
          id="toggle-mfa-switch"
          checked={mfa.value}
          onChange={mfa.choose}
          disabled={!canRequireMfa || !canEditProject || sandbox}
          tooltip={canEditProject ? undefined : "You do not have permission to perform this action"}
          label="Require MFA?"
          note={mfa.value ? "(currently required for this project)" : "(currently optional for this project)"}
        />
      </Card>
    </>
  );
}
