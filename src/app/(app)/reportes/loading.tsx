export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-28 bg-vs-border rounded-xl mb-5" />
      <div className="grid grid-cols-2 gap-3 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-vs-border h-24" />
        ))}
      </div>
      <div className="h-6 w-40 bg-vs-border rounded-xl mb-3" />
      <div className="bg-white rounded-2xl border border-vs-border h-48 mb-6" />
      <div className="h-6 w-48 bg-vs-border rounded-xl mb-3" />
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-vs-border h-16" />
        ))}
      </div>
    </div>
  );
}
