"use client";

import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import type { HealthEntry } from "@/lib/utils";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

type Props = {
  entries: HealthEntry[];
};

export function DailyChart({ entries }: Props) {
  const labels = entries.map((e) => e.date);
  const data = {
    labels,
    datasets: [
      {
        label: "Score",
        data: entries.map((e) => e.score),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        tension: 0.3,
      },
    ],
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="mb-2 text-sm font-semibold text-slate-200">Évolution quotidienne</h2>
      <Line data={data} />
    </div>
  );
}
