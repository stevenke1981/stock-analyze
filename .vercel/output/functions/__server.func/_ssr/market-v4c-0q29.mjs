import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as object, i as number, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/market-v4c-0q29.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var marketSchema = _enum(["TWSE", "TPEX"]);
var getOverview = createServerFn({ method: "GET" }).handler(createSsrRpc("33081e03018686e2851129adfc2ce4dd36b6158f51663ad00c3c25d2027de7f4"));
var getUniverse = createServerFn({ method: "GET" }).handler(createSsrRpc("a3c359c53aebd808970603b2878e4da87de6f0dfde345cf39a9d50aa1235c90d"));
var searchStocks = createServerFn({ method: "GET" }).validator(object({ q: string() })).handler(createSsrRpc("46846df7d90b8f7e1f53bf629f28616003abad205f2e49528bb0ed814bd4eb06"));
var getHistory = createServerFn({ method: "GET" }).validator(object({
	market: marketSchema,
	symbol: string().min(1).max(12),
	months: number().min(1).max(36).optional()
})).handler(createSsrRpc("f13e40ff69f626ca8759eb9a782d129be9b2a7c883244243ef23bbb49ce98584"));
var getMonthlyRevenue = createServerFn({ method: "GET" }).validator(object({ symbol: string().min(1).max(12) })).handler(createSsrRpc("2f1771948f4055b66e14f4f4ee2a80a03d7455c3d38ec5a15457cefd8dc3431b"));
var getInstitution = createServerFn({ method: "GET" }).validator(object({
	symbol: string().min(1).max(12),
	date: string().optional()
})).handler(createSsrRpc("b00199cab026248daccfb2bd6a6b58516cb6b43e43b643270fbbc56058195dca"));
var getMargin = createServerFn({ method: "GET" }).validator(object({
	symbol: string().min(1).max(12),
	date: string().optional()
})).handler(createSsrRpc("6b54840e3e845fdda02a3068da4ca9ae6b245f4b6d443b2f5c6c939eb44c9db8"));
var getActions = createServerFn({ method: "GET" }).handler(createSsrRpc("e3806e9ab300cd2c7ff907b5fd4dc7acefb48ae4deafeec263b8ffe347429114"));
var pingSources = createServerFn({ method: "GET" }).handler(createSsrRpc("b0af9ddb14789da27d68ddc2b398a21f7288c450a7b7d8634a6b88f6b8826236"));
//#endregion
export { getMargin as a, getUniverse as c, getInstitution as i, pingSources as l, getActions as n, getMonthlyRevenue as o, getHistory as r, getOverview as s, createSsrRpc as t, searchStocks as u };
