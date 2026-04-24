import { useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CONFIG } from "../config";
import type { Item } from "../types";

type CountryCount = { country: string; count: number };

const TOP_N = 15;

function aggregate(items: Item[]): CountryCount[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const country =
      String(item.fields.find((f) => f.key === "country")?.value ?? "").trim() ||
      "Unknown";
    map.set(country, (map.get(country) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TOP_N);
}

export function StatsDialog() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<CountryCount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`${CONFIG.backendUrl}/items`)
      .then((r) => r.json())
      .then((json: { data?: { items?: Item[] } }) => {
        const items = json.data?.items ?? [];
        setTotal(items.length);
        setData(aggregate(items));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="absolute bottom-56 right-2.5 z-10 size-7.25 rounded-sm bg-white border border-white/60 shadow-md text-[#333] flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
        aria-label="Statistics"
        title="Statistics"
      >
        <BarChart2 className="size-4" />
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        <DialogHeader className="bg-[#1a1a2e] text-white px-5 pt-5 pb-4">
          <DialogTitle className="text-base font-bold text-white">
            Messages by Country
          </DialogTitle>
          {!loading && (
            <p className="text-[12px] text-white/50 mt-0.5">
              {total} messages total · Top {Math.min(TOP_N, data.length)} countries
            </p>
          )}
        </DialogHeader>

        <div className="px-4 py-5 bg-[#f5f5f5]">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : data.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
              No data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, data.length * 32)}>
              <BarChart
                data={data}
                layout="vertical"
                margin={{ top: 0, right: 32, bottom: 0, left: 8 }}
              >
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="country"
                  width={100}
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  contentStyle={{ fontSize: 12, borderRadius: 6 }}
                  formatter={(value) => [value, "messages"]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={20}>
                  {data.map((_, i) => (
                    <Cell
                      key={i}
                      fill={i === 0 ? "#2e7d32" : "#4caf50"}
                      opacity={1 - i * 0.04}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
