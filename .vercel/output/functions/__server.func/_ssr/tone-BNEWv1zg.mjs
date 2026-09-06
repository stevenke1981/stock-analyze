import { c as changeTone } from "./app-shell-Cb07mbk-.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/tone-BNEWv1zg.js
function toneClass(n, convention) {
	const t = changeTone(n, convention);
	if (t === "up") return "tone-up";
	if (t === "down") return "tone-down";
	return "tone-flat";
}
//#endregion
export { toneClass as t };
