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

  return (
    <div className="flex items-center justify-end gap-1 pt-4">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        style={{
          padding: '5px 10px',
          border: '1px solid #E2E8F0',
          borderRadius: '4px',
          fontSize: '13px',
          background: '#fff',
          color: page === 1 ? '#CBD5E1' : '#0F172A',
          cursor: page === 1 ? 'not-allowed' : 'pointer',
        }}
      >
        ‹
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} style={{ padding: '5px 4px', color: '#94A3B8', fontSize: '13px' }}>…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p as number)}
            style={{
              padding: '5px 10px',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              fontSize: '13px',
              background: p === page ? '#0F172A' : '#fff',
              color: p === page ? '#fff' : '#0F172A',
              fontWeight: p === page ? 600 : 400,
            }}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === totalPages}
        style={{
          padding: '5px 10px',
          border: '1px solid #E2E8F0',
          borderRadius: '4px',
          fontSize: '13px',
          background: '#fff',
          color: page === totalPages ? '#CBD5E1' : '#0F172A',
          cursor: page === totalPages ? 'not-allowed' : 'pointer',
        }}
      >
        ›
      </button>
    </div>
  )
}
