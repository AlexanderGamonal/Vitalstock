export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-5 w-16 bg-vs-border rounded-xl mb-5" />
      <div className="h-7 w-36 bg-vs-border rounded-xl mb-5" />
      <div className="space-y-4">
        <div className="h-12 bg-vs-border rounded-xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-vs-border rounded-xl" />
          <div className="h-12 bg-vs-border rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 bg-vs-border rounded-xl" />
          <div className="h-12 bg-vs-border rounded-xl" />
        </div>
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex-1 h-10 bg-vs-border rounded-xl" />
          ))}
        </div>
        <div className="h-20 bg-vs-border rounded-xl" />
      </div>
      <div className="h-14 bg-vs-border rounded-2xl mt-6" />
    </div>
  );
}
