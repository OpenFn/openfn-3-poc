import type { ReactNode } from "react";

/**
 * The frame around every signed-in page: the sidebar beside the page. Both
 * are slots, so the frame knows nothing about OpenFn's menus or data.
 */
export default function Layout({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <main className="flex h-screen">
      {sidebar}
      <div className="min-w-0 flex-auto">{children}</div>
    </main>
  );
}
