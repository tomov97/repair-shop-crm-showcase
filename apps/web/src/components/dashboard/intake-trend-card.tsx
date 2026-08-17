"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import type { EChartsOption } from "echarts";
import type { IntakeTrendRange, IntakeTrendSeries } from "@/lib/dashboard-data";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

const rangeLabels: Array<{ key: IntakeTrendRange; label: string }> = [
  { key: "daily", label: "Day" },
  { key: "weekly", label: "Week" },
  { key: "monthly", label: "Month" },
  { key: "yearly", label: "Year" },
];

export function IntakeTrendCard({ series }: { series: IntakeTrendSeries }) {
  const [activeRange, setActiveRange] = useState<IntakeTrendRange>("daily");
  const activeSeries = series[activeRange];

  const options = useMemo<EChartsOption>(() => {
    const labels = activeSeries.points.map((point) => point.shortLabel);
    const values = activeSeries.points.map((point) => point.value);
    const detailedLabels = activeSeries.points.map((point) => point.label);

    return {
      animationDuration: 450,
      animationDurationUpdate: 350,
      grid: {
        left: 22,
        right: 18,
        top: 18,
        bottom: 28,
        containLabel: true,
      },
      tooltip: {
        trigger: "axis",
        axisPointer: {
          type: "line",
          lineStyle: {
            color: "rgba(125, 220, 186, 0.45)",
            width: 1,
          },
        },
        backgroundColor: "rgba(13, 30, 28, 0.95)",
        borderColor: "rgba(114, 194, 165, 0.45)",
        borderWidth: 1,
        textStyle: {
          color: "#def4eb",
          fontSize: 12,
          fontFamily: "inherit",
        },
        formatter: (params) => {
          const point = Array.isArray(params) ? params[0] : params;
          const index = typeof point?.dataIndex === "number" ? point.dataIndex : 0;
          const label = detailedLabels[index] ?? "";
          const value = typeof point?.value === "number" ? point.value : Number(point?.value ?? 0);
          return `${label}<br/>${value} intakes`;
        },
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: labels,
        axisLine: {
          lineStyle: {
            color: "rgba(190, 228, 212, 0.2)",
          },
        },
        axisTick: { show: false },
        axisLabel: {
          color: "rgba(210, 238, 226, 0.72)",
          fontSize: 11,
          margin: 12,
        },
      },
      yAxis: {
        type: "value",
        minInterval: 1,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: {
          lineStyle: {
            color: "rgba(190, 228, 212, 0.14)",
            type: "dashed",
          },
        },
      },
      series: [
        {
          type: "line",
          smooth: 0.48,
          data: values,
          showSymbol: true,
          symbol: "circle",
          symbolSize: 7,
          lineStyle: {
            width: 3,
            color: "#78e0bb",
            shadowBlur: 18,
            shadowColor: "rgba(112, 219, 181, 0.52)",
          },
          itemStyle: {
            color: "#86e9c7",
            borderColor: "#57bc97",
            borderWidth: 1,
          },
          emphasis: {
            focus: "series",
            itemStyle: {
              color: "#b9f6de",
              borderColor: "#74d3b0",
              borderWidth: 2,
            },
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(88, 196, 155, 0.45)" },
                { offset: 0.55, color: "rgba(63, 143, 117, 0.2)" },
                { offset: 1, color: "rgba(35, 68, 63, 0.02)" },
              ],
            },
          },
        },
      ],
    };
  }, [activeSeries]);

  return (
    <article className="rounded-[1.75rem] border border-border bg-white/88 px-4 py-4 shadow-[0_18px_48px_rgba(20,30,28,0.06)] backdrop-blur sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Intake trend</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex min-h-9 items-center rounded-xl border border-[#2c4d47] bg-[#183430] px-3 text-sm font-semibold text-[#d9efe8]">
            Total: {activeSeries.total}
          </div>
          {rangeLabels.map((range) => {
            const isActive = range.key === activeRange;

            return (
              <button
                key={range.key}
                type="button"
                onClick={() => setActiveRange(range.key)}
                className={`min-h-9 rounded-xl px-3 py-2 text-xs font-semibold transition sm:text-sm ${
                  isActive
                    ? "bg-surface-strong text-white shadow-[0_10px_24px_rgba(35,68,63,0.24)]"
                    : "bg-[#eef2ec] text-surface-strong hover:bg-[#e3e9e3]"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.45rem] border border-[#34544f] bg-[linear-gradient(155deg,_#1c2f2d_0%,_#1a2a29_46%,_#132322_100%)] p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]">
        <ReactECharts
          option={options}
          notMerge
          lazyUpdate
          style={{ height: 220, width: "100%" }}
        />
      </div>
    </article>
  );
}
