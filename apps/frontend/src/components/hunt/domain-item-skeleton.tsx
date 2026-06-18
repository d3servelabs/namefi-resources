export const DomainItemSkeleton = ({ count = 1 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-4 sm:gap-6 pe-4 sm:pe-6 py-6 sm:py-8 first:rounded-t-xl last:rounded-b-xl animate-pulse"
      >
        {/* Rank section */}
        <div className="flex items-center gap-2 w-20 sm:w-24 justify-center border-e border-border px-4 sm:px-6">
          <div className="w-8 h-8 bg-slate-700/50 rounded" />
        </div>
        {/* Content section with wrapper */}
        <div className="flex-1 flex flex-col sm:flex-row">
          <div className="flex-1 flex flex-col gap-1 sm:gap-2 w-full">
            <div className="h-5 sm:h-6 bg-slate-700/50 rounded w-3/4" />
            <div className="h-4 bg-slate-800/50 rounded w-1/2" />
          </div>
        </div>
        {/* Vote section */}
        <div className="flex flex-col items-center gap-2 w-12 sm:w-16">
          <div className="rounded-full p-2 sm:p-2.5 bg-slate-700/50">
            <div className="w-6 h-6 bg-slate-600/50 rounded" />
          </div>
          <div className="h-4 bg-slate-700/50 rounded text-base leading-none w-8" />
        </div>
      </div>
    ))}
  </>
);
