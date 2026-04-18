export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between items-center mb-5">
        <div className="h-7 w-24 bg-vs-border rounded-xl" />
        <div className="h-9 w-28 bg-vs-border rounded-xl" />
      </div>
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-vs-border h-24" />
        ))}
      </div>
    </div>
  );
}
