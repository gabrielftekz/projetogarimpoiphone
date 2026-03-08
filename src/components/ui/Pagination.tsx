interface PaginationProps {
  page: number
  total: number
  pageSize: number
  onPage: (p: number) => void
}

export default function Pagination({ page, total, pageSize, onPage }: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  const baseBtnClass = "px-3 py-1.5 min-w-[36px] flex items-center justify-center rounded-lg text-sm font-bold border transition-all duration-300 focus:outline-none"

  return (
    <div className="flex items-center justify-end gap-1.5 pt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className={`${baseBtnClass} ${page === 1 ? 'opacity-30 cursor-not-allowed bg-white/5 border-white/5 text-zinc-500' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-zinc-500 text-sm font-bold">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            className={`${baseBtnClass} ${p === page
                ? 'bg-teal-500/20 border-teal-500/50 text-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.2)]'
                : 'bg-transparent border-transparent text-zinc-400 hover:bg-white/5 hover:text-white'
              }`}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        className={`${baseBtnClass} ${page === totalPages ? 'opacity-30 cursor-not-allowed bg-white/5 border-white/5 text-zinc-500' : 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white hover:border-white/20'}`}
      >
        ›
      </button>
    </div>
  )
}
