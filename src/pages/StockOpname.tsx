import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateOpnameForm } from "@/components/stock-opname/CreateOpnameForm";
import { OpnameSessionList } from "@/components/stock-opname/OpnameSessionList";
import { OpnameDetail } from "@/components/stock-opname/OpnameDetail";

const StockOpname = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
        <div className="flex items-center gap-2.5">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
            <ClipboardCheck className="h-4 w-4 text-accent-foreground" />
          </div>
          <h1 className="text-base font-extrabold tracking-tight text-card-foreground">
            Stok Opname
          </h1>
        </div>
        <Button size="sm" onClick={() => { setShowCreate(true); setSelectedSessionId(null); }}>
          + Sesi Baru
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-[340px] shrink-0 overflow-y-auto border-r border-border p-4">
          <OpnameSessionList
            selectedId={selectedSessionId}
            onSelect={(id) => { setSelectedSessionId(id); setShowCreate(false); }}
          />
        </aside>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {showCreate && !selectedSessionId ? (
            <CreateOpnameForm
              onCreated={(id) => { setSelectedSessionId(id); setShowCreate(false); }}
            />
          ) : selectedSessionId ? (
            <OpnameDetail sessionId={selectedSessionId} />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Pilih sesi opname atau buat sesi baru
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default StockOpname;
