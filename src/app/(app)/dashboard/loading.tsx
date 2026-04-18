export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-7 w-32 bg-vs-border rounded-xl mb-6" />
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 h-24 border border-vs-border" />
        ))}
      </div>
      <div className="h-28 bg-vs-border rounded-2xl mb-5" />
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-vs-border h-20" />
        ))}
      </div>
    </div>
  );
}
