import type { ReactNode } from "react";
import Header from "@/components/primitives/Header";
import { Centered, PageContent } from "@/components/primitives/PageContent";
import { Stack } from "@/components/primitives/Stack";
import Text from "@/components/primitives/Text";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import EmptyState from "@/components/primitives/EmptyState";
import type { ResourceStatus } from "@/types/resource";

/** The words for an empty list. ListPage decides when to show them and how they look. */
export interface ListEmpty {
  /** A Heroicon class. */
  icon: string;
  title?: string;
  message: string;
}

/**
 * A page that is one list: a title and its actions in the header, then any
 * notice, then the list. Loading, failure and the empty state are drawn here,
 * so every list page shows them the same way; the page passes the words and
 * the list. The actions stay in the header whatever the list's state, and
 * the empty state is words only, so there is one create button on screen.
 */
export default function ListPage({
  title,
  breadcrumbs,
  showCount = false,
  description,
  actions,
  notice,
  status = { state: "ready" },
  itemCount,
  empty,
  list,
  children,
}: {
  title: string;
  /** A project page's trail, in the bar above the title. */
  breadcrumbs?: ReactNode;
  /** Show "(3)" after the title, while the list has rows. */
  showCount?: boolean;
  /** One line under the header, saying what the list is. */
  description?: ReactNode;
  /** The header's buttons (and a search box), main action first. Shown in every state. */
  actions?: ReactNode;
  /** Above the list, e.g. a greeting or a banner after a save. Shown in every state. */
  notice?: ReactNode;
  /** Where loading the list stands. Left out, it is ready. */
  status?: ResourceStatus | undefined;
  /** How many rows the list has; at 0 the empty state takes its place. */
  itemCount: number;
  empty: ListEmpty;
  /** The list itself, usually a table. */
  list: ReactNode;
  /** The page's modals. */
  children?: ReactNode;
}) {
  return (
    <PageContent
      header={
        <Header title={title} breadcrumbs={breadcrumbs} count={showCount && itemCount > 0 ? itemCount : undefined}>
          {actions}
        </Header>
      }
    >
      <Centered>
        <Stack>
          {description && <Text tone="muted">{description}</Text>}
          {notice}
          <AsyncBoundary status={status}>
            {itemCount === 0 ? <EmptyState icon={empty.icon} title={empty.title} message={empty.message} /> : list}
          </AsyncBoundary>
        </Stack>
      </Centered>
      {children}
    </PageContent>
  );
}
