export function TimelineSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-14 bg-blue-50 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}
