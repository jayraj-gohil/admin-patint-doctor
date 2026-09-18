import { IconChevronLeft, IconChevronRight } from "./Icons";

interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <IconChevronLeft className="w-4 h-4" />
        Previous
      </button>
      <span className="text-sm text-slate-500">
        Page <span className="font-medium text-slate-700">{page}</span> of{" "}
        <span className="font-medium text-slate-700">{totalPages}</span>
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        Next
        <IconChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
