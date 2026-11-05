import { Outlet, useLocation } from "react-router-dom";
import SettingsLayout from "@/components/patterns/SettingsLayout";
import type { NavListItem } from "@/components/primitives/NavList";
import { isAt } from "@/utils/urls";

// Lightning's URLs, Brandon's names for them.
const sections: NavListItem[] = [
  { label: "Profile", href: "/profile", icon: "hero-user-circle" },
  { label: "Credentials", href: "/credentials", icon: "hero-key" },
  { label: "API tokens", href: "/profile/tokens", icon: "hero-command-line" },
];

/**
 * The parent route of the signed-in user's own pages (Brandon's
 * UserSettingsPage): his title and section menu around whichever page the
 * URL picks.
 */
export default function UserSettings() {
  const { pathname } = useLocation();
  return (
    <SettingsLayout
      title="User settings"
      description="Manage your profile, personal credentials and API tokens."
      sections={sections}
      // The last match, so /profile/tokens is API tokens, not Profile.
      current={sections.findLast((s) => isAt(pathname, s.href))?.href}
    >
      <Outlet />
    </SettingsLayout>
  );
}
