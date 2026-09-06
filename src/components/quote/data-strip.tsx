import { Badge } from "@/components/ui/badge";
import { formatDateTimeTaipei, sessionLabel, statusLabel } from "@/lib/domain/format";
import type { DataProvenance } from "@/lib/domain/types";

export function DataStrip({
  provenance,
  error,
}: {
  provenance?: DataProvenance | null;
  error?: string | null;
}) {
  if (!provenance && !error) return null;
  const stale = provenance?.status === "stale" || provenance?.status === "unavailable";
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {provenance ? (
        <>
          <Badge variant={stale ? "warn" : "outline"}>{statusLabel(provenance.status)}</Badge>
          <Badge variant="outline">{sessionLabel(provenance.session)}</Badge>
          <span>來源 {provenance.source}</span>
          <span>行情時間 {formatDateTimeTaipei(provenance.eventTime)}</span>
          <span>取得時間 {formatDateTimeTaipei(provenance.fetchedAt)}</span>
          <span>{provenance.adjustment === "raw" ? "原始價格" : "還原價格"}</span>
        </>
      ) : null}
      {error ? <Badge variant="warn">{error}</Badge> : null}
    </div>
  );
}
