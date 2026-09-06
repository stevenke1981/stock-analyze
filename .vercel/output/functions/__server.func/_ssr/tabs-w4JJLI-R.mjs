import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { l as cn } from "./app-shell-Cb07mbk-.mjs";
import { i as Trigger, n as List, r as Root2, t as Content } from "../_libs/radix-ui__react-tabs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tabs-w4JJLI-R.js
var import_jsx_runtime = require_jsx_runtime();
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-sm bg-secondary", className),
		...props
	});
}
var Tabs = Root2;
function TabsList({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(List, {
		className: cn("inline-flex h-11 items-center gap-1 rounded-md bg-secondary p-1 text-muted-foreground overflow-x-auto", className),
		...props
	});
}
function TabsTrigger({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trigger, {
		className: cn("inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-sm px-3 text-sm font-medium transition-colors data-[state=active]:bg-card data-[state=active]:text-foreground", className),
		...props
	});
}
var TabsContent = Content;
//#endregion
export { TabsTrigger as a, TabsList as i, Tabs as n, TabsContent as r, Skeleton as t };
