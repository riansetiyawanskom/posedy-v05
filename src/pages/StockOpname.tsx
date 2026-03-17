import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateOpnameForm } from "@/components/stock-opname/CreateOpnameForm";
import { OpnameSessionList } from "@/components/stock-opname/OpnameSessionList";
import { OpnameDetail } from "@/components/stock-opname/OpnameDetail";
import { AppLayout } from "@/components/AppLayout";

const StockOpname = () => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <AppLayout title="Stok Opname">
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 3.5rem)" }}>
        <aside className="w-[340px] shrink-0 overflow-y-auto border-r border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-semibold text-card-foreground">Sesi</p>
            <Button size="sm" onClick={() => { setShowCreate(true); setSelectedSessionId(null); }}>
              + Sesi Baru
            </Button>
          </div>
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
    </AppLayout>
  );
};

export default StockOpname;
