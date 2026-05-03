import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCreateOpnameSession } from "@/hooks/useStockOpname";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";

interface Props {
  onCreated: (sessionId: string) => void;
}

export function CreateOpnameForm({ onCreated }: Props) {
  const { user } = useAuth();
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const createSession = useCreateOpnameSession();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const handleSubmit = async () => {
    if (!categoryId || !user) return;
    try {
      const result = await createSession.mutateAsync({
        category_id: categoryId,
        notes,
        created_by: user.id,
      });
      toast.success("Sesi opname dibuat ✓");
      onCreated(result.id);
    } catch {
      toast.error("Sesi opname belum bisa dibuat. Silakan coba lagi.");
    }
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Buat Sesi Opname Baru</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
            <SelectContent>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Catatan (opsional)</Label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Catatan sesi opname…" />
        </div>
        <Button onClick={handleSubmit} disabled={!categoryId || createSession.isPending}>
          {createSession.isPending ? "Membuat…" : "Buat Sesi"}
        </Button>
      </CardContent>
    </Card>
  );
}
