import { i as __toESM } from "../_runtime.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { S as saveNote, h as listNotes, s as deleteNote } from "./router-befYNiLd.mjs";
import { a as Input, n as Button, o as PageTitle, r as EmptyState, t as AppShell } from "./app-shell-Cb07mbk-.mjs";
import { t as Textarea } from "./textarea-JIAiD--g.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notes-KHlwDWwX.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function NotesPage() {
	const qc = useQueryClient();
	const notes = useQuery({
		queryKey: ["notes"],
		queryFn: listNotes
	});
	const [title, setTitle] = (0, import_react.useState)("");
	const [body, setBody] = (0, import_react.useState)("");
	const [symbol, setSymbol] = (0, import_react.useState)("");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AppShell, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PageTitle, {
			kicker: "投資筆記",
			title: "研究紀錄"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid gap-3 md:grid-cols-[220px_1fr]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: symbol,
				onChange: (e) => setSymbol(e.target.value),
				placeholder: "代號（可空）"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: title,
				onChange: (e) => setTitle(e.target.value),
				placeholder: "標題"
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
			className: "mt-3",
			value: body,
			onChange: (e) => setBody(e.target.value),
			placeholder: "內容保存在此瀏覽器"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			className: "mt-3",
			onClick: async () => {
				if (!title.trim()) return;
				await saveNote({
					id: crypto.randomUUID(),
					market: "",
					symbol,
					title,
					body,
					updatedAt: (/* @__PURE__ */ new Date()).toISOString()
				});
				setTitle("");
				setBody("");
				qc.invalidateQueries({ queryKey: ["notes"] });
			},
			children: "儲存筆記"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mt-6 space-y-3",
			children: (notes.data ?? []).length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EmptyState, {
				title: "還沒有筆記",
				body: "把研究假設、失效條件寫下來，重啟後仍會保留。"
			}) : (notes.data ?? []).map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
				className: "rounded-lg border border-border bg-card p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "font-medium",
							children: [n.symbol ? `${n.symbol} · ` : "", n.title]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "text-xs text-muted-foreground underline",
							onClick: async () => {
								await deleteNote(n.id);
								qc.invalidateQueries({ queryKey: ["notes"] });
							},
							children: "刪除"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 whitespace-pre-wrap text-sm text-muted-foreground",
						children: n.body
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 text-[11px] text-faint",
						children: n.updatedAt.slice(0, 16)
					})
				]
			}, n.id))
		})
	] });
}
//#endregion
export { NotesPage as component };
