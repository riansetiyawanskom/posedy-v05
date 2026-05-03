import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStockAdjustments, useSubmitAdjustments, useOpnameSessions } from "@/hooks/useStockOpname";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { friendlyError } from "@/lib/friendlyMessage";
import { format } from "date-fns";

interface Props {
  sessionId: string;
}

interface ProductRow {
  id: string;
  name: string;
  stock: number;
  physical_stock: number;
}

export function OpnameDetail({ sessionId }: Props) {
  const { user } = useAuth();
  const { data: sessions } = useOpnameSessions();
  const session = sessions?.find((s) => s.id === sessionId);
  const { data: adjustments } = useStockAdjustments(sessionId);
  const submitAdjustments = useSubmitAdjustments();
  const [products, setProducts] = useState<ProductRow[]>([]);

  const isOpen = session?.status === "open";
  const isClosed = session?.status === "closed";

  // Fetch products for the category
  const { data: categoryProducts } = useQuery({
    queryKey: ["products_by_category", session?.category_id],
    enabled: !!session?.category_id && isOpen,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock")
        .eq("category_id", session!.category_id)
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (categoryProducts && isOpen) {
      setProducts(
        categoryProducts.map((p) => ({
          id: p.id,
          name: p.name,
          stock: p.stock ?? 0,
          physical_stock: p.stock ?? 0,
        }))
      );
    }
  }, [categoryProducts, isOpen]);

  const updatePhysical = (productId: string, value: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, physical_stock: value } : p))
    );
  };

  const handleSubmit = async () => {
    if (!user) return;
    try {
      await submitAdjustments.mutateAsync({
        session_id: sessionId,
        adjustments: products.map((p) => ({
          product_id: p.id,
          product_name: p.name,
          system_stock: p.stock,
          physical_stock: p.physical_stock,
        })),
        adjusted_by: user.id,
      });
      toast.success("Opname selesai! Stok telah disesuaikan.");
    } catch {
      toast.error("Gagal menyimpan hasil opname");
    }
  };

  if (!session) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{session.session_number}</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              {session.categories?.name} — {format(new Date(session.created_at), "dd/MM/yyyy HH:mm")}
            </p>
          </div>
          <Badge variant={isOpen ? "default" : "secondary"}>
            {isOpen ? "Buka" : "Selesai"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Open session: show input form */}
        {isOpen && (
          <>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-foreground font-semibold">Produk</TableHead>
                    <TableHead className="text-foreground font-semibold text-center w-28">Stok Sistem</TableHead>
                    <TableHead className="text-foreground font-semibold text-center w-32">Stok Fisik</TableHead>
                    <TableHead className="text-foreground font-semibold text-center w-28">Selisih</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => {
                    const diff = p.physical_stock - p.stock;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-foreground font-medium">{p.name}</TableCell>
                        <TableCell className="text-center text-foreground">{p.stock}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min={0}
                            value={p.physical_stock}
                            onChange={(e) => updatePhysical(p.id, parseInt(e.target.value) || 0)}
                            className="mx-auto w-20 text-center"
                          />
                        </TableCell>
                        <TableCell className={`text-center font-semibold ${diff < 0 ? "text-destructive" : diff > 0 ? "text-accent" : "text-foreground"}`}>
                          {diff > 0 ? `+${diff}` : diff}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {products.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        Tidak ada produk di kategori ini
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSubmit} disabled={submitAdjustments.isPending || products.length === 0}>
                {submitAdjustments.isPending ? "Menyimpan…" : "Simpan & Selesaikan Opname"}
              </Button>
            </div>
          </>
        )}

        {/* Closed session: show audit log */}
        {isClosed && adjustments && (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="font-semibold" style={{ color: "hsl(220 10% 30%)" }}>Produk</TableHead>
                  <TableHead className="font-semibold text-center" style={{ color: "hsl(220 10% 30%)" }}>Stok Sistem</TableHead>
                  <TableHead className="font-semibold text-center" style={{ color: "hsl(220 10% 30%)" }}>Stok Fisik</TableHead>
                  <TableHead className="font-semibold text-center" style={{ color: "hsl(220 10% 30%)" }}>Selisih</TableHead>
                  <TableHead className="font-semibold" style={{ color: "hsl(220 10% 30%)" }}>Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell style={{ color: "hsl(220 10% 30%)" }} className="font-medium">{a.product_name}</TableCell>
                    <TableCell style={{ color: "hsl(220 10% 30%)" }} className="text-center">{a.system_stock}</TableCell>
                    <TableCell style={{ color: "hsl(220 10% 30%)" }} className="text-center">{a.physical_stock}</TableCell>
                    <TableCell className={`text-center font-semibold ${a.difference < 0 ? "text-destructive" : a.difference > 0 ? "text-accent" : ""}`} style={a.difference === 0 ? { color: "hsl(220 10% 30%)" } : undefined}>
                      {a.difference > 0 ? `+${a.difference}` : a.difference}
                    </TableCell>
                    <TableCell style={{ color: "hsl(220 10% 30%)" }} className="text-xs">
                      {format(new Date(a.created_at), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
