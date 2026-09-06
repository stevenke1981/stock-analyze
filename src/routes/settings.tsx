import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, PageTitle } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SOURCE_CATALOG } from "@/lib/providers/catalog";
import { pingSources } from "@/lib/server/market";
import { exportAll, getSettings, importAll, saveSettings } from "@/lib/storage/db";
import { applyTheme, type Theme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery({ queryKey: ["settings"], queryFn: getSettings });
  const [ping, setPing] = useState<Array<{ id: string; ok: boolean; ms: number; detail: string }> | null>(null);
  const [busy, setBusy] = useState(false);
  const s = settings.data;
  if (!s) {
    return (
      <AppShell>
        <PageTitle title="設定" />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <PageTitle kicker="資料中心" title="設定" />
      <section className="space-y-4 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium">顯示</h2>
        <Row label="紅漲綠跌（台灣習慣）">
          <Switch
            checked={s.colorConvention === "tw"}
            onCheckedChange={async (v) => {
              await saveSettings({ colorConvention: v ? "tw" : "us" });
              qc.invalidateQueries({ queryKey: ["settings"] });
            }}
          />
        </Row>
        <Row label="深色主題">
          <Switch
            checked={s.theme !== "light"}
            onCheckedChange={async (v) => {
              const theme: Theme = v ? "dark" : "light";
              await saveSettings({ theme });
              applyTheme(theme);
              qc.invalidateQueries({ queryKey: ["settings"] });
            }}
          />
        </Row>
      </section>
      <section className="mt-4 space-y-4 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium">AI</h2>
        <p className="text-sm text-muted-foreground">
          留空 Base URL 時使用固定的 xAI 端點；伺服器端 XAI_API_KEY 只會送往 api.x.ai。第三方相容端點必須使用 HTTPS，並在個股的「AI 研究」頁籤輸入該服務自己的金鑰。金鑰只保留於當前頁面記憶體，不寫入 IndexedDB 或備份。
        </p>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">Base URL（可空）</span>
          <Input
            key={`ai-base-${s.aiBaseUrl}`}
            type="url"
            defaultValue={s.aiBaseUrl}
            onBlur={async (e) => {
              const value = e.currentTarget.value.trim();
              if (value === s.aiBaseUrl) return;
              await saveSettings({ aiBaseUrl: value });
              qc.invalidateQueries({ queryKey: ["settings"] });
            }}
            placeholder="https://api.x.ai/v1"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
          <span className="mt-1 block text-xs text-faint">
            可填 OpenAI-compatible API 的 `/v1` Base URL；系統會自動補上 `/chat/completions`。
          </span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-xs text-muted-foreground">模型</span>
          <Input
            key={`ai-model-${s.aiModel}`}
            defaultValue={s.aiModel}
            onBlur={async (e) => {
              const value = e.currentTarget.value.trim() || "grok-4.5";
              if (value === s.aiModel) return;
              await saveSettings({ aiModel: value });
              qc.invalidateQueries({ queryKey: ["settings"] });
            }}
            maxLength={200}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>
      </section>
      <section className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">資料來源連線測試</h2>
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                setPing(await pingSources());
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? "測試中…" : "測試連線"}
          </Button>
        </div>
        {ping?.map((p) => (
          <div key={p.id} className="flex items-center justify-between text-sm">
            <span>{p.id}</span>
            <span className="tabular text-muted-foreground">
              {p.ok ? "成功" : "失敗"} · {p.ms} ms · {p.detail}
            </span>
          </div>
        ))}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2">來源</th>
                <th>延遲</th>
                <th>金鑰</th>
                <th>狀態</th>
              </tr>
            </thead>
            <tbody>
              {SOURCE_CATALOG.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="py-2">
                    <div>{c.name}</div>
                    <div className="text-faint">{c.notes}</div>
                  </td>
                  <td>{c.latency === "after_hours" ? "盤後" : c.latency === "delayed" ? "延遲" : "即時"}</td>
                  <td>{c.apiKey}</td>
                  <td>
                    <Badge variant={c.wired ? "outline" : "warn"}>{c.wired ? "已接通" : "未驗證"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="mt-4 space-y-3 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium">備份</h2>
        <p className="text-sm text-muted-foreground">匯出不含行情快取與任何金鑰。還原會寫入本機自選、持股、筆記與提醒。</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={async () => {
              const json = await exportAll();
              const blob = new Blob([json], { type: "application/json" });
              const a = document.createElement("a");
              const url = URL.createObjectURL(blob);
              a.href = url;
              a.download = "hengyan-backup.json";
              a.click();
              setTimeout(() => URL.revokeObjectURL(url), 0);
            }}
          >
            匯出備份
          </Button>
          <label className="inline-flex h-11 cursor-pointer items-center rounded-sm border border-border px-4 text-sm">
            還原
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                await importAll(await file.text());
                qc.invalidateQueries();
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>
      </section>
    </AppShell>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      {children}
    </div>
  );
}
