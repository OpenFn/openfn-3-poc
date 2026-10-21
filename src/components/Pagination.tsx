import type { MouseEvent, ReactNode } from "react";
import { cn } from "../utils/cn";

interface Props {
  pageNumber: number;
  pageSize: number;
  totalEntries: number;
  onPage?: ((page: number) => void) | undefined;
  /**
   * The href of a page, e.g. `(n) => \`?page=${n}\``. With it, pages are
   * links (Lightning's pagination bar patches `page=`); without, buttons.
   * A left click still goes through `onPage` when there is one.
   */
  pageHref?: ((page: number) => string) | undefined;
  /** Extra controls after the count, e.g. the export button on History. */
  actions?: ReactNode;
}

const edge =
  "relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50";

function PageControl({
  n,
  onPage,
  pageHref,
  className,
  children,
  ...rest
}: Pick<Props, "onPage" | "pageHref"> & {
  n: number;
  className: string;
  children: ReactNode;
  "aria-current"?: "page" | undefined;
  "data-ui"?: string | undefined;
}) {
  if (!pageHref) {
    return (
      <button type="button" onClick={() => onPage?.(n)} className={className} {...rest}>
        {children}
      </button>
    );
  }
  const onClick = (e: MouseEvent) => {
    if (!onPage || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onPage(n);
  };
  return (
    <a href={pageHref(n)} onClick={onClick} className={className} {...rest}>
      {children}
    </a>
  );
}

/** Footer bar for paginated tables (Lightning's `Pagination.pagination_bar`). */
export default function Pagination({ pageNumber, pageSize, totalEntries, onPage, pageHref, actions }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));
  const from = pageNumber * pageSize - pageSize + 1;
  const to = Math.min(pageNumber * pageSize, totalEntries);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const control = { onPage, pageHref };

  return (
    <div data-ui="pagination" className="bg-white px-4 py-3 flex items-center justify-between sm:px-6 rounded-b-lg">
      <div className="flex items-center space-x-4">
        <p className="text-sm text-gray-700">
          {totalEntries === 0 ? (
            "No results found"
          ) : (
            <>
              Showing <span className="font-medium">{from}</span> to <span className="font-medium">{to}</span> of{" "}
              <span className="font-medium">{totalEntries}</span> total results
            </>
          )}
        </p>
        {actions && <div className="flex items-center">{actions}</div>}
      </div>
      <nav className="relative z-0 inline-flex rounded-md shadow-xs -space-x-px" aria-label="Pagination">
        {pageNumber > 1 && (
          <PageControl n={pageNumber - 1} {...control} className={cn(edge, "rounded-l-md")}>
            <span className="sr-only">Previous</span>
            <span className="hero-chevron-left h-5 w-5" />
          </PageControl>
        )}
        {pages.map((n) => (
          <PageControl
            key={n}
            n={n}
            {...control}
            aria-current={n === pageNumber ? "page" : undefined}
            data-ui="pagination-page"
            className={cn(
              "relative inline-flex items-center px-4 py-2 border text-sm font-medium",
              n === pageNumber
                ? "z-10 bg-primary-50 border-primary-500 text-primary-600"
                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
            )}
          >
            {n}
          </PageControl>
        ))}
        {pageNumber < totalPages && (
          <PageControl n={pageNumber + 1} {...control} className={cn(edge, "rounded-r-md")}>
            <span className="sr-only">Next</span>
            <span className="hero-chevron-right h-5 w-5" />
          </PageControl>
        )}
      </nav>
    </div>
  );
}
