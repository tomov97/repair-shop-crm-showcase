import Link from "next/link";

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

function pageHref(basePath: string, page: number) {
  return page === 1 ? basePath : `${basePath}?page=${page}`;
}

function getPageWindow(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const around = [current - 1, current, current + 1].filter((p) => p > 1 && p < total);
  const result: Array<number | "ellipsis"> = [1];

  if (around[0]! > 2) result.push("ellipsis");
  result.push(...around);
  if (around[around.length - 1]! < total - 1) result.push("ellipsis");
  result.push(total);

  return result;
}

const baseBtn =
  "inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl border border-[#e8e4d4] text-sm font-medium transition";
const activeBtn = `${baseBtn} bg-[#23443f] text-white border-[#23443f] shadow-sm`;
const inactiveBtn = `${baseBtn} bg-white text-[#23443f] hover:bg-[#f4f1e5]`;
const disabledBtn = `${baseBtn} bg-white text-[#23443f]/30 border-[#e8e4d4] cursor-default`;

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const pageWindow = getPageWindow(currentPage, totalPages);

  const PrevArrow = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
  const NextArrow = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1.5">
      {/* Prev */}
      {hasPrev ? (
        <>
          {/* Mobile: arrow + label */}
          <Link
            href={pageHref(basePath, currentPage - 1)}
            className={`${inactiveBtn} gap-1.5 px-3 sm:hidden`}
            aria-label="Предишна страница"
          >
            {PrevArrow}
            <span>Предишна</span>
          </Link>
          {/* Desktop: arrow only */}
          <Link
            href={pageHref(basePath, currentPage - 1)}
            className={`${inactiveBtn} hidden px-3 sm:inline-flex`}
            aria-label="Предишна страница"
          >
            {PrevArrow}
          </Link>
        </>
      ) : (
        <>
          <span className={`${disabledBtn} gap-1.5 px-3 sm:hidden`} aria-disabled="true">
            {PrevArrow}
            <span>Предишна</span>
          </span>
          <span className={`${disabledBtn} hidden px-3 sm:inline-flex`} aria-disabled="true">
            {PrevArrow}
          </span>
        </>
      )}

      {/* Mobile: page label */}
      <span className="px-3 text-sm text-[#60726d] sm:hidden">
        Стр. {currentPage} от {totalPages}
      </span>

      {/* Desktop: numeric window */}
      <div className="hidden items-center gap-1.5 sm:flex">
        {pageWindow.map((entry, i) =>
          entry === "ellipsis" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-[#23443f]/40">
              …
            </span>
          ) : entry === currentPage ? (
            <span key={entry} className={activeBtn} aria-current="page">
              {entry}
            </span>
          ) : (
            <Link key={entry} href={pageHref(basePath, entry)} className={inactiveBtn}>
              {entry}
            </Link>
          )
        )}
      </div>

      {/* Next */}
      {hasNext ? (
        <>
          <Link
            href={pageHref(basePath, currentPage + 1)}
            className={`${inactiveBtn} gap-1.5 px-3 sm:hidden`}
            aria-label="Следваща страница"
          >
            <span>Следваща</span>
            {NextArrow}
          </Link>
          <Link
            href={pageHref(basePath, currentPage + 1)}
            className={`${inactiveBtn} hidden px-3 sm:inline-flex`}
            aria-label="Следваща страница"
          >
            {NextArrow}
          </Link>
        </>
      ) : (
        <>
          <span className={`${disabledBtn} gap-1.5 px-3 sm:hidden`} aria-disabled="true">
            <span>Следваща</span>
            {NextArrow}
          </span>
          <span className={`${disabledBtn} hidden px-3 sm:inline-flex`} aria-disabled="true">
            {NextArrow}
          </span>
        </>
      )}
    </nav>
  );
}
