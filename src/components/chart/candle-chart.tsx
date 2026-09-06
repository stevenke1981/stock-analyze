import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import type { Bar } from "@/lib/domain/types";

export function CandleChart({
  bars,
  sma20,
  sma60,
  convention,
}: {
  bars: Bar[];
  sma20?: Array<number | null>;
  sma60?: Array<number | null>;
  convention: "tw" | "us";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const api = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const styles = getComputedStyle(document.documentElement);
    const up = styles.getPropertyValue(convention === "tw" ? "--hy-up" : "--hy-down").trim() || "#d4534a";
    const down = styles.getPropertyValue(convention === "tw" ? "--hy-down" : "--hy-up").trim() || "#2f9a6a";
    const fg = styles.getPropertyValue("--hy-muted").trim() || "#8b95a1";
    const bg = styles.getPropertyValue("--hy-surface").trim() || "#12151a";
    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: bg },
        textColor: fg,
        fontFamily: "IBM Plex Mono, Noto Sans TC, sans-serif",
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: "rgba(140,150,160,0.08)" },
        horzLines: { color: "rgba(140,150,160,0.08)" },
      },
      rightPriceScale: { borderColor: "transparent" },
      timeScale: { borderColor: "transparent", timeVisible: false },
      crosshair: { mode: 0 },
      autoSize: true,
    });
    api.current = chart;
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: up,
      downColor: down,
      borderUpColor: up,
      borderDownColor: down,
      wickUpColor: up,
      wickDownColor: down,
    }) as ISeriesApi<"Candlestick">;
    const vol = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "vol",
    });
    chart.priceScale("vol").applyOptions({
      scaleMargins: { top: 0.78, bottom: 0 },
    });
    const l20 = chart.addSeries(LineSeries, { color: "#8b95a1", lineWidth: 1, priceLineVisible: false });
    const l60 = chart.addSeries(LineSeries, { color: "#c5ccd6", lineWidth: 1, priceLineVisible: false });

    const cdata = bars.map((b) => ({
      time: (Date.parse(`${b.time}T00:00:00+08:00`) / 1000) as UTCTimestamp,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));
    candle.setData(cdata);
    vol.setData(
      bars.map((b) => ({
        time: (Date.parse(`${b.time}T00:00:00+08:00`) / 1000) as UTCTimestamp,
        value: b.volumeShares,
        color: b.close >= b.open ? up : down,
      })),
    );
    if (sma20) {
      l20.setData(
        bars
          .map((b, i) =>
            sma20[i] == null
              ? null
              : {
                  time: (Date.parse(`${b.time}T00:00:00+08:00`) / 1000) as UTCTimestamp,
                  value: sma20[i] as number,
                },
          )
          .filter((x): x is { time: UTCTimestamp; value: number } => x != null),
      );
    }
    if (sma60) {
      l60.setData(
        bars
          .map((b, i) =>
            sma60[i] == null
              ? null
              : {
                  time: (Date.parse(`${b.time}T00:00:00+08:00`) / 1000) as UTCTimestamp,
                  value: sma60[i] as number,
                },
          )
          .filter((x): x is { time: UTCTimestamp; value: number } => x != null),
      );
    }
    chart.timeScale().fitContent();
    return () => {
      chart.remove();
      api.current = null;
    };
  }, [bars, sma20, sma60, convention]);

  return <div ref={ref} className="h-[420px] w-full rounded-md" />;
}
