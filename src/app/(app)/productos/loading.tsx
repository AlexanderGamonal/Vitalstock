export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-5">
        <div className="h-7 w-28 bg-vs-border rounded-xl" />
        <div className="h-9 w-24 bg-vs-border rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-2 mb-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-vs-border h-16" />
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-vs-border h-24" />
        ))}
      </div>
    </div>
  );
}
