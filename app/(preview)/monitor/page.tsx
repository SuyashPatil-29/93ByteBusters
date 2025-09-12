import { kv } from "@vercel/kv";

export const dynamic = "force-dynamic";

async function getMetric(name: string) {
  try {
    const v = await kv.get<number>(`metrics:${name}`);
    return v ?? 0;
  } catch {
    return 0;
  }
}

export default async function MonitorPage() {
  const names = [
    "uuid.cache.hit",
    "uuid.scrape.success",
    "uuid.fuzzy.hit",
    "status.fetch.success",
  ];
  const values = await Promise.all(names.map((n) => getMetric(n)));

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-semibold mb-6">System Metrics</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {names.map((n, i) => (
          <div key={n} className="border rounded p-4">
            <div className="text-sm text-zinc-500">{n}</div>
            <div className="text-2xl font-bold">{values[i]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


