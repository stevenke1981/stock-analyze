import { changeTone } from "@/lib/domain/format";

export function toneClass(n: number | null | undefined, convention: "tw" | "us"): string {
  const t = changeTone(n, convention);
  if (t === "up") return "tone-up";
  if (t === "down") return "tone-down";
  return "tone-flat";
}
