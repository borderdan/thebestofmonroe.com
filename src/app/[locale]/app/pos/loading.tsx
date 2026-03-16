import { Skeleton } from '@/components/ui/skeleton'

export default function PosLoading() {
  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Product grid */}
      <div className="flex-1 space-y-4">
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-card/80 p-3 space-y-2">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
      {/* Cart sidebar */}
      <div className="hidden lg:block w-80 rounded-2xl border border-white/10 bg-card/80 p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
        <div className="pt-4 space-y-2 border-t border-white/10">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
