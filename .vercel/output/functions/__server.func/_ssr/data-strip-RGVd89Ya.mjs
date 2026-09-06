import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { _ as sessionLabel, u as formatDateTimeTaipei, v as statusLabel } from "./app-shell-Cb07mbk-.mjs";
import { t as Badge } from "./badge-CAOs_68P.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/data-strip-RGVd89Ya.js
var import_jsx_runtime = require_jsx_runtime();
function DataStrip({ provenance, error }) {
	if (!provenance && !error) return null;
	const stale = provenance?.status === "stale" || provenance?.status === "unavailable";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
		children: [provenance ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				variant: stale ? "warn" : "outline",
				children: statusLabel(provenance.status)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
				variant: "outline",
				children: sessionLabel(provenance.session)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["來源 ", provenance.source] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["行情時間 ", formatDateTimeTaipei(provenance.eventTime)] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["取得時間 ", formatDateTimeTaipei(provenance.fetchedAt)] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: provenance.adjustment === "raw" ? "原始價格" : "還原價格" })
		] }) : null, error ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			variant: "warn",
			children: error
		}) : null]
	});
}
//#endregion
export { DataStrip as t };
