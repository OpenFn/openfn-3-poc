import type { ReactNode } from "react";
import Header from "@/components/primitives/Header";
import NavList, { type NavListItem } from "@/components/primitives/NavList";
import { Centered, PageContent } from "@/components/primitives/PageContent";

/**
 * A group of settings pages (Brandon's SettingsLayout): the group's title in
 * the header, its sections down the left, the current one on the right. Each
 * section draws its own heading and main action; narrow, the sections sit
 * above it. The section is a CSS container, so its `@` breakpoints follow
 * its own width.
 */
export default function SettingsLayout({
  title,
  description,
  sections,
  current,
  children,
}: {
  title: string;
  /** One line under the title saying what the group holds. */
  description: string;
  /** One link per section page, in menu order. */
  sections: NavListItem[];
  /** The href of the section on screen. */
  current: string | undefined;
  children: ReactNode;
}) {
  return (
    <PageContent header={<Header title={title} description={description} />}>
      <Centered>
        <div className="flex flex-col gap-6 md:flex-row md:gap-8">
          <div className="md:w-48 md:shrink-0">
            <NavList label={`${title} sections`} items={sections} current={current} />
          </div>
          <div className="@container min-w-0 flex-1">{children}</div>
        </div>
      </Centered>
    </PageContent>
  );
}
