export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="space-y-2">
          <div className="h-9 bg-muted rounded-lg w-64 animate-pulse" />
          <div className="h-5 bg-muted rounded w-96 animate-pulse" />
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              {s < 5 && <div className="flex-1 h-0.5 bg-muted" />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="h-7 bg-muted rounded w-48 animate-pulse" />
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-32 animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-24 animate-pulse" />
              <div className="h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-40 animate-pulse" />
              <div className="h-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="h-10 bg-muted rounded w-32 animate-pulse" />
        </div>
      </div>
    </div>
  )
}
