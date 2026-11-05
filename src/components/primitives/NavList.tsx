import { Link } from "@/routing/router";
import { cn } from "@/utils/cn";

export interface NavListItem {
  label: string;
  /** In-app path the item links to. */
  href: string;
  /** Hero icon class shown before the label. */
  icon: string;
}

/**
 * A column of links to the pages of one area, with the current one marked
 * (Primer's NavList). Links to other pages, so a `nav` with `aria-current`,
 * not a tab list.
 */
export default function NavList({ label, items, current }: { label: string; items: NavListItem[]; current: string | undefined }) {
  return (
    <nav aria-label={label} data-ui="nav-list">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = item.href === current;
          return (
            <li key={item.href}>
              <Link
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
                  // Weight as well as colour, so the current one shows without colour (WCAG 1.4.1).
                  active ? "bg-selected font-semibold text-selected" : "font-medium text-muted hover:bg-hover hover:text-body"
                )}
              >
                <span className={cn(item.icon, "size-4 shrink-0")} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
