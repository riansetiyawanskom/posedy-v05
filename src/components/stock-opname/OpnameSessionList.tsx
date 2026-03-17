import { useOpnameSessions } from "@/hooks/useStockOpname";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function OpnameSessionList({ selectedId, onSelect }: Props) {
  const { data: sessions, isLoading } = useOpnameSessions();

  if (isLoading) return <p className="text-sm text-muted-foreground">Memuat…</p>;
  if (!sessions?.length) return <p className="text-sm text-muted-foreground">Belum ada sesi opname.</p>;

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s.id)}
          className={cn(
            "w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary",
            selectedId === s.id && "border-primary bg-secondary"
          )}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-card-foreground">{s.session_number}</span>
            <Badge variant={s.status === "open" ? "default" : "secondary"}>
              {s.status === "open" ? "Buka" : "Selesai"}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {s.categories?.name} — {format(new Date(s.created_at), "dd/MM/yyyy HH:mm")}
          </p>
        </button>
      ))}
    </div>
  );
}
