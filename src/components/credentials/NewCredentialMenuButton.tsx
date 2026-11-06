import ButtonMenu from "@/components/primitives/ButtonMenu";
import { MenuItem } from "@/components/primitives/Menu";
import Pill from "@/components/primitives/Pill";
import { showCredentialModal, type NewCredentialOption } from "./credentialModalEvents";
import { Row } from "@/components/primitives/Stack";

interface Props {
  id?: string;
  options: NewCredentialOption[];
}

/**
 * The "Add new" dropdown (Components.Credentials.new_credential_menu_button).
 * Each entry opens the matching modal in the CredentialIndex on the page.
 */
export default function NewCredentialMenuButton({ id = "credential-options-menu-button", options }: Props) {
  return (
    <div id={id}>
      <ButtonMenu label="Add new" variant="primary">
        {options.map((o) => (
          <MenuItem key={o.target} disabled={o.disabled} onClick={() => showCredentialModal(o.target)}>
            <Row as="span" gap="sm">
              {o.label}
              {o.badge && <Pill>{o.badge}</Pill>}
            </Row>
          </MenuItem>
        ))}
      </ButtonMenu>
    </div>
  );
}
// eslint-disable-next-line react-refresh/only-export-components -- re-exported so pages import the menu and its option preset together
export { projectCredentialMenuOptions } from "./credentialModalEvents";
