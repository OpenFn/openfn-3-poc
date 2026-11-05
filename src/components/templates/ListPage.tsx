import type { ReactNode } from "react";
import Header from "@/components/primitives/Header";
import Button from "@/components/primitives/Button";
import { Centered, PageContent } from "@/components/primitives/PageContent";
import { Stack } from "@/components/primitives/Stack";
import Text from "@/components/primitives/Text";
import AsyncBoundary from "@/components/primitives/AsyncBoundary";
import EmptyState from "@/components/primitives/EmptyState";
import type { ResourceStatus } from "@/types/resource";

/** The page's main action: the header's button, and the empty state's when the list is empty. */
export interface ListAction {
  label: string;
  onClick: () => void;
  /** The header button's id, for hosts that address it. */
  id?: string;
}

/** The words for an empty list. ListPage decides when to show them and how they look. */
export interface ListEmpty {
  /** A Heroicon class. */
  icon: string;
  title?: string;
  message: string;
  /** The empty state's wording of the main action ("Create a new one."). Left out, the action's label. */
  actionLabel?: string;
}

/**
 * A page that is one list: a title and its main action in the header, then
 * any notice, then the list. Loading, failure and the empty state are drawn
 * here, so every list page shows them the same way; the page passes the
 * words and the list. With an empty list the main action leaves the header
 * for the empty state, so one create button is on screen.
 */
export default function ListPage({
  title,
  showCount = false,
  description,
  action,
  notice,
  status = { state: "ready" },
  itemCount,
  empty,
  list,
  children,
}: {
  title: string;
  /** Show "(3)" after the title, while the list has rows. */
  showCount?: boolean;
  /** One line under the header, saying what the list is. */
  description?: ReactNode;
  action?: ListAction;
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
  const isEmpty = status.state === "ready" && itemCount === 0;
  return (
    <PageContent
      header={
        <Header title={title} count={showCount && itemCount > 0 ? itemCount : undefined}>
          {action && !isEmpty && (
            <Button id={action.id} onClick={action.onClick}>
              {action.label}
            </Button>
          )}
        </Header>
      }
    >
      <Centered>
        <Stack>
          {description && <Text tone="muted">{description}</Text>}
          {notice}
          <AsyncBoundary status={status}>
            {isEmpty ? (
              <EmptyState
                icon={empty.icon}
                title={empty.title}
                message={empty.message}
                buttonText={action && (empty.actionLabel ?? action.label)}
                onClick={action?.onClick}
              />
            ) : (
              list
            )}
          </AsyncBoundary>
        </Stack>
      </Centered>
      {children}
    </PageContent>
  );
}
