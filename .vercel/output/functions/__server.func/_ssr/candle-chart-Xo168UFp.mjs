import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as ye, i as nr, n as Qe, r as le, t as $i } from "../_libs/lightweight-charts.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/candle-chart-Xo168UFp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function CandleChart({ bars, sma20, sma60, convention }) {
	const ref = (0, import_react.useRef)(null);
	const api = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!ref.current) return;
		const el = ref.current;
		const styles = getComputedStyle(document.documentElement);
		const up = styles.getPropertyValue(convention === "tw" ? "--hy-up" : "--hy-down").trim() || "#d4534a";
		const down = styles.getPropertyValue(convention === "tw" ? "--hy-down" : "--hy-up").trim() || "#2f9a6a";
		const fg = styles.getPropertyValue("--hy-muted").trim() || "#8b95a1";
		const bg = styles.getPropertyValue("--hy-surface").trim() || "#12151a";
		const chart = le(el, {
			layout: {
				background: {
					type: $i.Solid,
					color: bg
				},
				textColor: fg,
				fontFamily: "IBM Plex Mono, Noto Sans TC, sans-serif",
				attributionLogo: false
			},
			grid: {
				vertLines: { color: "rgba(140,150,160,0.08)" },
				horzLines: { color: "rgba(140,150,160,0.08)" }
			},
			rightPriceScale: { borderColor: "transparent" },
			timeScale: {
				borderColor: "transparent",
				timeVisible: false
			},
			crosshair: { mode: 0 },
			autoSize: true
		});
		api.current = chart;
		const candle = chart.addSeries(Qe, {
			upColor: up,
			downColor: down,
			borderUpColor: up,
			borderDownColor: down,
			wickUpColor: up,
			wickDownColor: down
		});
		const vol = chart.addSeries(nr, {
			priceFormat: { type: "volume" },
			priceScaleId: "vol"
		});
		chart.priceScale("vol").applyOptions({ scaleMargins: {
			top: .78,
			bottom: 0
		} });
		const l20 = chart.addSeries(ye, {
			color: "#8b95a1",
			lineWidth: 1,
			priceLineVisible: false
		});
		const l60 = chart.addSeries(ye, {
			color: "#c5ccd6",
			lineWidth: 1,
			priceLineVisible: false
		});
		const cdata = bars.map((b) => ({
			time: Date.parse(`${b.time}T00:00:00+08:00`) / 1e3,
			open: b.open,
			high: b.high,
			low: b.low,
			close: b.close
		}));
		candle.setData(cdata);
		vol.setData(bars.map((b) => ({
			time: Date.parse(`${b.time}T00:00:00+08:00`) / 1e3,
			value: b.volumeShares,
			color: b.close >= b.open ? up : down
		})));
		if (sma20) l20.setData(bars.map((b, i) => sma20[i] == null ? null : {
			time: Date.parse(`${b.time}T00:00:00+08:00`) / 1e3,
			value: sma20[i]
		}).filter((x) => x != null));
		if (sma60) l60.setData(bars.map((b, i) => sma60[i] == null ? null : {
			time: Date.parse(`${b.time}T00:00:00+08:00`) / 1e3,
			value: sma60[i]
		}).filter((x) => x != null));
		chart.timeScale().fitContent();
		return () => {
			chart.remove();
			api.current = null;
		};
	}, [
		bars,
		sma20,
		sma60,
		convention
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref,
		className: "h-[420px] w-full rounded-md"
	});
}
//#endregion
export { CandleChart as t };
