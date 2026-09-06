import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, EmptyState, PageTitle } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteNote, listNotes, saveNote } from "@/lib/storage/db";

export const Route = createFileRoute("/notes")({ component: NotesPage });

function NotesPage() {
  const qc = useQueryClient();
  const notes = useQuery({ queryKey: ["notes"], queryFn: listNotes });
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [symbol, setSymbol] = useState("");
  return (
    <AppShell>
      <PageTitle kicker="投資筆記" title="研究紀錄" />
      <div className="grid gap-3 md:grid-cols-[220px_1fr]">
        <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="代號（可空）" />
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="標題" />
      </div>
      <Textarea className="mt-3" value={body} onChange={(e) => setBody(e.target.value)} placeholder="內容保存在此瀏覽器" />
      <Button
        className="mt-3"
        onClick={async () => {
          if (!title.trim()) return;
          await saveNote({
            id: crypto.randomUUID(),
            market: "",
            symbol,
            title,
            body,
            updatedAt: new Date().toISOString(),
          });
          setTitle("");
          setBody("");
          qc.invalidateQueries({ queryKey: ["notes"] });
        }}
      >
        儲存筆記
      </Button>
      <div className="mt-6 space-y-3">
        {(notes.data ?? []).length === 0 ? (
          <EmptyState title="還沒有筆記" body="把研究假設、失效條件寫下來，重啟後仍會保留。" />
        ) : (
          (notes.data ?? []).map((n) => (
            <article key={n.id} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium">
                  {n.symbol ? `${n.symbol} · ` : ""}
                  {n.title}
                </h2>
                <button
                  className="text-xs text-muted-foreground underline"
                  onClick={async () => {
                    await deleteNote(n.id);
                    qc.invalidateQueries({ queryKey: ["notes"] });
                  }}
                >
                  刪除
                </button>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{n.body}</p>
              <div className="mt-2 text-[11px] text-faint">{n.updatedAt.slice(0, 16)}</div>
            </article>
          ))
        )}
      </div>
    </AppShell>
  );
}
