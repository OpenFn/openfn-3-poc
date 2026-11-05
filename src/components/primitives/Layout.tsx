import { useCallback, useState, type ReactNode } from "react";

/** The frame's own state, handed to the sidebar it draws. */
export interface SidebarFrame {
  collapsed: boolean;
  onToggle: () => void;
}

/**
 * The frame around every signed-in page (shell/AppShell.query.tsx fills it): the sidebar beside the page, which
 * is the `main` landmark. Both are slots, so the frame knows nothing about
 * OpenFn's menus or data; it keeps whether the sidebar is collapsed.
 */
export default function Layout({ sidebar, children }: { sidebar: (frame: SidebarFrame) => ReactNode; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const onToggle = useCallback(() => setCollapsed((c) => !c), []);
  return (
    <div data-ui="layout" className="flex h-screen">
      {sidebar({ collapsed, onToggle })}
      {/* tabIndex -1: ProjectGate moves focus here when the page it swapped in took the focused element with it. */}
      <main tabIndex={-1} className="min-w-0 flex-auto focus:outline-none">
        {children}
      </main>
    </div>
  );
}
