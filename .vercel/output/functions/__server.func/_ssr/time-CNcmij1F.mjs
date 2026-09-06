//#region node_modules/.nitro/vite/services/ssr/assets/time-CNcmij1F.js
var TAIPEI_TZ = "Asia/Taipei";
function taipeiParts(date = /* @__PURE__ */ new Date()) {
	const fmt = new Intl.DateTimeFormat("en-US", {
		timeZone: TAIPEI_TZ,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		weekday: "short",
		hourCycle: "h23"
	});
	const map = {};
	for (const p of fmt.formatToParts(date)) if (p.type !== "literal") map[p.type] = p.value;
	const weekdayMap = {
		Sun: 0,
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6
	};
	const year = Number(map.year);
	const month = Number(map.month);
	const day = Number(map.day);
	return {
		year,
		month,
		day,
		hour: Number(map.hour),
		minute: Number(map.minute),
		weekday: weekdayMap[map.weekday ?? ""] ?? 0,
		isoDate: `${year}-${pad(month)}-${pad(day)}`
	};
}
function pad(n) {
	return String(n).padStart(2, "0");
}
function parseMarketDate(raw) {
	if (!raw) return null;
	const s = raw.trim();
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
	if (/^20\d{2}\d{2}\d{2}$/.test(s)) return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
	return rocToIso(s);
}
function rocToIso(raw) {
	const m = raw.trim().replace(/-/g, "/").match(/^(\d{2,3})[\/]?(\d{2})[\/]?(\d{2})$/);
	if (!m) return null;
	return `${Number(m[1]) + 1911}-${m[2]}-${m[3]}`;
}
function isoToYmdSlash(iso) {
	const [y, m, d] = iso.split("-");
	return `${y}/${m}/${d}`;
}
function firstOfMonthIso(iso) {
	return `${iso.slice(0, 7)}-01`;
}
function addMonthsIso(iso, delta) {
	const [y, m] = iso.split("-").map(Number);
	const dt = new Date(Date.UTC(y, m - 1 + delta, 1));
	return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-01`;
}
function monthKeysGoingBack(fromIso, months) {
	const start = firstOfMonthIso(fromIso);
	const keys = [];
	for (let i = 0; i < months; i += 1) keys.push(addMonthsIso(start, -i));
	return keys;
}
function addDaysIso(iso, delta) {
	const [y, m, d] = iso.split("-").map(Number);
	const dt = new Date(Date.UTC(y, m - 1, d + delta));
	return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
function recentWeekdaysIso(fromIso, n = 6) {
	let iso = fromIso ?? taipeiParts().isoDate;
	const out = [];
	for (let i = 0; i < 21 && out.length < n; i += 1) {
		const [y, m, d] = iso.split("-").map(Number);
		const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
		if (wd !== 0 && wd !== 6) out.push(iso);
		iso = addDaysIso(iso, -1);
	}
	return out;
}
function classifySession(now = /* @__PURE__ */ new Date(), holidays = /* @__PURE__ */ new Set()) {
	const p = taipeiParts(now);
	if (p.weekday === 0 || p.weekday === 6 || holidays.has(p.isoDate)) return "holiday";
	const minutes = p.hour * 60 + p.minute;
	if (minutes >= 540 && minutes < 810) return "regular";
	if (minutes >= 810 && minutes < 1440) return "after_hours";
	return "closed";
}
function isoNow() {
	return (/* @__PURE__ */ new Date()).toISOString();
}
//#endregion
export { monthKeysGoingBack as a, rocToIso as c, isoToYmdSlash as i, taipeiParts as l, firstOfMonthIso as n, parseMarketDate as o, isoNow as r, recentWeekdaysIso as s, classifySession as t };
